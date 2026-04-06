import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';
import * as couponService from '../services/coupon.service';

const isCouponManager = (role?: UserRole | string): boolean =>
  role === UserRole.INSTRUCTOR || role === UserRole.ADMIN;

export const listCourseCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { courseId } = req.params;

    if (!requesterId || !isCouponManager(requesterRole)) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can manage coupons',
      });
      return;
    }

    const coupons = await couponService.listCourseCoupons(
      courseId as string,
      requesterId,
      requesterRole === UserRole.ADMIN
    );

    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list coupons';
    const statusCode =
      errorMessage.includes('not found') ? 404 :
      errorMessage.includes('Access denied') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { courseId } = req.params;

    if (!requesterId || !isCouponManager(requesterRole)) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can manage coupons',
      });
      return;
    }

    const coupon = await couponService.createCoupon(
      courseId as string,
      req.body,
      requesterId,
      requesterRole === UserRole.ADMIN
    );

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create coupon';
    const statusCode =
      errorMessage.includes('not found') ? 404 :
      errorMessage.includes('Access denied') ? 403 :
      errorMessage.includes('already exists') ? 409 :
      400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const updateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { id } = req.params;

    if (!requesterId || !isCouponManager(requesterRole)) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can manage coupons',
      });
      return;
    }

    const coupon = await couponService.updateCoupon(
      id as string,
      req.body,
      requesterId,
      requesterRole === UserRole.ADMIN
    );

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update coupon';
    const statusCode =
      errorMessage.includes('not found') ? 404 :
      errorMessage.includes('Access denied') ? 403 :
      errorMessage.includes('already exists') ? 409 :
      400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const deleteCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { id } = req.params;

    if (!requesterId || !isCouponManager(requesterRole)) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can manage coupons',
      });
      return;
    }

    await couponService.deleteCoupon(
      id as string,
      requesterId,
      requesterRole === UserRole.ADMIN
    );

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete coupon';
    const statusCode =
      errorMessage.includes('not found') ? 404 :
      errorMessage.includes('Access denied') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};
