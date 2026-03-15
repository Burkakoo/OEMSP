/**
 * Redis Configuration Module
 * Establishes Redis connection using ioredis with automatic retry logic
 * and exponential backoff for transient failures
 */

import Redis, { RedisOptions } from 'ioredis';
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
 * Redis client instance
 */
let redisClient: Redis | null = null;

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
 * Creates Redis client with retry strategy
 * @param retryConfig - Retry configuration
 * @returns Redis client instance
 */
function createRedisClient(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): Redis {
  const options: RedisOptions = {
    // Retry strategy with exponential backoff
    retryStrategy: (times: number) => {
      if (times > retryConfig.maxRetries) {
        console.error(`❌ Redis connection failed after ${retryConfig.maxRetries} attempts`);
        return null; // Stop retrying
      }

      const delay = calculateBackoffDelay(times - 1, retryConfig);
      console.log(`🔄 Redis retry attempt ${times}/${retryConfig.maxRetries} in ${delay / 1000}s...`);
      return delay;
    },

    // Connection timeouts
    connectTimeout: 10000, // 10 seconds
    commandTimeout: 5000, // 5 seconds

    // Reconnection settings
    enableReadyCheck: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,

    // Lazy connect - don't connect immediately
    lazyConnect: true,

    // Keep alive
    keepAlive: 30000, // 30 seconds

    // Show friendly error stack
    showFriendlyErrorStack: env.NODE_ENV === 'development',
  };

  // Create Redis client from URL
  const client = new Redis(env.REDIS_URL, options);

  return client;
}

/**
 * Establishes connection to Redis with retry logic
 * @param retryConfig - Optional retry configuration
 * @returns Promise that resolves when connected
 */
export async function connectRedis(
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('⏳ Redis connection already in progress...');
    return;
  }

  // Return if already connected
  if (redisClient && redisClient.status === 'ready') {
    console.log('✅ Redis already connected');
    return;
  }

  isConnecting = true;

  try {
    console.log('🔌 Connecting to Redis...');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   URL: ${maskRedisUrl(env.REDIS_URL)}`);

    // Create client if not exists
    if (!redisClient) {
      redisClient = createRedisClient(retryConfig);
      setupConnectionEventHandlers();
    }

    // Attempt connection
    await redisClient.connect();

    console.log('✅ Redis connected successfully');
    console.log(`   Status: ${redisClient.status}`);

    connectionAttempts = 0;
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    connectionAttempts++;

    console.error(`❌ Redis connection failed (attempt ${connectionAttempts}/${retryConfig.maxRetries})`);

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }

    // Manual retry with exponential backoff if attempts remain
    if (connectionAttempts < retryConfig.maxRetries) {
      const backoffDelay = calculateBackoffDelay(connectionAttempts - 1, retryConfig);
      console.log(`   Retrying in ${backoffDelay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return connectRedis(retryConfig);
    } else {
      console.error('❌ Maximum connection retry attempts reached');
      console.error('   Please check your REDIS_URL and network connectivity');
      throw new Error('Failed to connect to Redis after maximum retry attempts');
    }
  }
}

/**
 * Gracefully closes Redis connection
 */
export async function disconnectRedis(): Promise<void> {
  if (!redisClient) {
    console.log('ℹ️  Redis client not initialized');
    return;
  }

  try {
    await redisClient.quit();
    console.log('✅ Redis connection closed gracefully');
    redisClient = null;
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
    // Force disconnect if graceful quit fails
    if (redisClient) {
      redisClient.disconnect();
    }
    redisClient = null;
    throw error;
  }
}

/**
 * Sets up connection event handlers for monitoring
 */
function setupConnectionEventHandlers(): void {
  // This function is only called after redisClient is created
  // The null check is for type safety
  if (!redisClient) return;

  const client = redisClient; // Capture in local variable for type narrowing

  // Connection successful
  client.on('connect', () => {
    console.log('📡 Redis client connecting...');
  });

  // Connection ready
  client.on('ready', () => {
    console.log('📡 Redis client ready');
  });

  // Connection error
  client.on('error', (error) => {
    console.error('❌ Redis connection error:', error.message);
  });

  // Connection closed
  client.on('close', () => {
    console.warn('⚠️  Redis connection closed');
  });

  // Reconnecting
  client.on('reconnecting', (delay: number) => {
    console.log(`🔄 Redis reconnecting in ${delay}ms...`);
  });

  // Connection ended
  client.on('end', () => {
    console.warn('⚠️  Redis connection ended');
  });
}

