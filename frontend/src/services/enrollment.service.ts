/**
 * Enrollment API service
 */

import apiRequest from './api';
import { Enrollment, UpdateProgressData } from '../types/enrollment.types';

interface EnrollmentsResponse {
  success: boolean;
  data: {
    enrollments: Enrollment[];
    total: number;
    page: number;
    pages: number;
  };
}

interface EnrollmentResponse {
  success: boolean;
  data: Enrollment;
}

interface GetEnrollmentsParams {
  courseId?: string;
  page?: number;
  limit?: number;
}

type AnyEnrollment = any;

const normalizeEnrollment = (raw: AnyEnrollment): Enrollment => {
  const courseDoc =
    raw?.course && typeof raw.course === 'object'
      ? raw.course
      : raw?.courseId && typeof raw.courseId === 'object'
        ? raw.courseId
        : undefined;

  const normalizedCourseId = String(courseDoc?._id ?? courseDoc?.id ?? raw?.courseId ?? '');

  const studentDoc = raw?.studentId && typeof raw.studentId === 'object' ? raw.studentId : undefined;
  const normalizedStudentId = String(studentDoc?._id ?? studentDoc?.id ?? raw?.studentId ?? '');

  const lessonProgress = Array.isArray(raw?.progress)
    ? raw.progress.map((p: any) => ({
        lessonId: String(p.lessonId),
        completed: Boolean(p.completed),
        completedAt: p.completedAt,
        timeSpent: Number(p.timeSpent ?? 0),
      }))
    : Array.isArray(raw?.lessonProgress)
      ? raw.lessonProgress.map((p: any) => ({
          lessonId: String(p.lessonId),
          completed: Boolean(p.completed),
          completedAt: p.completedAt,
          timeSpent: Number(p.timeSpent ?? 0),
        }))
      : [];

  const isCompleted = Boolean(raw?.isCompleted);
  const completionPercentage = Number(raw?.completionPercentage ?? 0);
  const normalizedCompletionPercentage =
    isCompleted && completionPercentage === 0 ? 100 : completionPercentage;

  return {
    _id: String(raw?._id ?? raw?.id ?? ''),
    studentId: normalizedStudentId,
    student: studentDoc
      ? {
          _id: normalizedStudentId,
          firstName: studentDoc?.firstName ?? '',
          lastName: studentDoc?.lastName ?? '',
          email: studentDoc?.email,
        }
      : undefined,
    courseId: normalizedCourseId,
    course: courseDoc
      ? {
          _id: String(courseDoc?._id ?? courseDoc?.id ?? ''),
          title: courseDoc?.title,
          thumbnail: courseDoc?.thumbnail,
          instructorId: courseDoc?.instructorId,
        }
      : raw?.course,
    enrolledAt: raw?.enrolledAt ?? raw?.createdAt ?? new Date().toISOString(),
    completionPercentage: normalizedCompletionPercentage,
    isCompleted,
    completedAt: raw?.completedAt,
    lessonProgress,
  };
};

export const enrollmentService = {
  getEnrollments: async (params: GetEnrollmentsParams = {}): Promise<EnrollmentsResponse> => {
    const searchParams = new URLSearchParams();
    if (params.courseId) searchParams.append('courseId', params.courseId);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    const endpoint = query ? `/enrollments?${query}` : '/enrollments';
    const response = await apiRequest<any>(endpoint);

    // Backend returns: { success, data: { enrollments, total, page, pages } }
    const rawData = response?.data;
    const rawEnrollments = Array.isArray(rawData) ? rawData : rawData?.enrollments;
    const enrollments = Array.isArray(rawEnrollments)
      ? rawEnrollments.map(normalizeEnrollment)
      : [];

    return {
      success: Boolean(response?.success),
      data: {
        enrollments,
        total: Number(rawData?.total ?? enrollments.length),
        page: Number(rawData?.page ?? 1),
        pages: Number(rawData?.pages ?? 1),
      },
    };
  },

  getEnrollment: async (id: string): Promise<EnrollmentResponse> => {
    const response = await apiRequest<any>(`/enrollments/${id}`);
    return {
      success: Boolean(response?.success),
      data: normalizeEnrollment(response?.data),
    };
  },

  createEnrollment: async (courseId: string, paymentId: string): Promise<EnrollmentResponse> => {
    const response = await apiRequest<any>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId, paymentId }),
    });

    return {
      success: Boolean(response?.success),
      data: normalizeEnrollment(response?.data),
    };
  },

  enrollInFreeCourse: async (courseId: string): Promise<EnrollmentResponse> => {
    const response = await apiRequest<any>('/enrollments/free', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });

    return {
      success: Boolean(response?.success),
      data: normalizeEnrollment(response?.data),
    };
  },

  updateProgress: async (
    enrollmentId: string,
    data: UpdateProgressData
  ): Promise<EnrollmentResponse> => {
    const response = await apiRequest<any>(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return {
      success: Boolean(response?.success),
      data: normalizeEnrollment(response?.data),
    };
  },

  deleteEnrollment: async (
    enrollmentId: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  },
};
