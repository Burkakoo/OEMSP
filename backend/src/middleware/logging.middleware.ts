import morgan from 'morgan';
import { Request, Response } from 'express';
import { env } from '../config/env.config';
import { createAuditLog } from '../services/auditLog.service';

/**
 * Logging Middleware
 * Configures request logging and audit logging
 */

/**
 * Custom token for morgan to log user ID
 */
morgan.token('user-id', (req: Request) => {
  return (req as any).user?.userId || 'anonymous';
});

/**
 * Custom token for morgan to log request body (sanitized)
 */
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Don't log sensitive fields
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    delete sanitizedBody.refreshToken;

    return JSON.stringify(sanitizedBody);
  }
  return '';
});

/**
 * Request logging middleware
 * Logs all HTTP requests with details
 */
export const requestLogger = morgan(
  ':method :url :status :response-time ms - :res[content-length] - User: :user-id',
  {
    skip: (_req: Request) => {
      // Skip logging for health check endpoints
      return _req.url === '/health' || _req.url === '/health/live' || _req.url === '/health/ready';
    },
  }
);

/**
 * Detailed request logger for development
 */
export const detailedRequestLogger = morgan(
  ':method :url :status :response-time ms - :res[content-length] - User: :user-id - Body: :body',
  {
    skip: (_req: Request) => {
      // Only log in development
      return env.NODE_ENV !== 'development';
    },
  }
);

/**
 * Error logging function
 * Logs errors with context
 */
export const logError = (error: Error, context?: any) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };

  console.error('❌ Error:', JSON.stringify(errorLog, null, 2));
};

/**
 * Audit logging for sensitive operations
 * Logs user actions that modify data
 */
export const auditLog = (
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: any
) => {
  const timestamp = new Date().toISOString();
  const auditEntry = {
    timestamp,
    userId,
    action,
    resource,
    resourceId,
    details,
  };

  // In production, this should write to a dedicated audit log file or service
  console.log('📝 Audit:', JSON.stringify(auditEntry));
};

/**
 * Audit logging middleware
 * Automatically logs certain operations
 */
export const auditLogMiddleware = (req: Request, res: Response, next: any) => {
  res.on('finish', () => {
    const sensitiveOperations = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!sensitiveOperations.includes(req.method)) {
      return;
    }

    const userId = ((req as any).user?.userId as string) || 'anonymous';
    const action = `${req.method} ${req.path}`;
    const pathParts = req.path.split('/').filter(Boolean);
    const resource = pathParts[2] || pathParts[0] || 'unknown';
    const paramId = req.params.id;
    const resourceId = Array.isArray(paramId) ? paramId[0] : paramId;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;
    const metadata = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    };

    auditLog(userId || 'anonymous', action, resource, resourceId || 'N/A', metadata);

    void createAuditLog({
      userId,
      action,
      resource,
      resourceId: resourceId || undefined,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      success: res.statusCode >= 200 && res.statusCode < 400,
      ipAddress,
      userAgent: req.headers['user-agent'],
      metadata,
    }).catch((error) => {
      console.error('Failed to persist audit log:', error);
    });
  });

  next();
};

/**
 * Log rotation configuration
 * NOTE: In production, use a proper logging library like Winston with rotation
 */
export const configureLogRotation = () => {
  // Placeholder for log rotation configuration
  // In production, you would use Winston with winston-daily-rotate-file:
  /*
  const winston = require('winston');
  require('winston-daily-rotate-file');

  const transport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  });

  const logger = winston.createLogger({
    transports: [transport]
  });

  return logger;
  */

  console.log('📋 Log rotation would be configured here in production');
};

/**
 * Performance logging
 * Logs slow requests
 */
export const performanceLogger = (req: Request, res: Response, next: any) => {
  const start = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Override send function to log performance
  res.send = function (data: any) {
    const duration = Date.now() - start;

    // Log requests that take longer than 1 second
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }

    // Call original send function
    return originalSend.call(this, data);
  };

  next();
};
