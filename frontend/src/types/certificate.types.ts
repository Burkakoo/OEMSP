/**
 * Certificate type definitions
 */

export interface Certificate {
  _id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  certificateId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: string;
  verificationCode: string;
  certificateUrl: string;
  publicVerificationUrl?: string;
  templateName?: string;
  skillsAwarded?: string[];
  issuedAt: string;
}

export interface CertificatesResponse {
  success: boolean;
  data: {
    certificates: Certificate[];
    total: number;
    page: number;
    pages: number;
  };
}

export interface CertificateResponse {
  success: boolean;
  data: Certificate;
  message?: string;
}
