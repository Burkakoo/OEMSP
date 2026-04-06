import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import AssignmentSubmission, {
  AssignmentSubmissionStatus,
  IAssignmentAttachment,
} from '../models/AssignmentSubmission';
import Course, { ALLOWED_FILE_TYPES, LessonType, MAX_FILE_SIZE } from '../models/Course';
import Enrollment from '../models/Enrollment';
import { NotificationType } from '../models/Notification';
import { UserRole } from '../models/User';
import { createNotification } from './notification.service';
import { getLessonAvailability } from '../utils/lesson-access.utils';

interface AttachmentInput {
  fileName: string;
  fileType: string;
  fileData: string;
}

interface SubmitAssignmentInput {
  courseId: string;
  moduleId: string;
  lessonId: string;
  submissionText?: string;
  attachments?: AttachmentInput[];
}

interface ListAssignmentFilters {
  requesterId: string;
  requesterRole: UserRole | string;
  courseId?: string;
  lessonId?: string;
  status?: AssignmentSubmissionStatus;
  page?: number;
  limit?: number;
}

interface GradeAssignmentInput {
  score: number;
  feedback?: string;
}

const ASSIGNMENT_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'assignment-submissions');

const ensureValidObjectId = (value: string, fieldName: string): void => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

const normalizeAttachmentPayload = (attachments: AttachmentInput[] | undefined): AttachmentInput[] => {
  if (!attachments) {
    return [];
  }

  if (!Array.isArray(attachments)) {
    throw new Error('Attachments must be an array');
  }

  return attachments;
};

