# Redis Integration Example

## Complete Server Setup with Redis and MongoDB

This example shows how to integrate both MongoDB and Redis in your Express application.

### server.ts

```typescript
import express from 'express';
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';
import { connectRedis, setupGracefulShutdown, isConnected as isRedisConnected } from './config/redis.config';
import { env } from './config/env.config';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const redisConnected = isRedisConnected();
  
  const status = dbConnected && redisConnected ? 'healthy' : 'unhealthy';
  
  res.status(status === 'healthy' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      redis: redisConnected ? 'connected' : 'disconnected'
    }
  });
});

async function startServer() {
  try {
    console.log('🚀 Starting MERN Education Platform...\n');
    
    // Initialize MongoDB
    console.log('📦 Initializing MongoDB...');
    await connectDatabase();
    setupConnectionEventHandlers();
    
    // Initialize Redis
    console.log('📦 Initializing Redis...');
    await connectRedis();
    setupGracefulShutdown();
    
    console.log('\n✅ All services initialized successfully\n');
    
    // Start Express server
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## Caching Example

### Course Service with Redis Caching

```typescript
import { Course } from '../models/course.model';
import { get, set, del } from '../config/redis.config';

export class CourseService {
  private static CACHE_TTL = 3600; // 1 hour
  
  /**
   * Get course by ID with caching
   */
  static async getCourseById(courseId: string) {
    const cacheKey = `course:${courseId}`;
    
    try {
      // Try to get from cache
      const cached = await get(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
      
      console.log(`❌ Cache miss: ${cacheKey}`);
    } catch (error) {
      console.error('Redis error, falling back to database:', error);
    }
    
    // Get from database
    const course = await Course.findById(courseId);
    
    if (course) {
      // Cache the result
      try {
        await set(cacheKey, JSON.stringify(course), this.CACHE_TTL);
        console.log(`💾 Cached: ${cacheKey}`);
      } catch (error) {
        console.error('Failed to cache course:', error);
      }
    }
    
    return course;
  }
  
  /**
   * Update course and invalidate cache
   */
  static async updateCourse(courseId: string, updateData: any) {
    // Update in database
    const course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });
    
    // Invalidate cache
    const cacheKey = `course:${courseId}`;
    try {
      await del(cacheKey);
      console.log(`🗑️  Cache invalidated: ${cacheKey}`);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
    
    return course;
  }
  
  /**
   * Get all courses with caching
   */
  static async getAllCourses() {
    const cacheKey = 'courses:all';
    
    try {
      const cached = await get(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis error:', error);
    }
    
    // Get from database
    const courses = await Course.find();
    
    // Cache with shorter TTL (5 minutes) since list changes frequently
    try {
      await set(cacheKey, JSON.stringify(courses), 300);
      console.log(`💾 Cached: ${cacheKey}`);
    } catch (error) {
      console.error('Failed to cache courses:', error);
    }
    
    return courses;
  }
}
```

## Session Storage Example

### User Session Management

```typescript
import { set, get, del, expire } from '../config/redis.config';

export class SessionService {
  private static SESSION_TTL = 86400; // 24 hours
  
