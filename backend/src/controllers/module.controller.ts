/**
 * Module and Lesson Controller
 * Handles HTTP requests for module and lesson management endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { courseService, ModuleDTO, LessonDTO } from '../services/course.service';
import { UserRole } from '../models/User';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../models/Course';
import mongoose from 'mongoose';
import path from 'path';
import { promises as fs } from 'fs';

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
    const courseId = req.params.courseId || req.body.courseId; // Get from route params first, then body
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

/**
 * Upload an attachment to a lesson
 * POST /api/v1/lessons/:id/attachments
 */
export const uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  let storedFilePath: string | null = null;

  try {
    const lessonId = req.params.id;
    const { courseId, moduleId, fileName, fileType, fileData } = req.body;
    const instructorId = req.user?.userId;
    const userRole = req.user?.role;

    if (!instructorId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (userRole !== UserRole.INSTRUCTOR && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can upload attachments',
      });
      return;
    }

    if (!lessonId || !courseId || !moduleId) {
      res.status(400).json({
        success: false,
        error: 'Lesson ID, course ID, and module ID are required',
      });
      return;
    }

    if (!fileName || !fileType || !fileData) {
      res.status(400).json({
        success: false,
        error: 'fileName, fileType, and fileData are required',
      });
      return;
    }

    const normalizedFileType = String(fileType).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(normalizedFileType)) {
      res.status(400).json({
        success: false,
        error: `Unsupported file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`,
      });
      return;
    }

    const normalizedBase64 = String(fileData).includes(',')
      ? String(fileData).split(',')[1]
      : String(fileData);

    if (!normalizedBase64) {
      res.status(400).json({
        success: false,
        error: 'Invalid fileData payload',
      });
      return;
    }

    const fileBuffer = Buffer.from(normalizedBase64, 'base64');
    if (!fileBuffer.length) {
      res.status(400).json({
        success: false,
        error: 'Decoded file is empty',
      });
      return;
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      res.status(400).json({
        success: false,
        error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
      return;
    }

    const attachmentId = new mongoose.Types.ObjectId();
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'attachments');
    await fs.mkdir(uploadsDir, { recursive: true });

    const storedFileName = `${attachmentId.toString()}.${normalizedFileType}`;
    storedFilePath = path.join(uploadsDir, storedFileName);
    await fs.writeFile(storedFilePath, fileBuffer);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/api/v1/attachments/${attachmentId.toString()}/download`;

    const attachment = await courseService.addAttachment(
      courseId,
      moduleId,
      lessonId as string,
      {
        _id: attachmentId,
        fileName: String(fileName),
        fileType: normalizedFileType,
        fileSize: fileBuffer.length,
        fileUrl,
      },
      userRole === UserRole.ADMIN
        ? (await courseService.getCourse(courseId)).instructorId
        : instructorId
    );

    res.status(201).json({
      success: true,
      attachment,
    });
  } catch (error) {
    if (storedFilePath) {
      try {
        await fs.unlink(storedFilePath);
      } catch {
        // Ignore cleanup failures
      }
    }

    console.error('Upload attachment controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    let statusCode = 500;
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (
      errorMessage.includes('Invalid') ||
      errorMessage.includes('Unsupported') ||
      errorMessage.includes('required')
    ) {
      statusCode = 400;
    } else if (errorMessage.includes('only modify your own')) {
      statusCode = 403;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Download an attachment
 * GET /api/v1/attachments/:id/download
 */
export const downloadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawAttachmentId = req.params.id;
    const attachmentId = Array.isArray(rawAttachmentId) ? rawAttachmentId[0] : rawAttachmentId;
    if (!attachmentId) {
      res.status(400).json({
        success: false,
        error: 'Attachment ID is required',
      });
      return;
    }

    const { attachment } = await courseService.getAttachment(attachmentId);

    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'attachments');
    const storedFilePath = path.join(
      uploadsDir,
      `${attachmentId}.${String(attachment.fileType).toLowerCase()}`
    );

    try {
      await fs.access(storedFilePath);
    } catch {
      res.status(404).json({
        success: false,
        error: 'Attachment file not found on server',
      });
      return;
    }

    res.download(storedFilePath, attachment.fileName);
  } catch (error) {
    console.error('Download attachment controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    const statusCode = errorMessage.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Delete an attachment
 * DELETE /api/v1/attachments/:id
 */
export const deleteAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawAttachmentId = req.params.id;
    const attachmentId = Array.isArray(rawAttachmentId) ? rawAttachmentId[0] : rawAttachmentId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!attachmentId) {
      res.status(400).json({
        success: false,
        error: 'Attachment ID is required',
      });
      return;
    }

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (userRole !== UserRole.INSTRUCTOR && userRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Only instructors can delete attachments',
      });
      return;
    }

    const attachmentInfo = await courseService.getAttachment(attachmentId);
    const ownerId = attachmentInfo.instructorId;

    await courseService.deleteAttachment(
      attachmentId,
      userRole === UserRole.ADMIN ? ownerId : userId
    );

    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'attachments');
    const storedFilePath = path.join(
      uploadsDir,
      `${attachmentId}.${String(attachmentInfo.attachment.fileType).toLowerCase()}`
    );
    try {
      await fs.unlink(storedFilePath);
    } catch {
      // Ignore if file already missing
    }

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Delete attachment controller error:', error);
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