const decodeAttachment = (attachment: AttachmentInput): { fileBuffer: Buffer; fileType: string } => {
  if (!attachment.fileName?.trim()) {
    throw new Error('Attachment fileName is required');
  }
  if (!attachment.fileType?.trim()) {
    throw new Error('Attachment fileType is required');
  }
  if (!attachment.fileData?.trim()) {
    throw new Error('Attachment fileData is required');
  }

  const fileType = attachment.fileType.trim().toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    throw new Error(`Unsupported file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  const normalizedBase64Candidate = attachment.fileData.includes(',')
    ? attachment.fileData.split(',')[1]
    : attachment.fileData;
  const normalizedBase64 =
    typeof normalizedBase64Candidate === 'string' ? normalizedBase64Candidate : '';
  if (!normalizedBase64) {
    throw new Error('Attachment fileData is invalid');
  }

  const fileBuffer = Buffer.from(normalizedBase64, 'base64');
  if (!fileBuffer.length) {
    throw new Error('Decoded attachment is empty');
  }
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Attachment exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  return { fileBuffer, fileType };
};

const getStoredAttachmentPath = (
  submissionId: string,
  attachmentId: string,
  fileType: string
): string =>
  path.join(
    ASSIGNMENT_UPLOADS_DIR,
    `${submissionId}-${attachmentId}.${String(fileType).toLowerCase()}`
  );

const resolveAssignmentLesson = (course: any, moduleId: string, lessonId: string) => {
  const module = course.modules.id(moduleId);
  if (!module) {
    throw new Error('Module not found');
  }

  const lesson = module.lessons.id(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }

  if (lesson.type !== LessonType.ASSIGNMENT) {
    throw new Error('Selected lesson is not an assignment');
  }

  return {
    module,
    lesson,
  };
};

const mapSubmission = (submission: any) => {
  const course = submission.courseId;
  const moduleId = String(submission.moduleId);
  const lessonId = String(submission.lessonId);

  let moduleTitle = '';
  let lessonTitle = '';

  if (course && typeof course === 'object' && Array.isArray(course.modules)) {
    const resolvedModule = course.modules.find((module: any) => String(module?._id) === moduleId);
    if (resolvedModule) {
      moduleTitle = resolvedModule.title ?? '';
      const resolvedLesson = Array.isArray(resolvedModule.lessons)
        ? resolvedModule.lessons.find((lesson: any) => String(lesson?._id) === lessonId)
        : undefined;
      lessonTitle = resolvedLesson?.title ?? '';
    }
  }

  return {
    ...submission.toObject(),
    moduleTitle,
    lessonTitle,
    courseTitle: course?.title ?? '',
  };
};

const cleanupWrittenFiles = async (filePaths: string[]): Promise<void> => {
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore best-effort cleanup failures.
      }
    })
  );
};

const ensureStudentEnrollment = async (studentId: string, courseId: string) => {
  const enrollment = await Enrollment.findOne({ studentId, courseId }).select('_id enrolledAt');
  if (!enrollment) {
    throw new Error('You must be enrolled in this course to submit this assignment');
  }

  return enrollment;
};

export const submitAssignment = async (
  studentId: string,
  input: SubmitAssignmentInput,
  baseUrl: string
): Promise<any> => {
  ensureValidObjectId(studentId, 'student ID');
  ensureValidObjectId(input.courseId, 'course ID');
  ensureValidObjectId(input.moduleId, 'module ID');
  ensureValidObjectId(input.lessonId, 'lesson ID');

  const course = await Course.findById(input.courseId).select(
    'title instructorId modules._id modules.title modules.lessons'
  );
  if (!course) {
    throw new Error('Course not found');
  }

  const { lesson } = resolveAssignmentLesson(course, input.moduleId, input.lessonId);
  const enrollment = await ensureStudentEnrollment(studentId, input.courseId);
  const availability = getLessonAvailability(lesson, enrollment.enrolledAt);
  if (availability.isLocked) {
    throw new Error('This assignment is not available yet because it is still on drip release');
  }

  const submissionText = input.submissionText?.trim() ?? '';
  const requestedAttachments = normalizeAttachmentPayload(input.attachments);
  const existingSubmission = await AssignmentSubmission.findOne({
    studentId,
    courseId: input.courseId,
    lessonId: input.lessonId,
  });

  if (
    !submissionText &&
    requestedAttachments.length === 0 &&
    (!existingSubmission || existingSubmission.attachments.length === 0)
  ) {
    throw new Error('Submission text or at least one attachment is required');
  }

  await fs.mkdir(ASSIGNMENT_UPLOADS_DIR, { recursive: true });

  const submissionId = existingSubmission?._id ?? new mongoose.Types.ObjectId();
  const storedAttachments: IAssignmentAttachment[] = [];
  const newFilePaths: string[] = [];

  try {
    for (const attachment of requestedAttachments) {
      const { fileBuffer, fileType } = decodeAttachment(attachment);
      const attachmentId = new mongoose.Types.ObjectId();
      const storedFilePath = getStoredAttachmentPath(
        submissionId.toString(),
        attachmentId.toString(),
        fileType
      );

      await fs.writeFile(storedFilePath, fileBuffer);
      newFilePaths.push(storedFilePath);

      storedAttachments.push({
        _id: attachmentId,
        fileName: attachment.fileName.trim(),
        fileType,
        fileSize: fileBuffer.length,
        fileUrl: `${baseUrl}/api/v1/assignments/${submissionId.toString()}/attachments/${attachmentId.toString()}/download`,
        uploadedAt: new Date(),
      });
    }

    const nextAttachments = existingSubmission
      ? [...existingSubmission.attachments, ...storedAttachments]
      : storedAttachments;

    const submission =
      existingSubmission ??
      new AssignmentSubmission({
        _id: submissionId,
        studentId,
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
      });

    submission.moduleId = new mongoose.Types.ObjectId(input.moduleId);
    submission.lessonId = new mongoose.Types.ObjectId(input.lessonId);
    submission.submissionText = submissionText;
    submission.attachments = nextAttachments as any;
    submission.status = AssignmentSubmissionStatus.SUBMITTED;
    submission.score = undefined;
    submission.feedback = undefined;
    submission.gradedBy = undefined;
    submission.gradedAt = undefined;
    submission.submittedAt = new Date();

    await submission.save();

    await createNotification({
      userId: course.instructorId.toString(),
      type: NotificationType.SYSTEM,
      title: 'New assignment submission',
      message: `A student submitted work for "${lesson.title}" in "${course.title}".`,
      data: {
        assignmentSubmissionId: submission._id.toString(),
        courseId: course._id.toString(),
        lessonId: input.lessonId,
      },
    });

    const hydratedSubmission = await AssignmentSubmission.findById(submission._id)
      .populate('studentId', 'firstName lastName email')
      .populate('gradedBy', 'firstName lastName email')
      .populate(
        'courseId',
        'title instructorId modules._id modules.title modules.lessons._id modules.lessons.title'
      );

    return mapSubmission(hydratedSubmission ?? submission);
  } catch (error) {
    await cleanupWrittenFiles(newFilePaths);
    throw error;
  }
};

export const listAssignmentSubmissions = async (filters: ListAssignmentFilters): Promise<{
  submissions: any[];
  total: number;
  page: number;
  pages: number;
}> => {
  const {
    requesterId,
    requesterRole,
    courseId,
    lessonId,
    status,
    page = 1,
    limit = 20,
  } = filters;

  ensureValidObjectId(requesterId, 'requester ID');
  if (courseId) ensureValidObjectId(courseId, 'course ID');
  if (lessonId) ensureValidObjectId(lessonId, 'lesson ID');
  if (status && !Object.values(AssignmentSubmissionStatus).includes(status)) {
    throw new Error('Invalid assignment status');
  }

  const query: any = {};

  if (courseId) {
    query.courseId = courseId;
  }
  if (lessonId) {
    query.lessonId = lessonId;
  }
  if (status) {
    query.status = status;
  }

  if (requesterRole === UserRole.STUDENT) {
    query.studentId = requesterId;
  } else if (requesterRole === UserRole.INSTRUCTOR) {
    const ownedCourses = await Course.find(
      courseId ? { _id: courseId, instructorId: requesterId } : { instructorId: requesterId }
    ).select('_id');

    if (courseId && ownedCourses.length === 0) {
      throw new Error('Access denied');
    }

    const ownedCourseIds = ownedCourses.map((course) => course._id);
    if (!courseId) {
      if (ownedCourseIds.length === 0) {
        return { submissions: [], total: 0, page, pages: 0 };
      }
      query.courseId = { $in: ownedCourseIds };
    }
  }

  const skip = (page - 1) * limit;
  const [submissions, total] = await Promise.all([
    AssignmentSubmission.find(query)
      .populate('studentId', 'firstName lastName email')
      .populate('gradedBy', 'firstName lastName email')
      .populate(
        'courseId',
        'title instructorId modules._id modules.title modules.lessons._id modules.lessons.title'
      )
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit),
    AssignmentSubmission.countDocuments(query),
  ]);

  return {
    submissions: submissions.map(mapSubmission),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

export const getAssignmentSubmission = async (
  submissionId: string,
  requesterId: string,
  requesterRole: UserRole | string
): Promise<any> => {
  ensureValidObjectId(submissionId, 'submission ID');
  ensureValidObjectId(requesterId, 'requester ID');

  const submission = await AssignmentSubmission.findById(submissionId)
    .populate('studentId', 'firstName lastName email')
    .populate('gradedBy', 'firstName lastName email')
    .populate(
      'courseId',
      'title instructorId modules._id modules.title modules.lessons._id modules.lessons.title'
    );

  if (!submission) {
    throw new Error('Assignment submission not found');
  }

  const studentId =
    typeof submission.studentId === 'object' && submission.studentId?._id
      ? submission.studentId._id.toString()
      : submission.studentId.toString();
  const courseForOwnership = submission.courseId as any;
  const courseInstructorId = courseForOwnership?.instructorId?.toString?.() ?? '';

  if (requesterRole === UserRole.STUDENT && studentId !== requesterId) {
    throw new Error('Access denied');
  }

  if (requesterRole === UserRole.INSTRUCTOR && courseInstructorId !== requesterId) {
    throw new Error('Access denied');
  }

  return mapSubmission(submission);
};

export const gradeAssignment = async (
  submissionId: string,
  graderId: string,
  requesterRole: UserRole | string,
  input: GradeAssignmentInput
): Promise<any> => {
  ensureValidObjectId(submissionId, 'submission ID');
  ensureValidObjectId(graderId, 'grader ID');

  if (typeof input.score !== 'number' || Number.isNaN(input.score)) {
    throw new Error('Valid score is required');
  }
  if (input.score < 0 || input.score > 100) {
    throw new Error('Score must be between 0 and 100');
  }

  const submission = await AssignmentSubmission.findById(submissionId).populate(
    'courseId',
    'title instructorId modules._id modules.title modules.lessons._id modules.lessons.title'
  );
  if (!submission) {
    throw new Error('Assignment submission not found');
  }

  const course = submission.courseId as any;
  const instructorId = course?.instructorId?.toString?.() ?? '';
  if (requesterRole === UserRole.INSTRUCTOR && instructorId !== graderId) {
    throw new Error('Access denied');
  }

  submission.score = input.score;
  submission.feedback = input.feedback?.trim() ?? '';
  submission.status = AssignmentSubmissionStatus.GRADED;
  submission.gradedBy = new mongoose.Types.ObjectId(graderId);
  submission.gradedAt = new Date();
  await submission.save();

  const moduleId = submission.moduleId.toString();
  const lessonId = submission.lessonId.toString();
  const resolvedModule = Array.isArray(course?.modules)
    ? course.modules.find((module: any) => String(module?._id) === moduleId)
    : undefined;
  const resolvedLesson = Array.isArray(resolvedModule?.lessons)
    ? resolvedModule.lessons.find((lesson: any) => String(lesson?._id) === lessonId)
    : undefined;

  await createNotification({
    userId: submission.studentId.toString(),
    type: NotificationType.SYSTEM,
    title: 'Assignment graded',
    message: `Your submission for "${resolvedLesson?.title ?? 'assignment'}" has been graded.`,
    data: {
      assignmentSubmissionId: submission._id.toString(),
      courseId: course?._id?.toString?.() ?? submission.courseId.toString(),
      lessonId,
      score: input.score,
    },
  });

  const hydratedSubmission = await AssignmentSubmission.findById(submission._id)
    .populate('studentId', 'firstName lastName email')
    .populate('gradedBy', 'firstName lastName email')
    .populate(
      'courseId',
      'title instructorId modules._id modules.title modules.lessons._id modules.lessons.title'
    );

  return mapSubmission(hydratedSubmission ?? submission);
};

export const getAssignmentAttachmentDownload = async (
  submissionId: string,
  attachmentId: string,
  requesterId: string,
  requesterRole: UserRole | string
): Promise<{ filePath: string; fileName: string }> => {
  const submission = await getAssignmentSubmission(submissionId, requesterId, requesterRole);
  const attachment = Array.isArray(submission.attachments)
    ? submission.attachments.find((item: any) => String(item?._id) === attachmentId)
    : undefined;

  if (!attachment) {
    throw new Error('Assignment attachment not found');
  }

  const filePath = getStoredAttachmentPath(submissionId, attachmentId, attachment.fileType);
  try {
    await fs.access(filePath);
  } catch {
    throw new Error('Assignment attachment file not found on server');
  }

  return {
    filePath,
    fileName: attachment.fileName,
  };
};
