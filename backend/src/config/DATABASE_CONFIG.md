# Database Configuration Documentation

## Overview

The database configuration module (`database.config.ts`) provides a robust MongoDB connection setup using Mongoose with automatic retry logic and exponential backoff for handling transient failures.

## Features

### 1. Automatic Retry Logic

The connection system implements intelligent retry logic with exponential backoff:

- **Maximum Retries**: 5 attempts by default
- **Initial Delay**: 1 second
- **Maximum Delay**: 30 seconds (capped)
- **Backoff Multiplier**: 2x (doubles each retry)

**Retry Sequence Example**:
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Attempt 4: Wait 4 seconds
- Attempt 5: Wait 8 seconds
- Attempt 6: Wait 16 seconds

### 2. Connection Pooling

Configured according to Requirements 2.1.3:

- **Minimum Pool Size**: 10 connections
- **Maximum Pool Size**: 100 connections
- **Socket Timeout**: 45 seconds
- **Server Selection Timeout**: 5 seconds
- **Connection Timeout**: 10 seconds

### 3. Event Handlers

The module sets up comprehensive event handlers for monitoring:

- `connected` - Initial connection established
- `error` - Connection error occurred
- `disconnected` - Connection lost
- `reconnected` - Automatic reconnection successful
- `close` - Connection closed

### 4. Graceful Shutdown

Handles application termination signals:

- `SIGINT` - Ctrl+C termination
- `SIGTERM` - Process termination

## Usage

### Basic Connection

```typescript
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';

// Set up event handlers
setupConnectionEventHandlers();

// Connect to database
await connectDatabase();
```

### Custom Retry Configuration

```typescript
import { connectDatabase } from './config/database.config';

await connectDatabase({
  maxRetries: 10,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
});
```

### Checking Connection State

```typescript
import { isConnected, getConnectionState, getPoolStats } from './config/database.config';

// Check if connected
if (isConnected()) {
  console.log('Database is connected');
}

// Get connection state
const state = getConnectionState(); // 'connected', 'disconnected', 'connecting', 'disconnecting'

// Get pool statistics
const stats = getPoolStats();
console.log(`Host: ${stats.host}`);
console.log(`Database: ${stats.name}`);
console.log(`State: ${stats.state}`);
```

### Graceful Disconnection

```typescript
import { disconnectDatabase } from './config/database.config';

await disconnectDatabase();
```

## Configuration Options

### Mongoose Connection Options

The module configures the following Mongoose options:

```typescript
{
  // Connection pool (Requirements 2.1.3)
  minPoolSize: 10,
  maxPoolSize: 100,

  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // Auto-index (development only)
  autoIndex: env.NODE_ENV === 'development',

  // Retry writes
  retryWrites: true,

  // Write concern
  w: 'majority',
}
```

### Environment Variables

Required environment variable:

```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Recommended connection string parameters**:

```
mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority&minPoolSize=10&maxPoolSize=100&maxIdleTimeMS=60000&serverSelectionTimeoutMS=5000
```

## Error Handling

### Connection Failures

The module handles connection failures gracefully:

1. **Transient Failures**: Automatically retries with exponential backoff
2. **Permanent Failures**: Throws error after maximum retries
3. **Network Issues**: Logs detailed error messages

### Error Messages

```
❌ MongoDB connection failed (attempt 1/5)
   Error: connect ECONNREFUSED
   Retrying in 1 seconds...
```

### Maximum Retries Exceeded

```
❌ Maximum connection retry attempts reached
   Please check your DATABASE_URL and network connectivity
```

## Testing

### Run Connection Test

```bash
npm run test:db
```

This runs the test script that:
1. Sets up event handlers
2. Attempts connection
3. Displays connection statistics
4. Tests graceful disconnection

### Expected Output

```
============================================================
DATABASE CONNECTION TEST
============================================================

📋 Setting up connection event handlers...

🚀 Starting connection test...
🔌 Connecting to MongoDB...
   Environment: development
   Database: mern-education-platform
