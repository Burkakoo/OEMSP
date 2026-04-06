import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as certificateService from '../services/certificate.service';
import Enrollment from '../models/Enrollment';

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

const sanitizeFileName = (value: string): string => {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return sanitized || 'certificate';
};

/**
 * Certificate Controllers
 * Handle HTTP requests for certificate operations
 */

/**
 * Get certificate by ID
 * GET /api/v1/certificates/:id
 */
export const getCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const certificate = await certificateService.getCertificate(id as string);

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
      return;
    }

    // Access control: students can only see their own certificates, admins see all
    const certificateStudentId = extractId(certificate.studentId);
    if (req.user?.role !== 'admin' && certificateStudentId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get certificate',
    });
  }
};

/**
 * List certificates
 * GET /api/v1/certificates
 */
export const listCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, courseId, page, limit } = req.query;

    // Access control: students can only see their own certificates, admins see all
    const filters: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    if (req.user?.role === 'admin') {
      // Admins can filter by any criteria
      if (studentId) filters.studentId = studentId as string;
      if (courseId) filters.courseId = courseId as string;
    } else {
      // Regular users can only see their own certificates
      filters.studentId = req.user?.userId;
    }

    const result = await certificateService.listCertificates(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to list certificates',
    });
  }
};

/**
 * Generate certificate for a completed enrollment
 * POST /api/v1/certificates/enrollments/:enrollmentId/generate
 */
export const generateCertificateForEnrollment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId).select(
      'studentId isCompleted'
    );
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
      return;
    }

    if (
      req.user?.role !== 'admin' &&
      enrollment.studentId.toString() !== req.user?.userId
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    if (!enrollment.isCompleted) {
      res.status(400).json({
        success: false,
        message: 'Enrollment must be completed before generating a certificate',
      });
      return;
    }

    const existingCertificate =
      await certificateService.getCertificateByEnrollment(enrollmentId as string);

    if (existingCertificate) {
      res.status(200).json({
        success: true,
        data: existingCertificate,
        message: 'Certificate already exists for this enrollment',
      });
      return;
    }

    const certificate = await certificateService.generateCertificate(
      enrollmentId as string
    );

    res.status(201).json({
      success: true,
      data: certificate,
      message: 'Certificate generated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate certificate',
    });
  }
};

/**
 * Verify certificate by verification code
 * POST /api/v1/certificates/verify
 */
export const verifyCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { verificationCode } = req.body;

    if (!verificationCode) {
      res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
      return;
    }

    const certificate = await certificateService.verifyCertificate(verificationCode);

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found',
        verified: false,
      });
      return;
    }

    res.status(200).json({
      success: true,
      verified: true,
      data: certificate,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify certificate',
    });
  }
};

/**
 * Regenerate certificate
 * POST /api/v1/certificates/:id/regenerate
 */
export const regenerateCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get certificate to check ownership
    const existingCertificate = await certificateService.getCertificate(id as string);
    if (!existingCertificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
      return;
    }

    // Access control: only certificate owner or admin can regenerate
    const certificateStudentId = extractId(existingCertificate.studentId);
    if (req.user?.role !== 'admin' && certificateStudentId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const certificate = await certificateService.regenerateCertificate(id as string);

    res.status(200).json({
      success: true,
      data: certificate,
      message: 'Certificate regenerated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to regenerate certificate',
    });
  }
};

/**
 * Download certificate PDF
 * GET /api/v1/certificates/:id/download
 */
export const downloadCertificate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const certificate = await certificateService.getCertificate(id as string);
    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
      return;
    }

    const certificateStudentId = extractId(certificate.studentId);
    if (req.user?.role !== 'admin' && certificateStudentId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const pdfBuffer = await certificateService.generateCertificatePdf({
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      instructorName: certificate.instructorName,
      completionDate: new Date(certificate.completionDate),
      verificationCode: certificate.verificationCode,
      templateName: certificate.templateName,
      skillsAwarded: certificate.skillsAwarded,
    });

    const fileName = `${sanitizeFileName(certificate.courseTitle)}-certificate.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(pdfBuffer);
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to download certificate',
    });
  }
};

export const getPublicCertificate = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const rawCertificateId = req.params.certificateId;
    const certificateId = Array.isArray(rawCertificateId)
      ? rawCertificateId[0]
      : rawCertificateId;

    if (!certificateId) {
      res.status(400).json({
        success: false,
        message: 'Certificate ID is required',
      });
      return;
    }

    const certificate = await certificateService.getPublicCertificate(certificateId);

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      verified: true,
      data: certificate,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to load public certificate',
    });
  }
};
