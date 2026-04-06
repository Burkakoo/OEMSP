import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as questionBankService from '../services/questionBank.service';

export const listQuestionBankItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { courseId } = req.params;
    const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const items = await questionBankService.listQuestionBankItems({
      courseId: courseId as string,
      requesterId,
      requesterRole,
      includeInactive,
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    const statusCode =
      error.message?.includes('not found') ? 404 :
      error.message?.includes('Access denied') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to list question bank items',
    });
  }
};

export const createQuestionBankItem = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const item = await questionBankService.createQuestionBankItem({
      courseId: courseId as string,
      requesterId,
      requesterRole,
      payload: req.body,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    const statusCode =
      error.message?.includes('not found') ? 404 :
      error.message?.includes('Access denied') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create question bank item',
    });
  }
};

export const updateQuestionBankItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { id } = req.params;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const item = await questionBankService.updateQuestionBankItem({
      itemId: id as string,
      requesterId,
      requesterRole,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    const statusCode =
      error.message?.includes('not found') ? 404 :
      error.message?.includes('Access denied') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update question bank item',
    });
  }
};

export const deleteQuestionBankItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { id } = req.params;

    if (!requesterId || !requesterRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await questionBankService.deleteQuestionBankItem({
      itemId: id as string,
      requesterId,
      requesterRole,
    });

    res.status(200).json({
      success: true,
      message: 'Question bank item deleted successfully',
    });
  } catch (error: any) {
    const statusCode =
      error.message?.includes('not found') ? 404 :
      error.message?.includes('Access denied') ? 403 :
      400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete question bank item',
    });
  }
};
