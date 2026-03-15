import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Certificate Routes
 * All routes require authentication except verify
 */

/**
 * @route   GET /api/v1/certificates/:id
 * @desc    Get certificate by ID
 * @access  Private (Certificate owner or Admin)
 */
router.get('/:id', authenticate, certificateController.getCertificate);

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

/**
 * @route   POST /api/v1/certificates/:id/regenerate
 * @desc    Regenerate certificate
 * @access  Private (Certificate owner or Admin)
 */
router.post('/:id/regenerate', authenticate, certificateController.regenerateCertificate);

export default router;
