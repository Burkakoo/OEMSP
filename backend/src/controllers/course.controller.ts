/**
 * Course Controller
 * Handles HTTP requests for course management endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { courseService, CreateCourseDTO, UpdateCourseDTO, CourseFilters, PaginationParams } from '../services/course.service';
import { UserRole } from '../models/User';
import { CourseReviewStatus } from '../models/Course';

/**
 * List courses with filters and pagination
 * GET /api/v1/courses
 * 
 * Access control:
 * - Public endpoint (no authentication required)
 * - Returns only published courses for non-instructors
 * - Instructors can see their own unpublished courses
 * 
 * Requirements:
 * - 1.2.4: Provide course listing with pagination
 */
export const listCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Extract query parameters
    const filters: CourseFilters = {
      category: req.query.category as string,
      level: req.query.level as any,
      isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
      reviewStatus: req.query.reviewStatus as CourseReviewStatus,
      instructorId: req.query.instructorId as string,
      searchTerm: req.query.searchTerm as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    };

    // If user is not an instructor viewing their own courses, only show published courses
    if (!req.user || (req.user.role !== UserRole.INSTRUCTOR && req.user.role !== UserRole.ADMIN)) {
      filters.isPublished = true;
    }

    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await courseService.listCourses(filters, pagination);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('List courses controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Get course by ID
 * GET /api/v1/courses/:id
 * 
 * Access control:
 * - Public endpoint for published courses
 * - Instructors can view their own unpublished courses
 * - Admins can view any course
 * 
 * Requirements:
 * - 1.2.4: Display course information
 */
export const getCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;

    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    const course = await courseService.getCourse(courseId as string);

    // Access control: unpublished courses can only be viewed by owner or admin
    if (!course.isPublished) {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: 'This course is not published',
        });
        return;
      }

      if (req.user.role !== UserRole.ADMIN && course.instructorId !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'This course is not published',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Get course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Create a new course
 * POST /api/v1/courses
 * 
 * Access control:
 * - Instructors only
 * 
 * Requirements:
 * - 1.2.1: Allow instructors to create courses
 */
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate authentication
    if (!instructorId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate role
    if (userRole !== UserRole.INSTRUCTOR && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can create courses',
      });
      return;
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Course data is required',
      });
      return;
    }

    const courseData: CreateCourseDTO = req.body;

    // Create course
    const course = await courseService.createCourse(courseData, instructorId);

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Create course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('already exists')) {
      statusCode = 409;
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Update a course
 * PUT /api/v1/courses/:id
 * 
 * Access control:
 * - Course owner (instructor) only
 * - Admins can update any course
 * 
 * Requirements:
 * - 1.2.5: Allow instructors to update their own courses
 */
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;
    const instructorId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate authentication
    if (!instructorId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate course ID
    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Update data is required',
      });
      return;
    }

    const updates: UpdateCourseDTO = req.body;

    // Update course (service will verify ownership)
    const course = await courseService.updateCourse(courseId as string, updates, instructorId);

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Update course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only update your own') || errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('already exists') || errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Delete a course
 * DELETE /api/v1/courses/:id
 * 
 * Access control:
 * - Course owner (instructor) only
 * - Admins can delete any course
 * 
 * Requirements:
 * - 1.2.5: Allow instructors to delete their own courses
 */
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;
    const instructorId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate authentication
    if (!instructorId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate course ID
    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    // Delete course (service will verify ownership)
    await courseService.deleteCourse(courseId as string, instructorId);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only delete your own') || errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('active enrollments')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const submitCourseForReview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const rawCourseId = req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;
    const instructorId = req.user?.userId;

    if (!instructorId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    const course = await courseService.submitCourseForReview(courseId, instructorId);

    res.status(200).json({
      success: true,
      course,
      message: 'Course submitted for review',
    });
  } catch (error) {
    console.error('Submit course for review controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode =
      errorMessage.includes('not found') ? 404 :
      errorMessage.includes('only submit your own') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export const reviewCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawCourseId = req.params.id;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;
    const adminId = req.user?.userId;
    const userRole = req.user?.role;
    const { decision, notes } = req.body;

    if (!adminId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    if (
      decision !== CourseReviewStatus.APPROVED &&
      decision !== CourseReviewStatus.CHANGES_REQUESTED
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid review decision',
      });
      return;
    }

    const course = await courseService.reviewCourse(courseId, adminId, decision, notes);

    res.status(200).json({
      success: true,
      course,
      message:
        decision === CourseReviewStatus.APPROVED
          ? 'Course approved successfully'
          : 'Changes requested successfully',
    });
  } catch (error) {
    console.error('Review course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Publish a course
 * POST /api/v1/courses/:id/publish
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.3: Allow instructors to publish courses
 */
export const publishCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;
    const instructorId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate authentication
    if (!instructorId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate course ID
    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    // Publish course (service will verify ownership and content requirements)
    const course = await courseService.publishCourse(courseId as string, instructorId);

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Publish course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only publish your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('must have') || errorMessage.includes('must be approved')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Unpublish a course
 * POST /api/v1/courses/:id/unpublish
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.3: Allow instructors to unpublish courses
 */
export const unpublishCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.id;
    const instructorId = req.user?.userId;
    const userRole = req.user?.role;

    // Validate authentication
    if (!instructorId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate course ID
    if (!courseId) {
      res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
      return;
    }

    // Unpublish course (service will verify ownership)
    const course = await courseService.unpublishCourse(courseId as string, instructorId);

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Unpublish course controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only unpublish your own')) {
      statusCode = 403;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};
