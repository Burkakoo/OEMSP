import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as certificateTemplateController from '../controllers/certificateTemplate.controller';

const router = Router();

router.get('/', authenticate, certificateTemplateController.getCertificateTemplates);
router.post('/', authenticate, certificateTemplateController.createTemplate);
router.put('/:id', authenticate, certificateTemplateController.updateTemplate);

export default router;
