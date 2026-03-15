import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as enrollmentService from '../services/enrollment.service';

/**
 * Enrollment Controllers
 * Handle HTTP requests for enrollment operations
 */

/**
 * List enrollments
 * GET /api/v1/enrollments
 */
export const listEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, courseId, isCompleted, page, limit } = req.query;

    // Access control: students can only see their own enrollments
    // Instructors can see enrollments for their courses
    // Admins can see all enrollments
    const filters: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    if (req.user?.role === 'student') {
      // Students can only see their own enrollments
      filters.studentId = req.user.userId;
    } else if (req.user?.role === 'instructor') {
      // Instructors can filter by their courses
      if (courseId) {
        filters.courseId = courseId as string;
      }
      if (studentId) {
        filters.studentId = studentId as string;
      }
    } else if (req.user?.role === 'admin') {
      // Admins can filter by any criteria
      if (studentId) {
        filters.studentId = studentId as string;
      }
      if (courseId) {
        filters.courseId = courseId as string;
      }
    }

    if (isCompleted !== undefined) {
      filters.isCompleted = isCompleted === 'true';
    }

    const result = await enrollmentService.listEnrollments(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to list enrollments',
    });
  }
};

/**
 * Get enrollment by ID
 * GET /api/v1/enrollments/:id
 */
export const getEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enrollment = await enrollmentService.getEnrollment(id as string);

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
      return;
    }

    // Access control: students can only see their own enrollments
    // Instructors can see enrollments for their courses
    // Admins can see all enrollments
    if (req.user?.role === 'student') {
      if (enrollment.studentId.toString() !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: enrollment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get enrollment',
    });
  }
};

/**
 * Create enrollment
 * POST /api/v1/enrollments
 */
export const createEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, paymentId } = req.body;

    // Validation
    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    if (!paymentId) {
      res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
      return;
    }

    // Students can only enroll themselves
    const studentId = req.user?.userId;
    if (!studentId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const enrollment = await enrollmentService.enrollStudent(studentId, courseId, paymentId);

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already enrolled') ? 409 : 400;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create enrollment',
    });
  }
};

/**
 * Update progress
 * PUT /api/v1/enrollments/:id/progress
 */
export const updateProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lessonId, completed, timeSpent } = req.body;

    // Validation
    if (!lessonId) {
      res.status(400).json({
        success: false,
        message: 'Lesson ID is required',
      });
      return;
    }

    if (completed === undefined) {
      res.status(400).json({
        success: false,
        message: 'Completed status is required',
      });
      return;
    }

    if (timeSpent === undefined || timeSpent < 0) {
      res.status(400).json({
        success: false,
        message: 'Valid time spent is required',
      });
      return;
    }

    // Get enrollment to check ownership
    const enrollment = await enrollmentService.getEnrollment(id as string);
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
      return;
    }

    // Access control: only the enrolled student can update progress
    if (enrollment.studentId.toString() !== req.user?.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const updatedEnrollment = await enrollmentService.updateProgress(
      id as string,
      lessonId,
      completed,
      timeSpent
    );

    res.status(200).json({
      success: true,
      data: updatedEnrollment,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update progress',
    });
  }
};

/**
 * Get course enrollments (for instructors)
 * GET /api/v1/courses/:id/enrollments
 */
export const getCourseEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    // Only instructors and admins can access this
    if (req.user?.role !== 'instructor' && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const filters: any = {
      courseId: id as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    const result = await enrollmentService.listEnrollments(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get course enrollments',
    });
  }
};
