import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AssignmentSubmissionStatus } from '../models/AssignmentSubmission';
import { UserRole } from '../models/User';
import * as assignmentService from '../services/assignment.service';

const getStatusCodeFromError = (message: string): number => {
  if (message.includes('not found')) return 404;
  if (message.includes('Access denied')) return 403;
  if (message.includes('Authentication required')) return 401;
  return 400;
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.userId;
    const role = req.user?.role;

    if (!studentId || !role) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (role !== UserRole.STUDENT) {
      res.status(403).json({
        success: false,
        message: 'Only students can submit assignments',
      });
      return;
    }

    const { courseId, moduleId, lessonId, submissionText, attachments } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const submission = await assignmentService.submitAssignment(
      studentId,
      {
        courseId,
        moduleId,
        lessonId,
        submissionText,
        attachments,
      },
      baseUrl
    );

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Assignment submitted successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit assignment';
    res.status(getStatusCodeFromError(errorMessage)).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const listAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { courseId, lessonId, status, page, limit } = req.query;
    const normalizedStatus =
      typeof status === 'string' &&
      Object.values(AssignmentSubmissionStatus).includes(status as AssignmentSubmissionStatus)
        ? (status as AssignmentSubmissionStatus)
        : undefined;

    const result = await assignmentService.listAssignmentSubmissions({
      requesterId,
      requesterRole,
      courseId: typeof courseId === 'string' ? courseId : undefined,
      lessonId: typeof lessonId === 'string' ? lessonId : undefined,
      status: normalizedStatus,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list assignments';
    res.status(getStatusCodeFromError(errorMessage)).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const getAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Assignment submission ID is required',
      });
      return;
    }
    const submission = await assignmentService.getAssignmentSubmission(
      id,
      requesterId,
      requesterRole
    );

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get assignment';
    res.status(getStatusCodeFromError(errorMessage)).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const gradeAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const graderId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (!graderId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (requesterRole !== UserRole.INSTRUCTOR && requesterRole !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only instructors or admins can grade assignments',
      });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Assignment submission ID is required',
      });
      return;
    }
    const { score, feedback } = req.body;
    const submission = await assignmentService.gradeAssignment(id, graderId, requesterRole, {
      score: Number(score),
      feedback,
    });

    res.status(200).json({
      success: true,
      data: submission,
      message: 'Assignment graded successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to grade assignment';
    res.status(getStatusCodeFromError(errorMessage)).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const downloadAssignmentAttachment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const attachmentId = Array.isArray(req.params.attachmentId)
      ? req.params.attachmentId[0]
      : req.params.attachmentId;
    if (!id || !attachmentId) {
      res.status(400).json({
        success: false,
        message: 'Assignment submission ID and attachment ID are required',
      });
      return;
    }
    const { filePath, fileName } = await assignmentService.getAssignmentAttachmentDownload(
      id,
      attachmentId,
      requesterId,
      requesterRole
    );

    res.download(filePath, fileName);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to download assignment attachment';
    res.status(getStatusCodeFromError(errorMessage)).json({
      success: false,
      message: errorMessage,
    });
  }
};
