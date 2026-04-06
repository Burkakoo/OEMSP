/**
 * Course API service
 */

import apiRequest from './api';
import {
  Course,
  Module,
  Lesson,
  CreateCourseData,
  UpdateCourseData,
  CreateModuleData,
  CreateLessonData,
  CourseFilters,
} from '@/types/course.types';

interface CoursesResponse {
  success: boolean;
  data: {
    courses: Course[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface CourseResponse {
  success: boolean;
  data: Course;
}

interface ModuleResponse {
  success: boolean;
  module: Module;
}

interface LessonResponse {
  success: boolean;
  lesson: Lesson;
}

interface AttachmentUploadResponse {
  success: boolean;
  attachment: {
    _id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
  };
}

type BackendCourse = any;

const normalizeLesson = (rawLesson: any): Lesson => ({
  _id: String(rawLesson?._id ?? rawLesson?.id ?? ''),
  title: rawLesson?.title ?? '',
  description: rawLesson?.description,
  type: rawLesson?.type ?? 'text',
  content: rawLesson?.content ?? '',
  videoUrl: rawLesson?.videoUrl,
  duration: Number(rawLesson?.duration ?? 0),
  order: Number(rawLesson?.order ?? 0),
  resources: Array.isArray(rawLesson?.resources) ? rawLesson.resources : [],
  attachments: Array.isArray(rawLesson?.attachments) ? rawLesson.attachments : [],
  isDripEnabled: Boolean(rawLesson?.isDripEnabled),
  dripDelayDays: Number(rawLesson?.dripDelayDays ?? 0),
});

const normalizeModule = (rawModule: any): Module => ({
  _id: String(rawModule?._id ?? rawModule?.id ?? ''),
  title: rawModule?.title ?? '',
  description: rawModule?.description ?? '',
  order: Number(rawModule?.order ?? 0),
  lessons: Array.isArray(rawModule?.lessons)
    ? rawModule.lessons
        .map(normalizeLesson)
        .sort((a: Lesson, b: Lesson) => a.order - b.order)
    : [],
});

const normalizeCourse = (raw: BackendCourse): Course => {
  const id = String(raw?._id ?? raw?.id ?? '');

  const modules = Array.isArray(raw?.modules)
    ? raw.modules
        .map(normalizeModule)
        .sort((a: Module, b: Module) => a.order - b.order)
    : [];

  const instructorId = String(raw?.instructorId?._id ?? raw?.instructorId?.id ?? raw?.instructorId ?? '');

  const rawInstructor =
    raw?.instructor ??
    (raw?.instructorId && typeof raw.instructorId === 'object' ? raw.instructorId : undefined);
  const instructor =
    rawInstructor && (rawInstructor.firstName || rawInstructor.lastName)
      ? {
          _id: String(rawInstructor._id ?? rawInstructor.id ?? instructorId),
          firstName: rawInstructor.firstName ?? '',
          lastName: rawInstructor.lastName ?? '',
        }
      : undefined;

  return {
    _id: id,
    title: raw?.title ?? '',
    description: raw?.description ?? '',
    instructorId,
    instructor,
    category: raw?.category ?? '',
    level: raw?.level ?? 'beginner',
    price: Number(raw?.price ?? 0),
    currency: raw?.currency ?? 'ETB',
    isFree: Boolean(raw?.isFree),
    saleEnabled: Boolean(raw?.saleEnabled),
    saleType: raw?.saleType,
    saleValue: Number(raw?.saleValue ?? 0),
    saleStartsAt: raw?.saleStartsAt ? String(raw.saleStartsAt) : undefined,
    saleEndsAt: raw?.saleEndsAt ? String(raw.saleEndsAt) : undefined,
    currentPrice: Number(raw?.currentPrice ?? raw?.price ?? 0),
    hasActiveSale: Boolean(raw?.hasActiveSale),
    saleDiscountAmount: Number(raw?.saleDiscountAmount ?? 0),
    thumbnail: raw?.thumbnail,
    isPublished: Boolean(raw?.isPublished),
    modules,
    enrollmentCount: Number(raw?.enrollmentCount ?? 0),
    prerequisites: Array.isArray(raw?.prerequisites) ? raw.prerequisites : [],
    learningObjectives: Array.isArray(raw?.learningObjectives) ? raw.learningObjectives : [],
    rating: raw?.rating ?? 0,
    reviewStatus: raw?.reviewStatus,
    reviewNotes: raw?.reviewNotes,
    submittedForReviewAt: raw?.submittedForReviewAt ? String(raw.submittedForReviewAt) : undefined,
    reviewedAt: raw?.reviewedAt ? String(raw.reviewedAt) : undefined,
    createdAt: raw?.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    updatedAt: raw?.updatedAt ? String(raw.updatedAt) : new Date().toISOString(),
  };
};

const sanitizeCoursePayload = (payload: any): any => {
  const cleaned: any = { ...payload };

  if (typeof cleaned.title === 'string') cleaned.title = cleaned.title.trim();
  if (typeof cleaned.description === 'string') cleaned.description = cleaned.description.trim();
  if (typeof cleaned.category === 'string') cleaned.category = cleaned.category.trim();

  if (typeof cleaned.thumbnail === 'string') {
    const t = cleaned.thumbnail.trim();
    if (t.length === 0) delete cleaned.thumbnail;
    else cleaned.thumbnail = t;
  }

  cleaned.currency = cleaned.currency || 'ETB';

  if (cleaned.isFree) {
    cleaned.price = 0;
    cleaned.saleEnabled = false;
    delete cleaned.saleType;
    delete cleaned.saleValue;
    delete cleaned.saleStartsAt;
    delete cleaned.saleEndsAt;
  } else if (!cleaned.saleEnabled) {
    delete cleaned.saleType;
    delete cleaned.saleValue;
    delete cleaned.saleStartsAt;
    delete cleaned.saleEndsAt;
  } else {
    if (cleaned.saleValue !== undefined) {
      cleaned.saleValue = Number(cleaned.saleValue);
    }
    if (typeof cleaned.saleStartsAt === 'string' && cleaned.saleStartsAt.trim().length === 0) {
      delete cleaned.saleStartsAt;
    }
    if (typeof cleaned.saleEndsAt === 'string' && cleaned.saleEndsAt.trim().length === 0) {
      delete cleaned.saleEndsAt;
    }
  }

  return cleaned;
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const courseService = {
  getCourses: async (filters: CourseFilters = {}, page = 1, limit = 10): Promise<CoursesResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.search) params.append('searchTerm', filters.search);
    if (filters.instructorId) params.append('instructorId', filters.instructorId);
    if (filters.reviewStatus) params.append('reviewStatus', filters.reviewStatus);

    const response = await apiRequest<any>(`/courses?${params.toString()}`);

    // Backend returns: { success, data: CourseDTO[], total, page, limit, totalPages }
    const rawCourses = Array.isArray(response?.data) ? response.data : [];
    const courses = rawCourses.map(normalizeCourse);

    return {
      success: Boolean(response?.success),
      data: {
        courses,
        pagination: {
          page: Number(response?.page ?? page),
          limit: Number(response?.limit ?? limit),
          total: Number(response?.total ?? courses.length),
          totalPages: Number(response?.totalPages ?? 1),
        },
      },
    };
  },

  getCourse: async (id: string): Promise<CourseResponse> => {
    const response = await apiRequest<any>(`/courses/${id}`);
    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  createCourse: async (data: CreateCourseData): Promise<CourseResponse> => {
    const response = await apiRequest<any>('/courses', {
      method: 'POST',
      body: JSON.stringify(sanitizeCoursePayload(data)),
    });

    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  updateCourse: async (id: string, data: UpdateCourseData): Promise<CourseResponse> => {
    const response = await apiRequest<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizeCoursePayload(data)),
    });

    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  deleteCourse: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  publishCourse: async (id: string): Promise<CourseResponse> => {
    const response = await apiRequest<any>(`/courses/${id}/publish`, {
      method: 'POST',
    });

    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  submitCourseForReview: async (id: string): Promise<CourseResponse> => {
    const response = await apiRequest<any>(`/courses/${id}/submit-review`, {
      method: 'POST',
    });

    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  reviewCourse: async (
    id: string,
    decision: 'approved' | 'changes_requested',
    notes?: string
  ): Promise<CourseResponse> => {
    const response = await apiRequest<any>(`/courses/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });

    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  unpublishCourse: async (id: string): Promise<CourseResponse> => {
    const response = await apiRequest<any>(`/courses/${id}/unpublish`, {
      method: 'POST',
    });

    const rawCourse = response?.course ?? response?.data ?? response;
    return {
      success: Boolean(response?.success),
      data: normalizeCourse(rawCourse),
    };
  },

  addModule: async (courseId: string, data: CreateModuleData): Promise<ModuleResponse> => {
    return apiRequest<ModuleResponse>(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateModule: async (
    courseId: string,
    moduleId: string,
    data: Partial<CreateModuleData>
  ): Promise<ModuleResponse> => {
    return apiRequest<ModuleResponse>(`/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify({ courseId, ...data }),
    });
  },

  deleteModule: async (courseId: string, moduleId: string): Promise<{ success: boolean; message: string }> => {
    const params = new URLSearchParams();
    params.append('courseId', courseId);

    return apiRequest<{ success: boolean; message: string }>(`/modules/${moduleId}?${params.toString()}`, {
      method: 'DELETE',
    });
  },

  addLesson: async (courseId: string, moduleId: string, data: CreateLessonData): Promise<LessonResponse> => {
    return apiRequest<LessonResponse>(`/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLesson: async (
    courseId: string,
    moduleId: string,
    lessonId: string,
    data: Partial<CreateLessonData>
  ): Promise<LessonResponse> => {
    return apiRequest<LessonResponse>(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify({ courseId, moduleId, ...data }),
    });
  },

  deleteLesson: async (
    courseId: string,
    moduleId: string,
    lessonId: string
  ): Promise<{ success: boolean; message: string }> => {
    const params = new URLSearchParams();
    params.append('courseId', courseId);
    params.append('moduleId', moduleId);

    return apiRequest<{ success: boolean; message: string }>(`/lessons/${lessonId}?${params.toString()}`, {
      method: 'DELETE',
    });
  },

  uploadAttachment: async (
    courseId: string,
    moduleId: string,
    lessonId: string,
    file: File
  ): Promise<AttachmentUploadResponse> => {
    const fileName = file.name;
    const extension = fileName.includes('.')
      ? fileName.split('.').pop()!.toLowerCase()
      : '';
    const fileData = await fileToDataUrl(file);

    return apiRequest<AttachmentUploadResponse>(`/lessons/${lessonId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({
        courseId,
        moduleId,
        fileName,
        fileType: extension,
        fileData,
      }),
    });
  },

  deleteAttachment: async (attachmentId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  },

  downloadAttachment: async (attachmentId: string): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/attachments/${attachmentId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download attachment');
    }

    return response.blob();
  },
};
