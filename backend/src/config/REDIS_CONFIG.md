# Redis Configuration Documentation

## Overview

The Redis configuration module (`redis.config.ts`) provides a robust connection management system for Redis using the ioredis client library. It follows the same patterns established in `database.config.ts` for consistency across the application.

## Features

- **Automatic retry logic** with exponential backoff
- **Connection pooling** handled by ioredis
- **Comprehensive error handling** with detailed logging
- **Graceful shutdown** on SIGINT/SIGTERM signals
- **Connection state monitoring** with event handlers
- **Utility functions** for common Redis operations
- **URL masking** for secure logging

## Configuration

### Environment Variables

The Redis configuration requires the `REDIS_URL` environment variable to be set in your `.env` file:

```env
# Local development
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@localhost:6379

# With username and password
REDIS_URL=redis://username:password@host:port

# TLS connection
REDIS_URL=rediss://username:password@host:port
```

See `.env.example` for the complete configuration template.

### Connection Options

The Redis client is configured with the following options:

- **Retry Strategy**: Exponential backoff with configurable max retries
- **Connect Timeout**: 10 seconds
- **Command Timeout**: 5 seconds
- **Max Retries Per Request**: 3
- **Keep Alive**: 30 seconds
- **Lazy Connect**: Connection is established when `connectRedis()` is called
- **Offline Queue**: Commands are queued when connection is lost

### Retry Configuration

Default retry configuration:

```typescript
{
  maxRetries: 5,
  initialDelayMs: 1000,      // Start with 1 second
  maxDelayMs: 30000,         // Cap at 30 seconds
  backoffMultiplier: 2       // Double the delay each retry
}
```

## Usage

### Basic Setup

```typescript
import { connectRedis, setupGracefulShutdown } from './config/redis.config';

// Initialize Redis connection
async function initializeApp() {
  try {
    await connectRedis();
    setupGracefulShutdown();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    process.exit(1);
  }
}
```

### Using Redis Client Directly

```typescript
import { getRedisClient } from './config/redis.config';

async function example() {
  const redis = getRedisClient();
  
  // Set a value
  await redis.set('key', 'value');
  
  // Get a value
  const value = await redis.get('key');
  
  // Set with expiration
  await redis.setex('key', 300, 'value'); // 5 minutes
  
  // Delete a key
  await redis.del('key');
}
```

### Using Utility Functions

The module provides convenient utility functions for common operations:

```typescript
import { set, get, del, exists, expire, ttl, incr, decr } from './config/redis.config';

// Set a value with optional TTL
await set('user:123', JSON.stringify(userData), 3600); // 1 hour

// Get a value
const data = await get('user:123');
const userData = data ? JSON.parse(data) : null;

// Check if key exists
const keyExists = await exists('user:123'); // Returns 1 if exists, 0 otherwise

// Set expiration on existing key
await expire('user:123', 1800); // 30 minutes

// Get TTL
const remaining = await ttl('user:123'); // Returns seconds remaining

// Delete keys
await del('user:123', 'user:456');

// Increment/decrement counters
await incr('page:views'); // Increment by 1
await decr('stock:count'); // Decrement by 1
```

### Connection Management

```typescript
import { 
  connectRedis, 
  disconnectRedis, 
  isConnected, 
  getConnectionState,
  getConnectionStats 
} from './config/redis.config';

// Connect to Redis
await connectRedis();

// Check connection status
if (isConnected()) {
  console.log('Redis is ready');
}

// Get connection state
const state = getConnectionState(); // 'ready', 'connecting', 'reconnecting', etc.

// Get connection statistics
const stats = getConnectionStats();
console.log(stats);
// {
//   status: 'ready',
//   isConnected: true,
//   host: 'localhost',
//   port: 6379
// }

// Disconnect gracefully
await disconnectRedis();
```

### Health Check

```typescript
import { ping, isConnected } from './config/redis.config';

async function healthCheck() {
  try {
    if (!isConnected()) {
      return { status: 'unhealthy', message: 'Redis not connected' };
    }
    
    const pong = await ping();
    return { status: 'healthy', message: pong };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}
```

## Connection Events

The module sets up event handlers for monitoring Redis connection:

- **connect**: Fired when connection is initiated
- **ready**: Fired when connection is ready for commands
- **error**: Fired when connection error occurs
- **close**: Fired when connection is closed
- **reconnecting**: Fired when reconnection is attempted
- **end**: Fired when connection is permanently ended

All events are logged with appropriate emoji indicators for easy monitoring.

## Error Handling

### Connection Errors

If Redis connection fails, the module will:

1. Log the error with details
2. Attempt to reconnect with exponential backoff
3. Retry up to `maxRetries` times (default: 5)
4. Throw an error if all retries are exhausted

