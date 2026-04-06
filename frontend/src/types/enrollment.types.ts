/**
 * Enrollment type definitions
 */

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent?: number;
}

export interface Enrollment {
  _id: string;
  studentId: string;
  student?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  courseId: string;
  course?: {
    _id: string;
    title: string;
    thumbnail?: string;
    instructorId: string;
  };
  enrolledAt: string;
  completionPercentage: number;
  isCompleted: boolean;
  completedAt?: string;
  lessonProgress: LessonProgress[];
}

export interface EnrollmentState {
  enrollments: Enrollment[];
  currentEnrollment: Enrollment | null;
  isLoading: boolean;
  error: string | null;
}

export interface UpdateProgressData {
  lessonId: string;
  completed: boolean;
  timeSpent: number;
}
