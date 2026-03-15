/**
 * Database Configuration Module
 * Establishes MongoDB connection using Mongoose with automatic retry logic
 * and exponential backoff for transient failures
 */

import mongoose from 'mongoose';
import { env } from './env.config';

/**
 * Connection retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration with exponential backoff
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // Start with 1 second
  maxDelayMs: 30000, // Cap at 30 seconds
  backoffMultiplier: 2, // Double the delay each retry
};

/**
 * Connection state tracking
 */
let isConnecting = false;
let connectionAttempts = 0;

/**
 * Calculates exponential backoff delay
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Delays execution for specified milliseconds
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Establishes connection to MongoDB with retry logic
 * @param retryConfig - Optional retry configuration
 * @returns Promise that resolves when connected
 */
export async function connectDatabase(
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('⏳ Database connection already in progress...');
    return;
  }

  isConnecting = true;

  try {
    // Configure Mongoose connection options
    const options: mongoose.ConnectOptions = {
      // Connection pool configuration (Requirements 2.1.3)
      minPoolSize: 10,
      maxPoolSize: 100,

      // Timeout configurations
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds

      // Automatic index creation
      autoIndex: env.NODE_ENV === 'development',

      // Retry writes (already in connection string, but explicit here)
      retryWrites: true,

      // Write concern
      w: 'majority',

      // TLS compatibility for Node.js v24 + OpenSSL 3.5
      tls: true,
      tlsAllowInvalidCertificates: env.NODE_ENV !== 'production',
    };

    console.log('🔌 Connecting to MongoDB...');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Database: ${getDatabaseName(env.DATABASE_URL)}`);

    await mongoose.connect(env.DATABASE_URL, options);

    console.log('✅ MongoDB connected successfully');
    console.log(`   Connection pool: ${options.minPoolSize}-${options.maxPoolSize} connections`);

    connectionAttempts = 0;
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    connectionAttempts++;

    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}/${retryConfig.maxRetries})`);

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }

    // Retry with exponential backoff if attempts remain
    if (connectionAttempts < retryConfig.maxRetries) {
      const backoffDelay = calculateBackoffDelay(connectionAttempts - 1, retryConfig);
      console.log(`   Retrying in ${backoffDelay / 1000} seconds...`);

      await delay(backoffDelay);
      return connectDatabase(retryConfig);
    } else {
      console.error('❌ Maximum connection retry attempts reached');
      console.error('   Please check your DATABASE_URL and network connectivity');
      throw new Error('Failed to connect to MongoDB after maximum retry attempts');
    }
  }
}

/**
 * Gracefully closes database connection
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
}

/**
 * Extracts database name from connection string for logging
 * @param connectionString - MongoDB connection string
 * @returns Database name or 'unknown'
 */
function getDatabaseName(connectionString: string): string {
  try {
    // Extract database name from connection string
    const match = connectionString.match(/\/([^/?]+)(\?|$)/);
    return match && match[1] ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Sets up connection event handlers for monitoring
 */
export function setupConnectionEventHandlers(): void {
  // Connection successful
  mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
  });

  // Connection error
  mongoose.connection.on('error', (error) => {
    console.error('❌ Mongoose connection error:', error.message);
  });

  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from MongoDB');
  });

  // Reconnection attempt
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
  });

  // Connection lost - attempt reconnection
  mongoose.connection.on('close', () => {
    console.warn('⚠️  Mongoose connection closed');
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('✅ Mongoose connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Handle process termination
  process.on('SIGTERM', async () => {
    try {
      await mongoose.connection.close();
      console.log('✅ Mongoose connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
}

/**
 * Gets current connection state
 * @returns Connection state string
 */
export function getConnectionState(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Checks if database is connected
 * @returns True if connected
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Gets connection pool statistics
 * @returns Pool statistics object
 */
export function getPoolStats(): {
  state: string;
  host?: string;
  name?: string;
} {
  return {
    state: getConnectionState(),
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}