  /**
   * Create user session
   */
  static async createSession(userId: string, sessionData: any) {
    const sessionKey = `session:${userId}`;
    
    try {
      await set(sessionKey, JSON.stringify(sessionData), this.SESSION_TTL);
      console.log(`✅ Session created for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to create session:', error);
      return false;
    }
  }
  
  /**
   * Get user session
   */
  static async getSession(userId: string) {
    const sessionKey = `session:${userId}`;
    
    try {
      const session = await get(sessionKey);
      if (session) {
        // Extend session TTL on access
        await expire(sessionKey, this.SESSION_TTL);
        return JSON.parse(session);
      }
      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
  
  /**
   * Delete user session (logout)
   */
  static async deleteSession(userId: string) {
    const sessionKey = `session:${userId}`;
    
    try {
      await del(sessionKey);
      console.log(`✅ Session deleted for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }
}
```

## Rate Limiting Example

### API Rate Limiter

```typescript
import { incr, expire, ttl } from '../config/redis.config';

export class RateLimiter {
  /**
   * Check if request is allowed
   * @param identifier - IP address or user ID
   * @param maxRequests - Maximum requests per window
   * @param windowSeconds - Time window in seconds
   */
  static async isAllowed(
    identifier: string,
    maxRequests: number = 100,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `ratelimit:${identifier}`;
    
    try {
      // Increment counter
      const current = await incr(key);
      
      // Set expiration on first request
      if (current === 1) {
        await expire(key, windowSeconds);
      }
      
      // Get remaining TTL
      const resetIn = await ttl(key);
      
      // Check if limit exceeded
      const allowed = current <= maxRequests;
      const remaining = Math.max(0, maxRequests - current);
      
      return {
        allowed,
        remaining,
        resetIn: resetIn > 0 ? resetIn : windowSeconds
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests,
        resetIn: windowSeconds
      };
    }
  }
}

// Express middleware
export function rateLimitMiddleware(maxRequests = 100, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    
    const result = await RateLimiter.isAllowed(identifier, maxRequests, windowSeconds);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetIn);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
        retryAfter: result.resetIn
      });
    }
    
    next();
  };
}
```

## Token Blacklist Example

### JWT Token Blacklisting

```typescript
import { set, exists } from '../config/redis.config';

export class TokenBlacklist {
  /**
   * Blacklist a token
   * @param token - JWT token
   * @param expiresIn - Token expiration time in seconds
   */
  static async blacklistToken(token: string, expiresIn: number) {
    const key = `blacklist:${token}`;
    
    try {
      // Store token with TTL matching its expiration
      await set(key, '1', expiresIn);
      console.log(`🚫 Token blacklisted: ${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('Failed to blacklist token:', error);
      return false;
    }
  }
  
  /**
   * Check if token is blacklisted
   * @param token - JWT token
   */
  static async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    
    try {
      const result = await exists(key);
      return result === 1;
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      // Fail secure - treat as blacklisted if Redis is down
      return true;
    }
  }
}

// Express middleware
export function checkTokenBlacklist() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    
    if (isBlacklisted) {
      return res.status(401).json({ 
        error: 'Token has been revoked',
        message: 'Please login again'
      });
    }
    
    next();
  };
}
```

## Testing Redis Connection

### Test Script

Create `test-redis.ts`:

```typescript
import { connectRedis, ping, set, get, del, disconnectRedis } from './config/redis.config';

async function testRedis() {
  try {
    console.log('🧪 Testing Redis connection...\n');
    
    // Connect
    await connectRedis();
    
    // Test ping
    console.log('1. Testing PING...');
    const pong = await ping();
    console.log(`   ✅ ${pong}\n`);
    
    // Test set/get
    console.log('2. Testing SET/GET...');
    await set('test:key', 'Hello Redis!', 60);
    const value = await get('test:key');
    console.log(`   ✅ Value: ${value}\n`);
    
    // Test delete
    console.log('3. Testing DEL...');
    const deleted = await del('test:key');
    console.log(`   ✅ Deleted ${deleted} key(s)\n`);
    
    // Disconnect
    await disconnectRedis();
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRedis();
```

Run the test:

```bash
npx ts-node src/test-redis.ts
```

## Environment Setup

Ensure your `.env` file has:

```env
# MongoDB
DATABASE_URL=mongodb://localhost:27017/mern-education-platform

# Redis
REDIS_URL=redis://localhost:6379

# Other configs...
```

## Next Steps

1. ✅ Redis client configured
2. ⏭️ Implement cache utility functions (Task 1.5.3)
3. ⏭️ Set up session storage (Task 1.5.4)
4. ⏭️ Implement rate limiting (Task 12.1.3)

---

**Related Documentation**:
- [REDIS_CONFIG.md](./REDIS_CONFIG.md) - Redis configuration details
- [REDIS_SETUP.md](../../REDIS_SETUP.md) - Redis installation guide
- [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) - Database configuration

