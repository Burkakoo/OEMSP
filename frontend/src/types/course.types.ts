/**
 * Course type definitions
 */

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  type?: LessonType;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  resources?: Array<{ title: string; url: string; type: string }>;
  attachments?: Attachment[];
  isDripEnabled: boolean;
  dripDelayDays: number;
}

export type LessonType = 'video' | 'text' | 'quiz' | 'assignment';
export type DiscountType = 'percentage' | 'fixed';
export type CourseCurrency = 'ETB' | 'USD' | 'EUR';
export type CourseReviewStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'changes_requested';

export interface Attachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  currency: CourseCurrency;
  isFree?: boolean;
  saleEnabled: boolean;
  saleType?: DiscountType;
  saleValue: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  currentPrice: number;
  hasActiveSale: boolean;
  saleDiscountAmount: number;
  thumbnail?: string;
  isPublished: boolean;
  modules: Module[];
  enrollmentCount: number;
  prerequisites?: string[];
  learningObjectives?: string[];
  rating?: number;
  reviewStatus?: CourseReviewStatus;
  reviewNotes?: string;
  submittedForReviewAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  category?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  reviewStatus?: CourseReviewStatus;
  instructorId?: string;
}

export interface CoursesState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  filters: CourseFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCourseData {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isFree?: boolean;
  currency?: CourseCurrency;
  saleEnabled?: boolean;
  saleType?: DiscountType;
  saleValue?: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  thumbnail?: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  isPublished?: boolean;
}

export interface CreateModuleData {
  title: string;
  description: string;
  order: number;
}

export interface CreateLessonData {
  title: string;
  description: string;
  type: LessonType;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isDripEnabled?: boolean;
  dripDelayDays?: number;
}
