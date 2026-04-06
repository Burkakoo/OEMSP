export type AssignmentSubmissionStatus = 'submitted' | 'graded';

export interface AssignmentUserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface AssignmentCourseSummary {
  _id: string;
  title: string;
}

export interface AssignmentAttachment {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export interface AssignmentSubmission {
  _id: string;
  studentId: string | AssignmentUserSummary;
  courseId: string | AssignmentCourseSummary;
  moduleId: string;
  lessonId: string;
  moduleTitle: string;
  lessonTitle: string;
  courseTitle: string;
  submissionText: string;
  attachments: AssignmentAttachment[];
  status: AssignmentSubmissionStatus;
  score?: number;
  feedback?: string;
  gradedBy?: string | AssignmentUserSummary;
  submittedAt: string;
  gradedAt?: string;
  updatedAt: string;
}
