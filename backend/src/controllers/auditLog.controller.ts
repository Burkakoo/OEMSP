import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { listAuditLogs } from '../services/auditLog.service';
import { Permission, hasPermission } from '../authorization/permissions';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!hasPermission(req.user?.permissions, Permission.AUDIT_LOGS_READ)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const { userId, resource, method, success, page, limit, startDate, endDate } = req.query;

    const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    const data = await listAuditLogs({
      userId: userId as string | undefined,
      resource: resource as string | undefined,
      method: method as string | undefined,
      success:
        success === 'true' ? true : success === 'false' ? false : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to load audit logs',
    });
  }
};
