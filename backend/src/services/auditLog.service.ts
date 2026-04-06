import mongoose from 'mongoose';
import AuditLog, { IAuditLog } from '../models/AuditLog';

export interface CreateAuditLogInput {
  userId?: string;
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
}

export interface AuditLogFilters {
  userId?: string;
  resource?: string;
  method?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const createAuditLog = async (
  input: CreateAuditLogInput
): Promise<IAuditLog> => {
  const normalizedUserId =
    input.userId && mongoose.Types.ObjectId.isValid(input.userId)
      ? new mongoose.Types.ObjectId(input.userId)
      : undefined;

  return AuditLog.create({
    userId: normalizedUserId,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    success: input.success,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: input.metadata,
  });
};

export const listAuditLogs = async (
  filters: AuditLogFilters = {}
): Promise<{
  logs: IAuditLog[];
  total: number;
  page: number;
  pages: number;
}> => {
  const { userId, resource, method, success, startDate, endDate, page = 1, limit = 20 } = filters;
  const query: Record<string, unknown> = {};

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  if (resource) {
    query.resource = resource;
  }

  if (method) {
    query.method = method.toUpperCase();
  }

  if (typeof success === 'boolean') {
    query.success = success;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      (query.createdAt as Record<string, unknown>).$gte = startDate;
    }
    if (endDate) {
      (query.createdAt as Record<string, unknown>).$lte = endDate;
    }
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit) || 1,
  };
};
