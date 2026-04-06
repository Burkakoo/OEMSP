import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Certificate Routes
 * All routes require authentication except verify
 */

/**
 * @route   POST /api/v1/certificates/enrollments/:enrollmentId/generate
 * @desc    Generate certificate for a completed enrollment
 * @access  Private (Enrollment owner or Admin)
 */
router.post(
  '/enrollments/:enrollmentId/generate',
  authenticate,
  certificateController.generateCertificateForEnrollment
);

/**
 * @route   GET /api/v1/certificates/public/:certificateId
 * @desc    Get public certificate verification details
 * @access  Public
 */
router.get('/public/:certificateId', certificateController.getPublicCertificate);

/**
 * @route   GET /api/v1/certificates/:id/download
 * @desc    Download certificate PDF
 * @access  Private (Certificate owner or Admin)
 */
router.get('/:id/download', authenticate, certificateController.downloadCertificate);

/**
 * @route   GET /api/v1/certificates/:id
 * @desc    Get certificate by ID
 * @access  Private (Certificate owner or Admin)
 */
router.get('/:id', authenticate, certificateController.getCertificate);

/**
 * @route   POST /api/v1/certificates/:id/regenerate
 * @desc    Regenerate certificate
 * @access  Private (Certificate owner or Admin)
 */
router.post('/:id/regenerate', authenticate, certificateController.regenerateCertificate);

/**
 * @route   GET /api/v1/certificates
 * @desc    List certificates
 * @access  Private (Users see own certificates, Admins see all)
 */
router.get('/', authenticate, certificateController.listCertificates);

/**
 * @route   POST /api/v1/certificates/verify
 * @desc    Verify certificate by verification code
 * @access  Public
 */
router.post('/verify', certificateController.verifyCertificate);

export default router;
