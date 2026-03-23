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
import paymentRoutes from './routes/payment.routes';
import certificateRoutes from './routes/certificate.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';

const app: Application = express();

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

// Rate limiting (general)
app.use(generalRateLimiter);

// Audit logging
app.use(auditLogMiddleware);

// Note: Session middleware will be added after Redis connection is established

// Health check routes (before rate limiting for monitoring)
app.use('/health', healthRoutes);

/**
 * Starts the Express server and establishes database connection
 */
async function startServer(): Promise<void> {
  try {
    // Set up database connection event handlers
    setupConnectionEventHandlers();

    // Connect to database
    await connectDatabase();

    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Set up Redis graceful shutdown
    setupRedisShutdown();

    // Add session middleware after Redis connection
    app.use(createSessionMiddleware());
    console.log('✅ Session middleware configured');

    // Set up session cleanup
    setupSessionCleanup();

    // API Routes
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/courses', courseRoutes);
    // Module routes already include `/modules`, `/lessons`, `/attachments` path segments.
    app.use('/api/v1', moduleRoutes);
    app.use('/api/v1/enrollments', enrollmentRoutes);
    app.use('/api/v1/quizzes', quizRoutes);
    app.use('/api/v1/questions', questionRoutes);
    app.use('/api/v1/payments', paymentRoutes);
    app.use('/api/v1/certificates', certificateRoutes);
    app.use('/api/v1/notifications', notificationRoutes);
    app.use('/api/v1/analytics', analyticsRoutes);
    console.log('✅ API routes configured');

    // Start Express server
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('✅ Server started successfully');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   Detailed health: http://localhost:${PORT}/health/detailed`);
      console.log(`   Readiness probe: http://localhost:${PORT}/health/ready`);
      console.log(`   Liveness probe: http://localhost:${PORT}/health/live`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
