/**
 * Certificate API service
 */

import apiRequest, { getAuthToken } from './api';
import {
  Certificate,
  CertificateResponse,
  CertificatesResponse,
} from '../types/certificate.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const extractId = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const withId = value as { _id?: unknown; id?: unknown };
    if (withId._id) {
      return String(withId._id);
    }
    if (withId.id) {
      return String(withId.id);
    }
  }

  return String(value);
};

const normalizeCertificate = (raw: any): Certificate => ({
  _id: extractId(raw?._id ?? raw?.id),
  enrollmentId: extractId(raw?.enrollmentId),
  studentId: extractId(raw?.studentId),
  courseId: extractId(raw?.courseId),
  studentName: String(raw?.studentName ?? ''),
  courseTitle: String(raw?.courseTitle ?? 'Course'),
  instructorName: String(raw?.instructorName ?? ''),
  completionDate: String(raw?.completionDate ?? new Date().toISOString()),
  verificationCode: String(raw?.verificationCode ?? ''),
  certificateUrl: String(raw?.certificateUrl ?? ''),
  issuedAt: String(raw?.issuedAt ?? raw?.createdAt ?? new Date().toISOString()),
});

interface ListCertificateParams {
  page?: number;
  limit?: number;
}

export const certificateService = {
  getCertificates: async (
    params: ListCertificateParams = {}
  ): Promise<CertificatesResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page) {
      searchParams.append('page', String(params.page));
    }
    if (params.limit) {
      searchParams.append('limit', String(params.limit));
    }

    const query = searchParams.toString();
    const endpoint = query ? `/certificates?${query}` : '/certificates';
    const response = await apiRequest<any>(endpoint);
    const rawData = response?.data;
    const rawCertificates = Array.isArray(rawData?.certificates)
      ? rawData.certificates
      : [];

    return {
      success: Boolean(response?.success),
      data: {
        certificates: rawCertificates.map(normalizeCertificate),
        total: Number(rawData?.total ?? rawCertificates.length),
        page: Number(rawData?.page ?? 1),
        pages: Number(rawData?.pages ?? 1),
      },
    };
  },

  generateForEnrollment: async (
    enrollmentId: string
  ): Promise<CertificateResponse> => {
    const response = await apiRequest<any>(
      `/certificates/enrollments/${enrollmentId}/generate`,
      {
        method: 'POST',
      }
    );

    return {
      success: Boolean(response?.success),
      data: normalizeCertificate(response?.data),
      message: response?.message,
    };
  },

  downloadCertificate: async (
    certificateId: string,
    suggestedFileName?: string
  ): Promise<void> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/certificates/${certificateId}/download`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let message = `Failed to download certificate (${response.status})`;

      try {
        const parsed = JSON.parse(errorText) as { message?: string };
        if (parsed.message) {
          message = parsed.message;
        }
      } catch {
        if (errorText) {
          message = errorText;
        }
      }

      throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedFileName || `certificate-${certificateId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  },
};
