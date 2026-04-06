import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as discussionService from '../services/discussion.service';

const getStatusCode = (errorMessage?: string): number => {
  if (!errorMessage) {
    return 400;
  }

  if (errorMessage.includes('Authentication required')) {
    return 401;
  }

  if (
    errorMessage.includes('Access denied') ||
    errorMessage.includes('must be enrolled')
  ) {
    return 403;
  }

  if (errorMessage.includes('not found')) {
    return 404;
  }

  return 400;
};

export const listDiscussionThreads = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { courseId } = req.params;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const threads = await discussionService.listDiscussionThreads({
      courseId: courseId as string,
      requesterId,
      requesterRole,
    });

    res.status(200).json({
      success: true,
      data: threads,
    });
  } catch (error: any) {
    res.status(getStatusCode(error.message)).json({
      success: false,
      message: error.message || 'Failed to list discussions',
    });
  }
};

export const createDiscussionThread = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { courseId } = req.params;
    const { title, content, moduleId, lessonId } = req.body;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const thread = await discussionService.createDiscussionThread({
      courseId: courseId as string,
      requesterId,
      requesterRole,
      title,
      content,
      moduleId,
      lessonId,
    });

    res.status(201).json({
      success: true,
      data: thread,
    });
  } catch (error: any) {
    res.status(getStatusCode(error.message)).json({
      success: false,
      message: error.message || 'Failed to create discussion thread',
    });
  }
};

export const addDiscussionReply = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { id } = req.params;
    const { content } = req.body;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const thread = await discussionService.addDiscussionReply({
      threadId: id as string,
      requesterId,
      requesterRole,
      content,
    });

    res.status(200).json({
      success: true,
      data: thread,
    });
  } catch (error: any) {
    res.status(getStatusCode(error.message)).json({
      success: false,
      message: error.message || 'Failed to reply to discussion thread',
    });
  }
};
