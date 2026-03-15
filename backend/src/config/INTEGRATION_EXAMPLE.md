# Database Configuration Integration Example

## Server Integration

Here's how to integrate the database configuration into your Express server:

### Basic Server Setup

```typescript
// src/server.ts
import express from 'express';
import { env } from './config/env.config';
import { 
  connectDatabase, 
  setupConnectionEventHandlers,
  disconnectDatabase 
} from './config/database.config';

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MERN Education Platform API' });
});

/**
 * Start the server with database connection
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting MERN Education Platform API...');
    console.log();

    // Step 1: Set up database event handlers
    console.log('📋 Setting up database event handlers...');
    setupConnectionEventHandlers();

    // Step 2: Connect to database with automatic retry
    console.log('🔌 Connecting to database...');
    await connectDatabase();
    console.log();

    // Step 3: Start Express server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log('✅ Server started successfully');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   API: http://localhost:${PORT}`);
      console.log();
      console.log('🎉 MERN Education Platform is ready!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
```

### With Health Check Endpoint

```typescript
// src/server.ts
import express from 'express';
import { env } from './config/env.config';
import { 
  connectDatabase, 
  setupConnectionEventHandlers,
  isConnected,
  getConnectionState,
  getPoolStats
} from './config/database.config';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const dbConnected = isConnected();
  const dbState = getConnectionState();
  const poolStats = getPoolStats();

  const health = {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbConnected,
      state: dbState,
      host: poolStats.host,
      name: poolStats.name,
    },
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
app.get('/api/v1', (req, res) => {
  res.json({ 
    message: 'MERN Education Platform API v1',
    version: '1.0.0'
  });
});

async function startServer(): Promise<void> {
  try {
    // Set up database
    setupConnectionEventHandlers();
    await connectDatabase();

    // Start server
    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
```

### With Error Handling Middleware

```typescript
// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import { env } from './config/env.config';
import { 
  connectDatabase, 
  setupConnectionEventHandlers,
  isConnected
} from './config/database.config';

const app = express();

// Middleware
app.use(express.json());

// Database connection check middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!isConnected()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection is not available',
    });
  }
  next();
});

// Routes
app.get('/api/v1/courses', (req, res) => {
  // Your route logic here
  res.json({ courses: [] });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

async function startServer(): Promise<void> {
  try {
    setupConnectionEventHandlers();
    await connectDatabase();

    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
```

### With Graceful Shutdown

```typescript
// src/server.ts
import express from 'express';
import http from 'http';
import { env } from './config/env.config';
import { 
  connectDatabase, 
  setupConnectionEventHandlers,
  disconnectDatabase
} from './config/database.config';

const app = express();
let server: http.Server;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }

  try {
    // Close database connection
    await disconnectDatabase();
    console.log('✅ Database connection closed');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    setupConnectionEventHandlers();
    await connectDatabase();

    // Start HTTP server
    const PORT = env.PORT;
    server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    // Set up graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
```

## Testing the Integration

### 1. Create .env file

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/mern-education-platform?retryWrites=true&w=majority
```

### 2. Test database connection

```bash
npm run test:db
```

### 3. Start the server

```bash
npm run dev
```

### 4. Test health endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 45.123,
  "database": {
    "connected": true,
    "state": "connected",
    "host": "cluster0.xxxxx.mongodb.net",
    "name": "mern-education-platform"
  }
}
```

## Common Patterns

### Retry on Startup Failure

```typescript
async function startServer(maxAttempts = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      setupConnectionEventHandlers();
      await connectDatabase();
      
      const PORT = env.PORT;
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
      
      return; // Success
    } catch (error) {
      console.error(`❌ Startup attempt ${attempt}/${maxAttempts} failed`);
      
      if (attempt === maxAttempts) {
        console.error('❌ All startup attempts failed');
        process.exit(1);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

### Database Connection Monitoring

```typescript
import { isConnected, getConnectionState } from './config/database.config';

// Check connection every 30 seconds
setInterval(() => {
  const connected = isConnected();
  const state = getConnectionState();
  
  if (!connected) {
    console.warn(`⚠️  Database not connected. State: ${state}`);
  }
}, 30000);
```

### Request Logging with DB Status

```typescript
import morgan from 'morgan';
import { isConnected } from './config/database.config';

// Custom morgan token for DB status
morgan.token('db-status', () => {
  return isConnected() ? 'connected' : 'disconnected';
});

app.use(morgan(':method :url :status :response-time ms - DB: :db-status'));
```

## Next Steps

After integrating the database configuration:

1. **Create Mongoose Models** (Task 2.1 - 2.8)
2. **Implement Health Check Endpoint** (Task 1.4.4)
3. **Set up Redis Connection** (Task 1.5)
4. **Create API Routes** (Tasks 3-11)

## Troubleshooting

### Server won't start

**Check**:
1. `.env` file exists and has `DATABASE_URL`
2. MongoDB Atlas IP whitelist includes your IP
3. Database credentials are correct
4. Network connectivity to MongoDB Atlas

### Connection keeps retrying

**Check**:
1. MongoDB Atlas cluster is running
2. Connection string format is correct
3. Firewall isn't blocking port 27017
4. DNS resolution is working

### Health check returns unhealthy

**Check**:
1. Database connection was established
2. Connection hasn't been lost
3. Check logs for connection errors
4. Verify MongoDB Atlas status