/**
 * Sets up graceful shutdown handlers
 */
export function setupGracefulShutdown(): void {
  // Handle application termination
  process.on('SIGINT', async () => {
    try {
      await disconnectRedis();
      console.log('✅ Redis connection closed through app termination (SIGINT)');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Handle process termination
  process.on('SIGTERM', async () => {
    try {
      await disconnectRedis();
      console.log('✅ Redis connection closed through app termination (SIGTERM)');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
}

/**
 * Gets Redis client instance
 * @returns Redis client instance
 * @throws Error if client is not initialized
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }

  if (redisClient.status !== 'ready') {
    throw new Error(`Redis client not ready. Current status: ${redisClient.status}`);
  }

  return redisClient;
}

/**
 * Gets current connection state
 * @returns Connection state string
 */
export function getConnectionState(): string {
  if (!redisClient) {
    return 'not_initialized';
  }

  return redisClient.status;
}

/**
 * Checks if Redis is connected and ready
 * @returns True if connected and ready
 */
export function isConnected(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * Masks sensitive information in Redis URL for logging
 * @param url - Redis connection URL
 * @returns Masked URL
 */
function maskRedisUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString();
  } catch {
    return 'redis://****@****:****';
  }
}

/**
 * Utility function to ping Redis
 * @returns Promise that resolves to 'PONG' if successful
 */
export async function ping(): Promise<string> {
  const client = getRedisClient();
  return await client.ping();
}

/**
 * Utility function to get a value from Redis
 * @param key - Redis key
 * @returns Promise that resolves to the value or null
 */
export async function get(key: string): Promise<string | null> {
  const client = getRedisClient();
  return await client.get(key);
}

/**
 * Utility function to set a value in Redis
 * @param key - Redis key
 * @param value - Value to set
 * @param ttlSeconds - Optional TTL in seconds
 * @returns Promise that resolves to 'OK' if successful
 */
export async function set(key: string, value: string, ttlSeconds?: number): Promise<string> {
  const client = getRedisClient();

  if (ttlSeconds) {
    return await client.setex(key, ttlSeconds, value);
  }

  return await client.set(key, value);
}

/**
 * Utility function to delete a key from Redis
 * @param keys - Redis key(s) to delete
 * @returns Promise that resolves to the number of keys deleted
 */
export async function del(...keys: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.del(...keys);
}

/**
 * Utility function to check if a key exists
 * @param key - Redis key
 * @returns Promise that resolves to 1 if exists, 0 otherwise
 */
export async function exists(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.exists(key);
}

/**
 * Utility function to set expiration on a key
 * @param key - Redis key
 * @param seconds - TTL in seconds
 * @returns Promise that resolves to 1 if successful, 0 if key doesn't exist
 */
export async function expire(key: string, seconds: number): Promise<number> {
  const client = getRedisClient();
  return await client.expire(key, seconds);
}

/**
 * Utility function to get TTL of a key
 * @param key - Redis key
 * @returns Promise that resolves to TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
export async function ttl(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.ttl(key);
}

/**
 * Utility function to increment a value
 * @param key - Redis key
 * @returns Promise that resolves to the new value
 */
export async function incr(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.incr(key);
}

/**
 * Utility function to decrement a value
 * @param key - Redis key
 * @returns Promise that resolves to the new value
 */
export async function decr(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.decr(key);
}

/**
 * Utility function to get Redis info
 * @param section - Optional info section (e.g., 'memory', 'stats')
 * @returns Promise that resolves to info string
 */
export async function info(section?: string): Promise<string> {
  const client = getRedisClient();
  if (section) {
    return await client.info(section);
  }
  return await client.info();
}

/**
 * Gets Redis connection statistics
 * @returns Connection statistics object
 */
export function getConnectionStats(): {
  status: string;
  isConnected: boolean;
  host?: string;
  port?: number;
} {
  if (!redisClient) {
    return {
      status: 'not_initialized',
      isConnected: false,
    };
  }

  return {
    status: redisClient.status,
    isConnected: redisClient.status === 'ready',
    host: redisClient.options.host,
    port: redisClient.options.port,
  };
}
