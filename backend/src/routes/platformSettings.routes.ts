import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as platformSettingsController from '../controllers/platformSettings.controller';

const router = Router();

router.get('/', authenticate, platformSettingsController.getSettings);
router.put('/', authenticate, platformSettingsController.saveSettings);

export default router;
