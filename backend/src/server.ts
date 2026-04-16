/**
 * Main server entry point for MERN Education Platform Backend
 */

// Load global type augmentations (e.g. Express Request.user)
import './types/express';

import express, { Application } from 'express';
import { env } from './config/env.config';
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';
import { connectRedis, setupGracefulShutdown as setupRedisShutdown } from './config/redis.config';
import { createSessionMiddleware, setupSessionCleanup } from './config/session.config';
import {
  configureHelmet,
  configureCORS,
  generalRateLimiter,
  requestSizeLimits,
  sanitizeInput,
  securityHeaders,
  preventParameterPollution,
} from './middleware/security.middleware';
import {
  requestLogger,
  detailedRequestLogger,
  auditLogMiddleware,
  performanceLogger,
} from './middleware/logging.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import moduleRoutes from './routes/module.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import quizRoutes from './routes/quiz.routes';
import questionRoutes from './routes/question.routes';
import questionBankRoutes from './routes/questionBank.routes';
import paymentRoutes from './routes/payment.routes';
import couponRoutes from './routes/coupon.routes';
import certificateTemplateRoutes from './routes/certificateTemplate.routes';
import certificateRoutes from './routes/certificate.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import assignmentRoutes from './routes/assignment.routes';
import discussionRoutes from './routes/discussion.routes';
import auditLogRoutes from './routes/auditLog.routes';
import platformSettingsRoutes from './routes/platformSettings.routes';

const app: Application = express();
app.set('trust proxy', 1);

// Security Middleware (applied first)
app.use(configureHelmet());
app.use(configureCORS());
app.use(securityHeaders);
app.use(requestSizeLimits);

// Logging Middleware
app.use(requestLogger);
app.use(detailedRequestLogger);
app.use(performanceLogger);

// Body parsing middleware
// Increase JSON limit so base64 attachment payloads can be uploaded from the instructor UI.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization and validation
app.use(sanitizeInput);
app.use(preventParameterPollution);

// Health routes stay ahead of the global rate limiter so Render probes are never throttled.
app.use('/health', healthRoutes);

// Root route for API status
app.get('/', (_req, res) => {
  res.json({
    message: 'MERN Education Platform API is running',
    version: '1.0.0',
    status: 'healthy',
    documentation: '/api/v1',
    health: {
      basic: '/health',
      detailed: '/health/detailed',
    },
  });
});

// Rate limiting (general)
app.use(generalRateLimiter);

// Audit logging
app.use(auditLogMiddleware);

// Note: Session middleware will be added after Redis connection is established

async function startServer(): Promise<void> {
  try {
    setupConnectionEventHandlers();

    await connectDatabase();

    console.log('Connecting to Redis or fallback storage...');
    await connectRedis();
    console.log('Redis-compatible storage ready');

    setupRedisShutdown();

    app.use(createSessionMiddleware());
    console.log('Session middleware configured');

    setupSessionCleanup();

    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/courses', courseRoutes);
    app.use('/api/v1', moduleRoutes);
    app.use('/api/v1/enrollments', enrollmentRoutes);
    app.use('/api/v1/quizzes', quizRoutes);
    app.use('/api/v1/questions', questionRoutes);
    app.use('/api/v1/question-bank', questionBankRoutes);
    app.use('/api/v1/discussions', discussionRoutes);
    app.use('/api/v1/payments', paymentRoutes);
    app.use('/api/v1/coupons', couponRoutes);
    app.use('/api/v1/certificate-templates', certificateTemplateRoutes);
    app.use('/api/v1/certificates', certificateRoutes);
    app.use('/api/v1/notifications', notificationRoutes);
    app.use('/api/v1/analytics', analyticsRoutes);
    app.use('/api/v1/assignments', assignmentRoutes);
    app.use('/api/v1/audit-logs', auditLogRoutes);
    app.use('/api/v1/platform-settings', platformSettingsRoutes);
    console.log('API routes configured');

    const PORT = env.PORT || 5000;
    const publicBaseUrl =
      env.PUBLIC_BASE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${PORT}`;

    app.listen(PORT, () => {
      console.log('Server started successfully');
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health check: ${publicBaseUrl}/health`);
      console.log(`Detailed health: ${publicBaseUrl}/health/detailed`);
      console.log(`Readiness probe: ${publicBaseUrl}/health/ready`);
      console.log(`Liveness probe: ${publicBaseUrl}/health/live`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };
