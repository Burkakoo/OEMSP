# Configuration Module

This directory contains the environment configuration management for the MERN Education Platform backend.

## Overview

The configuration module provides:
- **Type-safe environment variables** with TypeScript interfaces
- **Automatic validation** on application startup
- **Clear error messages** for missing or invalid configuration
- **Helper functions** for environment checks

## Files

- `env.config.ts` - Main configuration module with validation logic
- `database.config.ts` - MongoDB/Mongoose connection with retry logic
- `redis.config.ts` - Redis/ioredis connection with retry logic
- `DATABASE_CONFIG.md` - Detailed database configuration documentation
- `REDIS_CONFIG.md` - Detailed Redis configuration documentation

## Usage

### Importing Configuration

```typescript
import { env, isProduction, isDevelopment } from './config/env.config';
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';
import { connectRedis, setupGracefulShutdown } from './config/redis.config';

// Access typed environment variables
const port = env.PORT;
const dbUrl = env.DATABASE_URL;
const redisUrl = env.REDIS_URL;

// Use helper functions
if (isProduction()) {
  // Production-specific logic
}

// Connect to database
setupConnectionEventHandlers();
await connectDatabase();

// Connect to Redis
await connectRedis();
setupGracefulShutdown();
```

### Available Configuration

The `env` object provides access to all validated environment variables:

#### Server Configuration
- `NODE_ENV` - Environment mode (development/staging/production)
- `PORT` - Server port number

#### Database Configuration
- `DATABASE_URL` - MongoDB connection string

#### JWT Configuration
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `REFRESH_TOKEN_SECRET` - Refresh token secret (min 32 characters)
- `JWT_EXPIRES_IN` - Access token expiration (default: 24h)
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiration (default: 7d)

#### Payment Configuration
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

#### AWS Configuration
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_S3_BUCKET` - S3 bucket name

#### Email Configuration
- `EMAIL_SERVICE_API_KEY` - Email service API key
- `EMAIL_FROM` - Sender email address

#### Redis Configuration
- `REDIS_URL` - Redis connection string

#### CORS Configuration
- `CORS_ORIGIN` - Allowed CORS origins

#### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit time window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

## Validation

The configuration module automatically validates:

1. **Required variables** - Throws error if missing
2. **JWT secret strength** - Minimum 32 characters (256 bits)
3. **MongoDB URL format** - Must start with `mongodb://` or `mongodb+srv://`
4. **Redis URL format** - Must start with `redis://`
5. **NODE_ENV values** - Must be development, staging, or production
6. **Numeric values** - Validates PORT and rate limit settings

## Error Handling

If validation fails, the application will:
1. Print a clear error message
2. Indicate which variable is problematic
3. Exit with code 1 (prevents running with invalid config)

Example error output:
```
❌ Environment configuration validation failed:
   Missing required environment variable: JWT_SECRET. Please check your .env file.

💡 Please check your .env file and ensure all required variables are set.
   Refer to .env.example for the complete list of required variables.
```

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. Generate secure secrets for JWT:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Never commit `.env` to version control (already in .gitignore)

## Helper Functions

### `isProduction()`
Returns `true` if `NODE_ENV === 'production'`

### `isDevelopment()`
Returns `true` if `NODE_ENV === 'development'`

### `isStaging()`
Returns `true` if `NODE_ENV === 'staging'`

## Best Practices

1. **Never hardcode secrets** - Always use environment variables
2. **Use strong secrets** - Minimum 32 characters for JWT secrets
3. **Different configs per environment** - Use separate .env files for dev/staging/prod
4. **Validate early** - Configuration is validated on startup, not at runtime
5. **Type safety** - Use the `env` object for autocomplete and type checking

## Adding New Variables

To add a new environment variable:

1. Add it to the `EnvConfig` interface
2. Add validation in `validateEnvConfig()`
3. Update `.env.example` with documentation
4. Document it in this README

Example:
```typescript
// 1. Add to interface
export interface EnvConfig {
  // ... existing fields
  NEW_API_KEY: string;
}

// 2. Add validation
function validateEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    // ... existing fields
    NEW_API_KEY: getEnvVariable('NEW_API_KEY'),
  };
  return config;
}
```


## Database Configuration

The `database.config.ts` module provides MongoDB connection management with:

### Features

- **Automatic Retry Logic** - Exponential backoff for transient failures
- **Connection Pooling** - Min 10, max 100 connections (per Requirements 2.1.3)
- **Event Handlers** - Comprehensive connection monitoring
- **Graceful Shutdown** - Handles SIGINT and SIGTERM signals

### Quick Start

```typescript
import { 
  connectDatabase, 
  setupConnectionEventHandlers,
  isConnected,
  getConnectionState 
} from './config/database.config';

// Set up event handlers
setupConnectionEventHandlers();

// Connect with automatic retry
await connectDatabase();

// Check connection
if (isConnected()) {
  console.log('Database ready');
}
```

### Retry Configuration

Default retry settings:
- **Max Retries**: 5 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 30 seconds
- **Backoff Multiplier**: 2x

Custom retry configuration:
```typescript
await connectDatabase({
  maxRetries: 10,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
});
```

### Testing

Test the database connection:
```bash
npm run test:db
```

### Documentation

See [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) for complete documentation including:
- Detailed usage examples
- Error handling strategies
- Monitoring and logging
- Troubleshooting guide
- Performance considerations


## Redis Configuration

The `redis.config.ts` module provides Redis connection management with:

### Features

- **Automatic Retry Logic** - Exponential backoff for transient failures
- **Connection Pooling** - Handled automatically by ioredis
- **Event Handlers** - Comprehensive connection monitoring
- **Graceful Shutdown** - Handles SIGINT and SIGTERM signals
- **Utility Functions** - Common Redis operations (get, set, del, etc.)
- **URL Masking** - Secure logging with password masking

### Quick Start

```typescript
import { 
  connectRedis, 
  setupGracefulShutdown,
  isConnected,
  set,
  get,
  del
} from './config/redis.config';

// Connect with automatic retry
await connectRedis();
setupGracefulShutdown();

// Check connection
if (isConnected()) {
  console.log('Redis ready');
}

// Use utility functions
await set('key', 'value', 300); // 5 minutes TTL
const value = await get('key');
await del('key');
```

### Retry Configuration

Default retry settings:
- **Max Retries**: 5 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 30 seconds
- **Backoff Multiplier**: 2x

Custom retry configuration:
```typescript
await connectRedis({
  maxRetries: 10,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
});
```

### Utility Functions

The module provides convenient functions for common operations:

- `ping()` - Test connection
- `get(key)` - Get value
- `set(key, value, ttl?)` - Set value with optional TTL
- `del(...keys)` - Delete one or more keys
- `exists(key)` - Check if key exists
- `expire(key, seconds)` - Set expiration
- `ttl(key)` - Get time to live
- `incr(key)` - Increment counter
- `decr(key)` - Decrement counter
- `info(section?)` - Get Redis info

### Testing

Test the Redis connection:
```bash
npm run test -- redis.config.test.ts
```

### Documentation

See [REDIS_CONFIG.md](./REDIS_CONFIG.md) for complete documentation including:
- Detailed usage examples
- Caching strategies
- Session storage patterns
- Rate limiting implementation
- Error handling strategies
- Monitoring and logging
- Troubleshooting guide

See [REDIS_INTEGRATION_EXAMPLE.md](./REDIS_INTEGRATION_EXAMPLE.md) for practical examples:
- Complete server setup with MongoDB and Redis
- Course caching service
- Session management
- Rate limiting middleware
- Token blacklisting
