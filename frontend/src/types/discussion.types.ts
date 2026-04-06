export interface DiscussionAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface DiscussionReply {
  _id: string;
  author: DiscussionAuthor;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionThread {
  _id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  title: string;
  content: string;
  author: DiscussionAuthor;
  replies: DiscussionReply[];
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionThreadData {
  title: string;
  content: string;
  moduleId?: string;
  lessonId?: string;
}