✅ MongoDB connected successfully
   Connection pool: 10-100 connections

📊 Connection Status:
   State: connected
   Connected: true

📊 Connection Pool Statistics:
   State: connected
   Host: cluster0.xxxxx.mongodb.net
   Database: mern-education-platform

⏳ Waiting 2 seconds...

🔌 Disconnecting...
✅ MongoDB connection closed gracefully

============================================================
✅ TEST COMPLETED SUCCESSFULLY
============================================================
```

## Integration with Application

### Server Initialization

```typescript
// src/server.ts
import express from 'express';
import { connectDatabase, setupConnectionEventHandlers } from './config/database.config';

const app = express();

async function startServer() {
  try {
    // Set up database event handlers
    setupConnectionEventHandlers();

    // Connect to database
    await connectDatabase();

    // Start Express server
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

## Monitoring and Logging

### Connection Events

All connection events are logged with appropriate emoji indicators:

- ✅ Success events (green)
- ❌ Error events (red)
- ⚠️ Warning events (yellow)
- 🔄 Reconnection events (blue)
- 📡 Status events (blue)

### Log Examples

```
📡 Mongoose connected to MongoDB
✅ MongoDB connected successfully
   Connection pool: 10-100 connections
⚠️  Mongoose disconnected from MongoDB
🔄 Mongoose reconnected to MongoDB
❌ Mongoose connection error: connection timed out
```

## Best Practices

### 1. Always Set Up Event Handlers

```typescript
setupConnectionEventHandlers();
```

Call this before connecting to ensure all events are captured.

### 2. Handle Connection Errors

```typescript
try {
  await connectDatabase();
} catch (error) {
  console.error('Database connection failed:', error);
  // Implement fallback or exit
}
```

### 3. Graceful Shutdown

The module automatically handles SIGINT and SIGTERM, but you can also manually disconnect:

```typescript
process.on('exit', async () => {
  await disconnectDatabase();
});
```

### 4. Monitor Connection State

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  const dbConnected = isConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    database: getConnectionState(),
  });
});
```

## Troubleshooting

### Connection Timeout

**Problem**: Connection times out after 5 seconds

**Solution**:
- Check MongoDB Atlas IP whitelist
- Verify network connectivity
- Check firewall settings

### Authentication Failed

**Problem**: Authentication error

**Solution**:
- Verify DATABASE_URL credentials
- Check user permissions in MongoDB Atlas
- Ensure password special characters are URL-encoded

### Pool Exhausted

**Problem**: Connection pool exhausted

**Solution**:
- Increase `maxPoolSize` in connection options
- Check for connection leaks in application code
- Review query performance

### Retry Logic Not Working

**Problem**: Connection doesn't retry

**Solution**:
- Check that `setupConnectionEventHandlers()` is called
- Verify retry configuration
- Check logs for error messages

## Performance Considerations

### Connection Pool Sizing

- **Development**: 10-50 connections
- **Staging**: 10-75 connections
- **Production**: 10-100 connections

### Timeout Configuration

Adjust timeouts based on network conditions:

```typescript
{
  serverSelectionTimeoutMS: 5000,  // Increase for slow networks
  socketTimeoutMS: 45000,          // Increase for long-running queries
  connectTimeoutMS: 10000,         // Increase for slow connections
}
```

## Requirements Compliance

This implementation satisfies the following requirements:

- **Requirement 2.1.3**: Connection pooling (min 10, max 100 connections)
- **Requirement 2.3.2**: Retry logic for transient failures
- **Requirement 2.3.2**: Exponential backoff implementation
- **Design Section**: MongoDB connection with Mongoose ODM
- **Design Section**: Automatic retry logic with exponential backoff
- **Design Section**: Connection event handling

## Related Documentation

- [MongoDB Atlas Setup](../../MONGODB_ATLAS_SETUP.md)
- [Environment Configuration](./env.config.ts)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html)
