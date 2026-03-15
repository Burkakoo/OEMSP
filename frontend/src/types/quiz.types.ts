/**
 * Quiz type definitions
 */

export type QuestionType = 'multiple_choice' | 'true_false' | 'multi_select' | 'short_answer';

export interface QuizQuestion {
  _id: string;
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface QuizCourseRef {
  _id: string;
  title?: string;
  instructorId?: string;
}

export interface Quiz {
  _id: string;
  courseId: string | QuizCourseRef;
  moduleId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  duration: number;
  passingScore: number;
  maxAttempts: number;
  isPublished?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface QuizSubmission {
  answers: QuizAnswer[];
  startTime?: string;
}

export interface QuizGradedAnswer {
  questionId: string;
  studentAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuizResult {
  _id: string;
  quizId: string | { _id: string; title?: string; passingScore?: number; maxAttempts?: number };
  studentId: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  score: number;
  percentage: number;
  passed: boolean;
  answers: QuizGradedAnswer[];
  submittedAt: string;
  attemptNumber: number;
  gradedAt?: string;
}

export interface QuizStatistics {
  totalAttempts: number;
  uniqueStudents: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}

export interface QuizState {
  currentQuiz: Quiz | null;
  quizResults: QuizResult[];
  currentResult: QuizResult | null;
  quizStatistics: QuizStatistics | null;
  isLoading: boolean;
  error: string | null;
  timeRemaining: number | null;
  isTimerActive: boolean;
}
