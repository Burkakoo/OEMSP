import apiRequest from './api';
import { AssignmentSubmission, AssignmentSubmissionStatus } from '../types/assignment.types';

interface AssignmentListResponse {
  success: boolean;
  data: {
    submissions: AssignmentSubmission[];
    total: number;
    page: number;
    pages: number;
  };
}

interface AssignmentResponse {
  success: boolean;
  data: AssignmentSubmission;
  message?: string;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const normalizeUser = (raw: any) => {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  return {
    _id: String(raw._id ?? raw.id ?? ''),
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    email: raw.email,
  };
};

const normalizeCourse = (raw: any) => {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  return {
    _id: String(raw._id ?? raw.id ?? ''),
    title: raw.title ?? '',
  };
};

const normalizeSubmission = (raw: any): AssignmentSubmission => ({
  _id: String(raw?._id ?? raw?.id ?? ''),
  studentId: normalizeUser(raw?.studentId),
  courseId: normalizeCourse(raw?.courseId),
  moduleId: String(raw?.moduleId ?? ''),
  lessonId: String(raw?.lessonId ?? ''),
  moduleTitle: raw?.moduleTitle ?? '',
  lessonTitle: raw?.lessonTitle ?? '',
  courseTitle: raw?.courseTitle ?? raw?.courseId?.title ?? '',
  submissionText: raw?.submissionText ?? '',
  attachments: Array.isArray(raw?.attachments)
    ? raw.attachments.map((attachment: any) => ({
        _id: String(attachment?._id ?? attachment?.id ?? ''),
        fileName: attachment?.fileName ?? '',
        fileType: attachment?.fileType ?? '',
        fileSize: Number(attachment?.fileSize ?? 0),
        fileUrl: attachment?.fileUrl ?? '',
        uploadedAt: attachment?.uploadedAt
          ? String(attachment.uploadedAt)
          : new Date().toISOString(),
      }))
    : [],
  status: raw?.status === 'graded' ? 'graded' : 'submitted',
  score: raw?.score !== undefined ? Number(raw.score) : undefined,
  feedback: raw?.feedback ?? '',
  gradedBy: normalizeUser(raw?.gradedBy),
  submittedAt: raw?.submittedAt ? String(raw.submittedAt) : new Date().toISOString(),
  gradedAt: raw?.gradedAt ? String(raw.gradedAt) : undefined,
  updatedAt: raw?.updatedAt ? String(raw.updatedAt) : new Date().toISOString(),
});

export const assignmentService = {
  getAssignments: async (params: {
    courseId?: string;
    lessonId?: string;
    status?: AssignmentSubmissionStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<AssignmentListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.courseId) searchParams.append('courseId', params.courseId);
    if (params.lessonId) searchParams.append('lessonId', params.lessonId);
    if (params.status) searchParams.append('status', params.status);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await apiRequest<any>(`/assignments${query ? `?${query}` : ''}`);

    return {
      success: Boolean(response?.success),
      data: {
        submissions: Array.isArray(response?.data?.submissions)
          ? response.data.submissions.map(normalizeSubmission)
          : [],
        total: Number(response?.data?.total ?? 0),
        page: Number(response?.data?.page ?? params.page ?? 1),
        pages: Number(response?.data?.pages ?? 1),
      },
    };
  },

  getAssignment: async (assignmentId: string): Promise<AssignmentResponse> => {
    const response = await apiRequest<any>(`/assignments/${assignmentId}`);
    return {
      success: Boolean(response?.success),
      data: normalizeSubmission(response?.data),
      message: response?.message,
    };
  },

  getMyAssignmentSubmission: async (
    courseId: string,
    lessonId: string
  ): Promise<AssignmentSubmission | null> => {
    const response = await assignmentService.getAssignments({
      courseId,
      lessonId,
      page: 1,
      limit: 1,
    });

    return response.data.submissions[0] ?? null;
  },

  submitAssignment: async (payload: {
    courseId: string;
    moduleId: string;
    lessonId: string;
    submissionText?: string;
    attachments?: File[];
  }): Promise<AssignmentResponse> => {
    const attachments = payload.attachments ?? [];
    const encodedAttachments = await Promise.all(
      attachments.map(async (file) => {
        const fileName = file.name;
        const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
        return {
          fileName,
          fileType: extension,
          fileData: await fileToDataUrl(file),
        };
      })
    );

    const response = await apiRequest<any>('/assignments', {
      method: 'POST',
      body: JSON.stringify({
        courseId: payload.courseId,
        moduleId: payload.moduleId,
        lessonId: payload.lessonId,
        submissionText: payload.submissionText ?? '',
        attachments: encodedAttachments,
      }),
    });

    return {
      success: Boolean(response?.success),
      data: normalizeSubmission(response?.data),
      message: response?.message,
    };
  },

  gradeAssignment: async (
    assignmentId: string,
    payload: { score: number; feedback?: string }
  ): Promise<AssignmentResponse> => {
    const response = await apiRequest<any>(`/assignments/${assignmentId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return {
      success: Boolean(response?.success),
      data: normalizeSubmission(response?.data),
      message: response?.message,
    };
  },

  downloadAttachment: async (assignmentId: string, attachmentId: string): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/assignments/${assignmentId}/attachments/${attachmentId}/download`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download assignment attachment');
    }

    return response.blob();
  },
};
