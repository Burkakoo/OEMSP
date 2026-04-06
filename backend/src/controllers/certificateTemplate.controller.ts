import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createCertificateTemplate,
  listCertificateTemplates,
  updateCertificateTemplate,
} from '../services/certificateTemplate.service';

export const getCertificateTemplates = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const templates = await listCertificateTemplates();

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to load certificate templates',
    });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin' || !req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const template = await createCertificateTemplate(req.body || {}, req.user.userId);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Certificate template created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create certificate template',
    });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const { id } = req.params;
    const template = await updateCertificateTemplate(id as string, req.body || {});

    res.status(200).json({
      success: true,
      data: template,
      message: 'Certificate template updated successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update certificate template',
    });
  }
};
