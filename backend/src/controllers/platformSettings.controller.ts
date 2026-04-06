import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../services/platformSettings.service';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const settings = await getPlatformSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to load platform settings',
    });
  }
};

export const saveSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin' || !req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const settings = await updatePlatformSettings(req.body || {}, req.user.userId);

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Platform settings updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update platform settings',
    });
  }
};
