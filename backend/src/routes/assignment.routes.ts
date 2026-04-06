import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as assignmentController from '../controllers/assignment.controller';

const router = Router();

router.get('/', authenticate, assignmentController.listAssignments);
router.post('/', authenticate, assignmentController.submitAssignment);
router.get(
  '/:id/attachments/:attachmentId/download',
  authenticate,
  assignmentController.downloadAssignmentAttachment
);
router.get('/:id', authenticate, assignmentController.getAssignment);
router.put('/:id/grade', authenticate, assignmentController.gradeAssignment);

export default router;
