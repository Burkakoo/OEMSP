import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import * as auditLogController from '../controllers/auditLog.controller';
import { Permission } from '../authorization/permissions';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission(Permission.AUDIT_LOGS_READ),
  auditLogController.getAuditLogs
);

export default router;
