import mongoose from 'mongoose';
import Course from '../models/Course';
import DiscussionThread, {
  IDiscussionReply,
  IDiscussionThread,
} from '../models/DiscussionThread';
import Enrollment from '../models/Enrollment';
import User, { UserRole } from '../models/User';
import { NotificationType } from '../models/Notification';
import { createTriggeredNotification } from './notification.service';

interface DiscussionAuthorDTO {
  _id: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
}

export interface DiscussionReplyDTO {
  _id: string;
  author: DiscussionAuthorDTO;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscussionThreadDTO {
  _id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  title: string;
  content: string;
  author: DiscussionAuthorDTO;
  replies: DiscussionReplyDTO[];
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RequestContext {
  requesterId: string;
  requesterRole: UserRole | string;
}

interface ScopeResolution {
  moduleId?: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId;
  moduleTitle?: string;
  lessonTitle?: string;
}

const ensureValidObjectId = (value: string, label: string): void => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
};

const mapAuthor = (rawAuthor: any): DiscussionAuthorDTO => ({
  _id: String(rawAuthor?._id ?? ''),
  firstName: rawAuthor?.firstName ?? 'Unknown',
  lastName: rawAuthor?.lastName ?? 'User',
  role: rawAuthor?.role ?? UserRole.STUDENT,
});

const mapReply = (reply: IDiscussionReply | any): DiscussionReplyDTO => ({
  _id: String(reply?._id ?? ''),
  author: mapAuthor(reply?.authorId),
  content: reply?.content ?? '',
  createdAt: reply?.createdAt ?? new Date(),
  updatedAt: reply?.updatedAt ?? reply?.createdAt ?? new Date(),
});

const mapThread = (thread: IDiscussionThread | any): DiscussionThreadDTO => ({
  _id: String(thread?._id ?? ''),
  courseId: String(thread?.courseId ?? ''),
  moduleId: thread?.moduleId ? String(thread.moduleId) : undefined,
  lessonId: thread?.lessonId ? String(thread.lessonId) : undefined,
  title: thread?.title ?? '',
  content: thread?.content ?? '',
  author: mapAuthor(thread?.authorId),
  replies: Array.isArray(thread?.replies) ? thread.replies.map(mapReply) : [],
  replyCount: Array.isArray(thread?.replies) ? thread.replies.length : 0,
  createdAt: thread?.createdAt ?? new Date(),
  updatedAt: thread?.updatedAt ?? new Date(),
});

const getCourseForDiscussion = async (courseId: string) => {
  ensureValidObjectId(courseId, 'course ID');

  const course = await Course.findById(courseId).select(
    'title instructorId modules._id modules.title modules.lessons._id modules.lessons.title'
  );

  if (!course) {
    throw new Error('Course not found');
  }

  return course;
};

const ensureDiscussionAccess = async (
  courseId: string,
  requesterId: string,
  requesterRole: UserRole | string
) => {
  ensureValidObjectId(requesterId, 'requester ID');
  const course = await getCourseForDiscussion(courseId);

  if (requesterRole === UserRole.ADMIN) {
    return course;
  }

  if (requesterRole === UserRole.INSTRUCTOR) {
    if (course.instructorId.toString() !== requesterId) {
      throw new Error('Access denied');
    }

    return course;
  }

  if (requesterRole === UserRole.STUDENT) {
    const enrollment = await Enrollment.findOne({
      studentId: requesterId,
      courseId,
    }).select('_id');

    if (!enrollment) {
      throw new Error('You must be enrolled in this course to access discussions');
    }

    return course;
  }

  throw new Error('Access denied');
};

const resolveScope = (
  course: Awaited<ReturnType<typeof getCourseForDiscussion>>,
  moduleId?: string,
  lessonId?: string
): ScopeResolution => {
  if (!moduleId && !lessonId) {
    return {};
  }

  if (lessonId) {
    ensureValidObjectId(lessonId, 'lesson ID');

    for (const module of course.modules) {
      const lesson = module.lessons.find(
        (candidate) => candidate._id.toString() === lessonId
      );

      if (!lesson) {
        continue;
      }

      if (moduleId && module._id.toString() !== moduleId) {
        throw new Error('Lesson does not belong to the provided module');
      }

      return {
        moduleId: module._id as mongoose.Types.ObjectId,
        lessonId: lesson._id as mongoose.Types.ObjectId,
        moduleTitle: module.title,
        lessonTitle: lesson.title,
      };
    }

    throw new Error('Lesson not found in course');
  }

  ensureValidObjectId(moduleId as string, 'module ID');

  const module = course.modules.find((candidate) => candidate._id.toString() === moduleId);
  if (!module) {
    throw new Error('Module not found in course');
  }

  return {
    moduleId: module._id as mongoose.Types.ObjectId,
    moduleTitle: module.title,
  };
};

const populateDiscussionThread = async (threadQuery: Promise<any>) => {
  const thread = await threadQuery;
  if (!thread) {
    return null;
  }

  await thread.populate([
    { path: 'authorId', select: 'firstName lastName role' },
    { path: 'replies.authorId', select: 'firstName lastName role' },
  ]);

  return thread;
};

const notifyUsers = async (
  recipientIds: string[],
  payload: { title: string; message: string; data?: Record<string, any> }
): Promise<void> => {
  const uniqueRecipientIds = Array.from(new Set(recipientIds.filter(Boolean)));

  await Promise.all(
    uniqueRecipientIds.map(async (userId) => {
      try {
        await createTriggeredNotification({
          userId,
          type: NotificationType.DISCUSSION_REPLY,
          title: payload.title,
          message: payload.message,
          data: payload.data,
        });
      } catch (error) {
        console.error('Failed to create discussion notification:', error);
      }
    })
  );
};

const buildScopeLabel = (scope: ScopeResolution): string => {
  if (scope.lessonTitle) {
    return `lesson "${scope.lessonTitle}"`;
  }

  if (scope.moduleTitle) {
    return `module "${scope.moduleTitle}"`;
  }

  return 'the course discussion board';
};

export const listDiscussionThreads = async (
  params: RequestContext & {
    courseId: string;
  }
): Promise<DiscussionThreadDTO[]> => {
  await ensureDiscussionAccess(params.courseId, params.requesterId, params.requesterRole);

  const threads = await DiscussionThread.find({ courseId: params.courseId })
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate('authorId', 'firstName lastName role')
    .populate('replies.authorId', 'firstName lastName role');

  return threads.map(mapThread);
};

export const createDiscussionThread = async (
  params: RequestContext & {
    courseId: string;
    title: string;
    content: string;
    moduleId?: string;
    lessonId?: string;
  }
): Promise<DiscussionThreadDTO> => {
  const course = await ensureDiscussionAccess(
    params.courseId,
    params.requesterId,
    params.requesterRole
  );

  const title = params.title?.trim();
  const content = params.content?.trim();

  if (!title || title.length < 3) {
    throw new Error('Thread title must be at least 3 characters');
  }

  if (!content || content.length < 5) {
    throw new Error('Thread content must be at least 5 characters');
  }

  const scope = resolveScope(course, params.moduleId, params.lessonId);

  const createdThread = await populateDiscussionThread(
    DiscussionThread.create({
      courseId: course._id,
      moduleId: scope.moduleId,
      lessonId: scope.lessonId,
      authorId: params.requesterId,
      title,
      content,
    }).then((thread) => DiscussionThread.findById(thread._id))
  );

  if (!createdThread) {
    throw new Error('Failed to create discussion thread');
  }

  if (
    params.requesterRole === UserRole.STUDENT &&
    course.instructorId.toString() !== params.requesterId
  ) {
    const author = await User.findById(params.requesterId).select('firstName lastName');
    const authorName = author
      ? `${author.firstName} ${author.lastName}`.trim()
      : 'A student';

    await notifyUsers([course.instructorId.toString()], {
      title: 'New course discussion thread',
      message: `${authorName} started a new thread in ${buildScopeLabel(scope)}.`,
      data: {
        courseId: course._id.toString(),
        threadId: createdThread._id.toString(),
        lessonId: scope.lessonId?.toString(),
      },
    });
  }

  return mapThread(createdThread);
};

export const addDiscussionReply = async (
  params: RequestContext & {
    threadId: string;
    content: string;
  }
): Promise<DiscussionThreadDTO> => {
  ensureValidObjectId(params.threadId, 'thread ID');

  const thread = await DiscussionThread.findById(params.threadId);
  if (!thread) {
    throw new Error('Discussion thread not found');
  }

  const course = await ensureDiscussionAccess(
    thread.courseId.toString(),
    params.requesterId,
    params.requesterRole
  );

  const content = params.content?.trim();
  if (!content || content.length < 2) {
    throw new Error('Reply content must be at least 2 characters');
  }

  thread.replies.push({
    authorId: new mongoose.Types.ObjectId(params.requesterId),
    content,
  } as IDiscussionReply);

  await thread.save();

  const populatedThread = await populateDiscussionThread(DiscussionThread.findById(thread._id));
  if (!populatedThread) {
    throw new Error('Failed to load updated discussion thread');
  }

  const replyAuthor = await User.findById(params.requesterId).select('firstName lastName');
  const replyAuthorName = replyAuthor
    ? `${replyAuthor.firstName} ${replyAuthor.lastName}`.trim()
    : 'A course member';

  const recipientIds: string[] = [];
  if (thread.authorId.toString() !== params.requesterId) {
    recipientIds.push(thread.authorId.toString());
  }
  if (
    params.requesterRole === UserRole.STUDENT &&
    course.instructorId.toString() !== params.requesterId
  ) {
    recipientIds.push(course.instructorId.toString());
  }

  await notifyUsers(recipientIds, {
    title: 'New discussion reply',
    message: `${replyAuthorName} replied to "${thread.title}".`,
    data: {
      courseId: course._id.toString(),
      threadId: thread._id.toString(),
      lessonId: thread.lessonId?.toString(),
    },
  });

  return mapThread(populatedThread);
};
