/**
 * Health Check Routes
 * Provides endpoints for monitoring system health and database connectivity
 */

import { Router, Request, Response } from 'express';
import { isConnected, getConnectionState, getPoolStats } from '../config/database.config';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 * Returns overall system health status
 */
router.get('/', (_req: Request, res: Response) => {
  const dbConnected = isConnected();
  const dbState = getConnectionState();

  const healthStatus = {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbConnected,
      state: dbState,
    },
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

/**
 * GET /health/detailed
 * Detailed health check with diagnostic information
 * Returns comprehensive system and database statistics
 */
router.get('/detailed', (_req: Request, res: Response) => {
  const dbConnected = isConnected();
  const dbState = getConnectionState();
  const poolStats = getPoolStats();

  const detailedHealth = {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
    },
    database: {
      connected: dbConnected,
      state: dbState,
      host: poolStats.host,
      name: poolStats.name,
    },
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(detailedHealth);
});

/**
 * GET /health/ready
 * Readiness probe endpoint
 * Returns 200 if system is ready to accept traffic
 */
router.get('/ready', (_req: Request, res: Response) => {
  const dbConnected = isConnected();

  if (dbConnected) {
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      ready: false,
      reason: 'Database not connected',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness probe endpoint
 * Returns 200 if application is running
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