### Runtime Errors

When using Redis operations, always wrap them in try-catch blocks:

```typescript
import { get, set } from './config/redis.config';

async function cacheUser(userId: string, userData: any) {
  try {
    await set(`user:${userId}`, JSON.stringify(userData), 3600);
  } catch (error) {
    console.error('Failed to cache user:', error);
    // Handle error appropriately (log, fallback, etc.)
  }
}

async function getCachedUser(userId: string) {
  try {
    const data = await get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get cached user:', error);
    return null; // Fallback to null
  }
}
```

## Graceful Shutdown

The module automatically handles graceful shutdown on SIGINT and SIGTERM signals. To enable this:

```typescript
import { setupGracefulShutdown } from './config/redis.config';

// Call once during application initialization
setupGracefulShutdown();
```

This ensures Redis connections are properly closed when the application terminates.

## Best Practices

### 1. Initialize Early

Initialize Redis connection early in your application startup:

```typescript
// server.ts
import { connectRedis, setupGracefulShutdown } from './config/redis.config';

async function startServer() {
  // Connect to Redis before starting server
  await connectRedis();
  setupGracefulShutdown();
  
  // Start Express server
  app.listen(port);
}
```

### 2. Use Utility Functions

Prefer utility functions over direct client access for common operations:

```typescript
// Good
import { set, get } from './config/redis.config';
await set('key', 'value', 300);

// Also fine, but more verbose
import { getRedisClient } from './config/redis.config';
const redis = getRedisClient();
await redis.setex('key', 300, 'value');
```

### 3. Handle Errors Gracefully

Always handle Redis errors gracefully and provide fallbacks:

```typescript
async function getCourse(courseId: string) {
  try {
    // Try to get from cache
    const cached = await get(`course:${courseId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Redis error, falling back to database:', error);
  }
  
  // Fallback to database
  return await Course.findById(courseId);
}
```

### 4. Use Appropriate TTLs

Set appropriate TTLs based on data volatility:

```typescript
// Frequently changing data - short TTL
await set('trending:courses', JSON.stringify(courses), 300); // 5 minutes

// Relatively stable data - medium TTL
await set('course:123', JSON.stringify(course), 3600); // 1 hour

// Rarely changing data - long TTL
await set('categories', JSON.stringify(categories), 86400); // 24 hours
```

### 5. Use Namespaced Keys

Use consistent key naming patterns with namespaces:

```typescript
// Good - namespaced keys
await set('user:123:profile', data);
await set('course:456:details', data);
await set('session:abc123', data);

// Bad - flat keys
await set('123', data);
await set('userdata', data);
```

### 6. Monitor Connection State

Monitor Redis connection state in production:

```typescript
import { getConnectionStats } from './config/redis.config';

// Add to health check endpoint
app.get('/health', async (req, res) => {
  const redisStats = getConnectionStats();
  
  res.json({
    status: redisStats.isConnected ? 'healthy' : 'unhealthy',
    redis: redisStats
  });
});
```

## Integration Example

Complete example of integrating Redis in your application:

```typescript
// server.ts
import express from 'express';
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';
import { connectRedis, setupGracefulShutdown } from './config/redis.config';

const app = express();

async function startServer() {
  try {
    // Initialize database
    await connectDatabase();
    setupConnectionEventHandlers();
    
    // Initialize Redis
    await connectRedis();
    setupGracefulShutdown();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## Troubleshooting

### Connection Refused

If you see `ECONNREFUSED` errors:

1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in `.env` file
3. Verify Redis port (default: 6379)
4. Check firewall rules

### Authentication Errors

If you see `NOAUTH` errors:

1. Add password to REDIS_URL: `redis://:password@host:port`
2. Verify password in Redis configuration

### Timeout Errors

If operations timeout:

1. Check network connectivity
2. Verify Redis server is responsive
3. Consider increasing timeout values
4. Check for slow Redis commands

### Memory Issues

If Redis runs out of memory:

1. Set `maxmemory` in redis.conf
2. Configure eviction policy: `maxmemory-policy allkeys-lru`
3. Reduce TTLs for cached data
4. Clear unused keys

## Related Documentation

- [REDIS_SETUP.md](../../REDIS_SETUP.md) - Redis installation and setup guide
- [REDIS_QUICKSTART.md](../../REDIS_QUICKSTART.md) - Quick start guide
- [env.config.ts](./env.config.ts) - Environment configuration
- [database.config.ts](./database.config.ts) - Database configuration (similar pattern)

## References

- [ioredis Documentation](https://github.com/luin/ioredis)
- [Redis Commands](https://redis.io/commands)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Last Updated**: 2024
**Module Version**: 1.0.0

