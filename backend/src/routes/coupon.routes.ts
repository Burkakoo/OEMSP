import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', authenticate, couponController.listCourseCoupons);
router.post('/course/:courseId', authenticate, couponController.createCoupon);
router.put('/:id', authenticate, couponController.updateCoupon);
router.delete('/:id', authenticate, couponController.deleteCoupon);

export default router;
