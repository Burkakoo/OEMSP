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
      }))
    : Array.isArray(raw?.lessonProgress)
      ? raw.lessonProgress
      : [];

  return {
    _id: String(raw?._id ?? raw?.id ?? ''),
    studentId: normalizedStudentId,
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
    completionPercentage: Number(raw?.completionPercentage ?? 0),
    isCompleted: Boolean(raw?.isCompleted),
    completedAt: raw?.completedAt,
    lessonProgress,
  };
};

export const enrollmentService = {
  getEnrollments: async (): Promise<EnrollmentsResponse> => {
    const response = await apiRequest<any>('/enrollments');

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

  createEnrollment: async (courseId: string): Promise<EnrollmentResponse> => {
    const response = await apiRequest<any>('/enrollments', {
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
};
