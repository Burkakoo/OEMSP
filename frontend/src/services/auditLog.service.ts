import apiRequest from './api';

export interface AuditLogRecord {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export const auditLogService = {
  getAuditLogs: async (): Promise<AuditLogRecord[]> => {
    const response = await apiRequest<{
      success: boolean;
      data: {
        logs: AuditLogRecord[];
      };
    }>('/audit-logs');

    return Array.isArray(response.data.logs) ? response.data.logs : [];
  },
};

export default auditLogService;
