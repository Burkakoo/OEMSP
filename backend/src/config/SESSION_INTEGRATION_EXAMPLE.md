# Session Storage Integration Example

This document provides a complete example of integrating session storage into the MERN Education Platform.

## Complete Authentication Flow Example

### 1. Authentication Routes

```typescript
// backend/src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { SessionUtils } from '../config/session.config';
import bcrypt from 'bcrypt';
import User from '../models/User';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/v1/auth/login
 * Login user and create session
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check if instructor is approved
    if (user.role === 'instructor' && !user.isApproved) {
      return res.status(401).json({ error: 'Account pending admin approval' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Regenerate session ID (prevent session fixation)
    await SessionUtils.regenerate(req.session);

    // Set authentication data in session
    SessionUtils.setAuthenticated(
      req.session,
      user._id.toString(),
      user.email,
      user.role,
      rememberMe || false
    );

    // Update last login timestamp
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user and destroy session
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    if (!SessionUtils.isAuthenticated(req.session)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Destroy session
    await SessionUtils.destroy(req.session);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/v1/auth/session
 * Get current session information
 */
router.get('/session', (req: Request, res: Response) => {
  if (!SessionUtils.isAuthenticated(req.session)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    success: true,
    session: {
      userId: req.session.userId,
      email: req.session.email,
      role: req.session.role,
      isAuthenticated: req.session.isAuthenticated,
      lastActivity: req.session.lastActivity,
    },
  });
});

export default router;
```

### 2. Authentication Middleware

```typescript
// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { SessionUtils } from '../config/session.config';

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if session is authenticated
  if (!SessionUtils.isAuthenticated(req.session)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check for inactivity (30 minutes)
  if (SessionUtils.isInactive(req.session, 30 * 60 * 1000)) {
    SessionUtils.clearAuthentication(req.session);
    return res.status(401).json({ error: 'Session expired due to inactivity' });
  }

  // Update activity timestamp
  SessionUtils.updateActivity(req.session);

  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!SessionUtils.isAuthenticated(req.session)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.session.role || '')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Middleware to optionally authenticate (doesn't fail if not authenticated)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (SessionUtils.isAuthenticated(req.session)) {
    SessionUtils.updateActivity(req.session);
  }

  next();
}

/**
 * Middleware to update activity on every request
 */
export function updateActivity(req: Request, res: Response, next: NextFunction) {
  if (SessionUtils.isAuthenticated(req.session)) {
    SessionUtils.updateActivity(req.session);
  }

  next();
}
```

### 3. Protected Routes Example

```typescript
// backend/src/routes/user.routes.ts
import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import User from '../models/User';

const router = Router();

/**
 * GET /api/v1/users/profile
 * Get current user profile (requires authentication)
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/v1/users/profile
 * Update current user profile (requires authentication)
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const updates = req.body;

    // Don't allow updating sensitive fields
    delete updates.passwordHash;
    delete updates.role;
    delete updates.isActive;
    delete updates.isApproved;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/v1/users
 * List all users (admin only)
 */
router.get('/', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash');

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

export default router;
```

### 4. Server Setup

```typescript
// backend/src/server.ts
import express, { Application } from 'express';
import { env } from './config/env.config';
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';
import { connectRedis, setupGracefulShutdown as setupRedisShutdown } from './config/redis.config';
import { createSessionMiddleware, setupSessionCleanup } from './config/session.config';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { updateActivity } from './middleware/auth.middleware';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function startServer(): Promise<void> {
  try {
    // Set up database connection
    setupConnectionEventHandlers();
    await connectDatabase();

    // Connect to Redis
    await connectRedis();
    setupRedisShutdown();

    // Add session middleware after Redis connection
    app.use(createSessionMiddleware());

    // Update activity on every request
    app.use(updateActivity);

    // Set up session cleanup
    setupSessionCleanup();

    // Routes
    app.use('/health', healthRoutes);
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', userRoutes);

    // Start server
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('✅ Server started successfully');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };
```

### 5. Frontend Integration Example

```typescript
// frontend/src/services/auth.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/auth';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const authService = {
  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  },

  /**
   * Login user
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
      rememberMe,
    });
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
  },

  /**
   * Get current session
   */
  async getSession() {
    const response = await axios.get(`${API_URL}/session`);
    return response.data;
  },
};
```

## Testing the Integration

### 1. Start Redis

```bash
redis-server
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

### 3. Test with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'

# Login (save cookies)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "rememberMe": false
  }'

# Get session (use saved cookies)
curl -X GET http://localhost:5000/api/v1/auth/session \
  -b cookies.txt

# Get profile (protected route)
curl -X GET http://localhost:5000/api/v1/users/profile \
  -b cookies.txt

# Logout
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -b cookies.txt
```

### 4. Check Redis

```bash
# Connect to Redis CLI
redis-cli

# List all session keys
KEYS session:*

# Get session data
GET session:<sessionId>

# Check TTL
TTL session:<sessionId>
```

## Session Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /login
       │    (email, password)
       ▼
┌─────────────────────────────┐
│   Express Server            │
│                             │
│  ┌──────────────────────┐  │
│  │ Auth Controller      │  │
│  │ - Verify credentials │  │
│  │ - Regenerate session │  │
│  │ - Set auth data      │  │
│  └──────────┬───────────┘  │
│             │               │
│             ▼               │
│  ┌──────────────────────┐  │
│  │ Session Middleware   │  │
│  │ - Create session     │  │
│  │ - Set cookie         │  │
│  └──────────┬───────────┘  │
└─────────────┼───────────────┘
              │
              ▼
       ┌─────────────┐
       │    Redis    │
       │             │
       │ session:abc │
       │ {           │
       │   userId,   │
       │   email,    │
       │   role,     │
       │   ...       │
       │ }           │
       │ TTL: 86400s │
       └─────────────┘
```

## Best Practices

1. **Always regenerate session ID after login** to prevent session fixation
2. **Use HTTPS in production** for secure cookie transmission
3. **Implement inactivity timeout** to automatically expire idle sessions
4. **Update activity timestamp** on each request to track user activity
5. **Clear authentication data** before destroying session
6. **Use role-based middleware** for access control
7. **Never store sensitive data** in sessions (passwords, tokens)
8. **Monitor session statistics** for security and performance

## Security Checklist

- ✅ HTTP-only cookies (prevents XSS)
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite protection (prevents CSRF)
- ✅ Session ID regeneration after login (prevents fixation)
- ✅ Strong session secret (256-bit minimum)
- ✅ Inactivity timeout (30 minutes default)
- ✅ Rolling sessions (TTL reset on access)
- ✅ Redis TTL for automatic cleanup

## Troubleshooting

### Sessions Not Persisting

1. Check Redis connection: `redis-cli ping`
2. Verify session middleware is added after Redis connection
3. Check `withCredentials: true` in frontend axios configuration
4. Verify CORS allows credentials

### Session Expired Too Quickly

1. Check `maxAge` in cookie configuration
2. Verify `rolling: true` to reset TTL on each request
3. Check Redis TTL: `TTL session:<sessionId>`

### Cookie Not Being Set

1. Verify `secure` setting matches protocol (HTTP/HTTPS)
2. Check `sameSite` setting compatibility
3. Verify CORS configuration allows credentials
4. Check browser console for cookie errors

---

This integration example demonstrates a complete authentication flow using Redis-backed session storage in the MERN Education Platform.
