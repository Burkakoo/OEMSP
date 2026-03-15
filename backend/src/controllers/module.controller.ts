/**
 * Module and Lesson Controller
 * Handles HTTP requests for module and lesson management endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { courseService, ModuleDTO, LessonDTO } from '../services/course.service';
import { UserRole } from '../models/User';

/**
 * Add a module to a course
 * POST /api/v1/courses/:courseId/modules
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.2: Allow instructors to add modules to courses
 */
export const addModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId;
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
        error: 'Only instructors can add modules',
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
        error: 'Module data is required',
      });
      return;
    }

    const moduleData: ModuleDTO = req.body;

    // Add module (service will verify ownership)
    const module = await courseService.addModule(courseId as string, moduleData, instructorId);

    res.status(201).json({
      success: true,
      module,
    });
  } catch (error) {
    console.error('Add module controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Update a module
 * PUT /api/v1/modules/:id
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.2: Allow instructors to update modules
 */
export const updateModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;
    const courseId = req.body.courseId; // Course ID should be in request body
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

    // Validate IDs
    if (!moduleId) {
      res.status(400).json({
        success: false,
        error: 'Module ID is required',
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

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Update data is required',
      });
      return;
    }

    const updates: ModuleDTO = {
      title: req.body.title,
      description: req.body.description,
      order: req.body.order,
    };

    // Update module (service will verify ownership)
    const module = await courseService.updateModule(courseId as string, moduleId as string, updates, instructorId);

    res.status(200).json({
      success: true,
      module,
    });
  } catch (error) {
    console.error('Update module controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Delete a module
 * DELETE /api/v1/modules/:id
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.2: Allow instructors to delete modules
 */
export const deleteModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.id;
    const courseId = req.query.courseId as string; // Course ID from query parameter
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

    // Validate IDs
    if (!moduleId) {
      res.status(400).json({
        success: false,
        error: 'Module ID is required',
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

    // Delete module (service will verify ownership)
    await courseService.deleteModule(courseId as string, moduleId as string, instructorId);

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    console.error('Delete module controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Add a lesson to a module
 * POST /api/v1/modules/:moduleId/lessons
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.2: Allow instructors to add lessons to modules
 */
export const addLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const moduleId = req.params.moduleId;
    const courseId = req.body.courseId; // Course ID should be in request body
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
        error: 'Only instructors can add lessons',
      });
      return;
    }

    // Validate IDs
    if (!moduleId) {
      res.status(400).json({
        success: false,
        error: 'Module ID is required',
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

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Lesson data is required',
      });
      return;
    }

    const lessonData: LessonDTO = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      content: req.body.content,
      videoUrl: req.body.videoUrl,
      duration: req.body.duration,
      order: req.body.order,
      resources: req.body.resources,
    };

    // Add lesson (service will verify ownership)
    const lesson = await courseService.addLesson(courseId as string, moduleId as string, lessonData, instructorId);

    res.status(201).json({
      success: true,
      lesson,
    });
  } catch (error) {
    console.error('Add lesson controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Update a lesson
 * PUT /api/v1/lessons/:id
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.2: Allow instructors to update lessons
 */
export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id;
    const courseId = req.body.courseId; // Course ID should be in request body
    const moduleId = req.body.moduleId; // Module ID should be in request body
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

    // Validate IDs
    if (!lessonId) {
      res.status(400).json({
        success: false,
        error: 'Lesson ID is required',
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

    if (!moduleId) {
      res.status(400).json({
        success: false,
        error: 'Module ID is required',
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

    const updates: LessonDTO = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      content: req.body.content,
      videoUrl: req.body.videoUrl,
      duration: req.body.duration,
      order: req.body.order,
      resources: req.body.resources,
    };

    // Update lesson (service will verify ownership)
    const lesson = await courseService.updateLesson(courseId as string, moduleId as string, lessonId as string, updates, instructorId);

    res.status(200).json({
      success: true,
      lesson,
    });
  } catch (error) {
    console.error('Update lesson controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Delete a lesson
 * DELETE /api/v1/lessons/:id
 * 
 * Access control:
 * - Course owner (instructor) only
 * 
 * Requirements:
 * - 1.2.2: Allow instructors to delete lessons
 */
export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.id;
    const courseId = req.query.courseId as string; // Course ID from query parameter
    const moduleId = req.query.moduleId as string; // Module ID from query parameter
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

    // Validate IDs
    if (!lessonId) {
      res.status(400).json({
        success: false,
        error: 'Lesson ID is required',
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

    if (!moduleId) {
      res.status(400).json({
        success: false,
        error: 'Module ID is required',
      });
      return;
    }

    // Delete lesson (service will verify ownership)
    await courseService.deleteLesson(courseId as string, moduleId as string, lessonId as string, instructorId);

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Delete lesson controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};
