import { Router } from 'express';
import * as questionBankController from '../controllers/questionBank.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', authenticate, questionBankController.listQuestionBankItems);
router.post('/course/:courseId', authenticate, questionBankController.createQuestionBankItem);
router.put('/:id', authenticate, questionBankController.updateQuestionBankItem);
router.delete('/:id', authenticate, questionBankController.deleteQuestionBankItem);

export default router;
