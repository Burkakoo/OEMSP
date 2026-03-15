import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

/**
 * Analytics Controllers
 * Handle HTTP requests for analytics and reporting
 */

/**
 * Get student dashboard analytics
 * GET /api/v1/analytics/student
 */
export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Students can only see their own analytics
    if (req.user?.role !== 'student') {
      res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for students only.',
      });
      return;
    }

    const analytics = await analyticsService.getStudentAnalytics(userId);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get student analytics',
    });
  }
};

/**
 * Get instructor dashboard analytics
 * GET /api/v1/analytics/instructor
 */
export const getInstructorDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Instructors can only see their own analytics
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for instructors only.',
      });
      return;
    }

    const analytics = await analyticsService.getInstructorAnalytics(userId);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get instructor analytics',
    });
  }
};

/**
 * Get admin dashboard analytics
 * GET /api/v1/analytics/admin
 */
export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can access
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
      return;
    }

    const analytics = await analyticsService.getAdminAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get admin analytics',
    });
  }
};

/**
 * Get enrollment statistics
 * GET /api/v1/analytics/enrollments
 */
export const getEnrollmentStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, instructorId, startDate, endDate } = req.query;

    // Access control: instructors can only see their own courses
    if (req.user?.role === 'instructor' && instructorId && instructorId !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const filters: any = {};
    if (courseId) filters.courseId = courseId as string;
    if (instructorId) filters.instructorId = instructorId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const statistics = await analyticsService.getEnrollmentStatistics(filters);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get enrollment statistics',
    });
  }
};

/**
 * Get revenue statistics
 * GET /api/v1/analytics/revenue
 */
export const getRevenueStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instructorId, startDate, endDate } = req.query;

    // Access control: instructors can only see their own revenue
    if (req.user?.role === 'instructor' && instructorId && instructorId !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Only instructors and admins can access revenue statistics
    if (req.user?.role === 'student') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const filters: any = {};
    if (instructorId) filters.instructorId = instructorId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const statistics = await analyticsService.getRevenueStatistics(filters);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get revenue statistics',
    });
  }
};

/**
 * Get quiz performance analytics
 * GET /api/v1/analytics/quiz-performance
 */
export const getQuizPerformanceAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseId, quizId } = req.query;

    // Access control: students can only see their own performance
    if (req.user?.role === 'student' && studentId && studentId !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const filters: any = {};
    if (studentId) filters.studentId = studentId as string;
    if (courseId) filters.courseId = courseId as string;
    if (quizId) filters.quizId = quizId as string;

    const analytics = await analyticsService.getQuizPerformanceAnalytics(filters);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get quiz performance analytics',
    });
  }
};
