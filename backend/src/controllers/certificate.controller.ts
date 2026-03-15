import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as certificateService from '../services/certificate.service';

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
    if (req.user?.role !== 'admin' && certificate.studentId.toString() !== req.user?.userId) {
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
    if (req.user?.role !== 'admin' && existingCertificate.studentId.toString() !== req.user?.userId) {
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
