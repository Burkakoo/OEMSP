import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as discussionController from '../controllers/discussion.controller';

const router = Router();

router.get('/course/:courseId', authenticate, discussionController.listDiscussionThreads);
router.post('/course/:courseId', authenticate, discussionController.createDiscussionThread);
router.post('/:id/replies', authenticate, discussionController.addDiscussionReply);

export default router;
