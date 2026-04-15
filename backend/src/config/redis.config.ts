/**
 * Redis Configuration Module
 * Uses Redis when REDIS_URL is provided, otherwise falls back to an in-memory store.
 */

import { EventEmitter } from 'events';
import Redis, { RedisOptions } from 'ioredis';
import { env } from './env.config';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export interface RedisPipelineLike {
  set(key: string, value: string): RedisPipelineLike;
  setex(key: string, ttlSeconds: number, value: string): RedisPipelineLike;
  sadd(key: string, member: string): RedisPipelineLike;
  exec(): Promise<Array<[Error | null, unknown]> | null>;
}

export interface RedisLikeClient {
  status: string;
  options?: {
    host?: string;
    port?: number;
  };
  on(event: string, listener: (...args: any[]) => void): this;
  connect(): Promise<void>;
  quit(): Promise<string>;
  disconnect(): void;
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string>;
  setex(key: string, ttlSeconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  decrby(key: string, amount: number): Promise<number>;
  info(...args: any[]): Promise<string>;
  keys(pattern: string): Promise<string[]>;
  scan(
    cursor: string,
    ...args: Array<string | number>
  ): Promise<[string, string[]]>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  mget(...keys: string[]): Promise<Array<string | null>>;
  flushdb(): Promise<string>;
  pipeline(): RedisPipelineLike;
}

type MemoryEntry = {
  value: string;
  expiresAt: number | null;
};

class MemoryRedisPipeline implements RedisPipelineLike {
  private operations: Array<() => Promise<unknown>> = [];

  constructor(private readonly client: MemoryRedisClient) {}

  set(key: string, value: string): RedisPipelineLike {
    this.operations.push(() => this.client.set(key, value));
    return this;
  }

  setex(key: string, ttlSeconds: number, value: string): RedisPipelineLike {
    this.operations.push(() => this.client.setex(key, ttlSeconds, value));
    return this;
  }

  sadd(key: string, member: string): RedisPipelineLike {
    this.operations.push(() => this.client.sadd(key, member));
    return this;
  }

  async exec(): Promise<Array<[Error | null, unknown]> | null> {
    const results: Array<[Error | null, unknown]> = [];

    for (const operation of this.operations) {
      try {
        const result = await operation();
        results.push([null, result]);
      } catch (error) {
        results.push([error as Error, null]);
      }
    }

    return results;
  }
}

class MemoryRedisClient extends EventEmitter implements RedisLikeClient {
  status = 'wait';
  options = { host: 'memory', port: 0 };
  private readonly store = new Map<string, MemoryEntry>();
  private readonly sets = new Map<string, Set<string>>();

  async connect(): Promise<void> {
    if (this.status === 'ready') {
      return;
    }

    this.status = 'connecting';
    this.emit('connect');
    this.status = 'ready';
    this.emit('ready');
  }

  async quit(): Promise<string> {
    this.status = 'end';
    this.emit('end');
    return 'OK';
  }

  disconnect(): void {
    this.status = 'end';
    this.emit('close');
    this.emit('end');
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async get(key: string): Promise<string | null> {
    this.purgeExpiredKey(key);
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, { value, expiresAt: null });
    return 'OK';
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<string> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;

    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
      if (this.sets.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  async exists(key: string): Promise<number> {
    this.purgeExpiredKey(key);
    return this.store.has(key) || this.sets.has(key) ? 1 : 0;
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    this.purgeExpiredKey(key);
    const existing = this.store.get(key);
    if (!existing) {
      return 0;
    }

    existing.expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, existing);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    this.purgeExpiredKey(key);
    const existing = this.store.get(key);
    if (!existing) {
      return -2;
    }
    if (existing.expiresAt === null) {
      return -1;
    }

    return Math.max(0, Math.ceil((existing.expiresAt - Date.now()) / 1000));
  }

  async incr(key: string): Promise<number> {
    return this.incrby(key, 1);
  }

  async decr(key: string): Promise<number> {
    return this.decrby(key, 1);
  }

  async incrby(key: string, amount: number): Promise<number> {
    const current = parseInt((await this.get(key)) || '0', 10) || 0;
    const next = current + amount;
    const ttl = await this.ttl(key);

    if (ttl > 0) {
      await this.setex(key, ttl, String(next));
    } else {
      await this.set(key, String(next));
    }

    return next;
  }

  async decrby(key: string, amount: number): Promise<number> {
    const current = parseInt((await this.get(key)) || '0', 10) || 0;
    const next = current - amount;
    const ttl = await this.ttl(key);

    if (ttl > 0) {
      await this.setex(key, ttl, String(next));
    } else {
      await this.set(key, String(next));
    }

    return next;
  }

  async info(..._args: any[]): Promise<string> {
    this.purgeExpiredEntries();
    const usedMemory = Array.from(this.store.values()).reduce(
      (total, entry) => total + entry.value.length,
      0
    );

    return [
      `used_memory:${usedMemory}`,
      `used_memory_human:${usedMemory}B`,
      `used_memory_peak:${usedMemory}`,
      `used_memory_peak_human:${usedMemory}B`,
      '',
    ].join('\r\n');
  }

  async keys(pattern: string): Promise<string[]> {
    this.purgeExpiredEntries();
    const matcher = globToRegex(pattern);
    return Array.from(new Set([...this.store.keys(), ...this.sets.keys()])).filter((key) =>
      matcher.test(key)
    );
  }

  async scan(cursor: string, ...args: Array<string | number>): Promise<[string, string[]]> {
    const patternIndex = args.findIndex((arg) => arg === 'MATCH');
    const pattern =
      patternIndex >= 0 && typeof args[patternIndex + 1] === 'string'
        ? (args[patternIndex + 1] as string)
        : '*';

    if (cursor !== '0') {
      return ['0', []];
    }

    return ['0', await this.keys(pattern)];
  }

  async sadd(key: string, member: string): Promise<number> {
    const members = this.sets.get(key) ?? new Set<string>();
    const sizeBefore = members.size;
    members.add(member);
    this.sets.set(key, members);
    return members.size > sizeBefore ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }

  async mget(...keys: string[]): Promise<Array<string | null>> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  async flushdb(): Promise<string> {
    this.store.clear();
    this.sets.clear();
    return 'OK';
  }

  pipeline(): RedisPipelineLike {
    return new MemoryRedisPipeline(this);
  }

  private purgeExpiredKey(key: string): void {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt === null) {
      return;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
    }
  }

  private purgeExpiredEntries(): void {
    for (const key of this.store.keys()) {
      this.purgeExpiredKey(key);
    }
  }
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

let redisClient: RedisLikeClient | null = null;
let isConnecting = false;
let connectionAttempts = 0;
let usingMemoryFallback = false;

export function isRedisConfigured(): boolean {
  return Boolean(env.REDIS_URL?.trim());
}

function createRedisClient(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): RedisLikeClient {
  const options: RedisOptions = {
    retryStrategy: (times: number) => {
      if (times > retryConfig.maxRetries) {
        console.error(`Redis connection failed after ${retryConfig.maxRetries} attempts`);
        return null;
      }

      const delay = calculateBackoffDelay(times - 1, retryConfig);
      console.log(`Redis retry attempt ${times}/${retryConfig.maxRetries} in ${delay / 1000}s...`);
      return delay;
    },
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    showFriendlyErrorStack: env.NODE_ENV === 'development',
  };

  return new Redis(env.REDIS_URL!, options) as unknown as RedisLikeClient;
}

function createMemoryClient(): RedisLikeClient {
  return new MemoryRedisClient();
}

export async function connectRedis(
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  if (isConnecting) {
    console.log('Redis connection already in progress...');
    return;
  }

  if (redisClient && redisClient.status === 'ready') {
    console.log(usingMemoryFallback ? 'In-memory Redis fallback already ready' : 'Redis already connected');
    return;
  }

  isConnecting = true;

  try {
    if (!isRedisConfigured()) {
      console.warn('REDIS_URL not set. Using in-memory storage fallback.');
      redisClient = createMemoryClient();
      usingMemoryFallback = true;
      await redisClient.connect();
      isConnecting = false;
      return;
    }

    console.log('Connecting to Redis...');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   URL: ${maskRedisUrl(env.REDIS_URL!)}`);

    if (!redisClient || usingMemoryFallback) {
      redisClient = createRedisClient(retryConfig);
      usingMemoryFallback = false;
      setupConnectionEventHandlers();
    }

    await redisClient.connect();

    console.log('Redis connected successfully');
    console.log(`   Status: ${redisClient.status}`);

    connectionAttempts = 0;
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    connectionAttempts++;

    console.error(`Redis connection failed (attempt ${connectionAttempts}/${retryConfig.maxRetries})`);

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }

    if (connectionAttempts < retryConfig.maxRetries) {
      const backoffDelay = calculateBackoffDelay(connectionAttempts - 1, retryConfig);
      console.log(`   Retrying in ${backoffDelay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return connectRedis(retryConfig);
    }

    console.error('Maximum Redis retry attempts reached');
    throw new Error('Failed to connect to Redis after maximum retry attempts');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClient) {
    console.log('Redis client not initialized');
    return;
  }

  const client = redisClient;

  try {
    await client.quit();
    console.log(usingMemoryFallback ? 'In-memory fallback cleared gracefully' : 'Redis connection closed gracefully');
    redisClient = null;
    usingMemoryFallback = false;
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    client.disconnect();
    redisClient = null;
    usingMemoryFallback = false;
    throw error;
  }
}

function setupConnectionEventHandlers(): void {
  if (!redisClient || usingMemoryFallback) return;

  const client = redisClient;

  client.on('connect', () => {
    console.log('Redis client connecting...');
  });

  client.on('ready', () => {
    console.log('Redis client ready');
  });

  client.on('error', (error: Error) => {
    console.error('Redis connection error:', error.message);
  });

  client.on('close', () => {
    console.warn('Redis connection closed');
  });

  client.on('reconnecting', (delay: number) => {
    console.log(`Redis reconnecting in ${delay}ms...`);
  });

  client.on('end', () => {
    console.warn('Redis connection ended');
  });
}

export function setupGracefulShutdown(): void {
  process.on('SIGINT', async () => {
    try {
      await disconnectRedis();
      console.log('Redis connection closed through app termination (SIGINT)');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    try {
      await disconnectRedis();
      console.log('Redis connection closed through app termination (SIGTERM)');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
}

export function getRedisClient(): RedisLikeClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }

  if (redisClient.status !== 'ready') {
    throw new Error(`Redis client not ready. Current status: ${redisClient.status}`);
  }

  return redisClient;
}

export function getOptionalRedisClient(): RedisLikeClient | null {
  if (!redisClient || redisClient.status !== 'ready') {
    return null;
  }

  return redisClient;
}

export function isUsingMemoryRedis(): boolean {
  return usingMemoryFallback;
}

export function getConnectionState(): string {
  if (!redisClient) {
    return 'not_initialized';
  }

  return redisClient.status;
}

export function isConnected(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}

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

export async function ping(): Promise<string> {
  const client = getRedisClient();
  return await client.ping();
}

export async function get(key: string): Promise<string | null> {
  const client = getRedisClient();
  return await client.get(key);
}

export async function set(key: string, value: string, ttlSeconds?: number): Promise<string> {
  const client = getRedisClient();

  if (ttlSeconds) {
    return await client.setex(key, ttlSeconds, value);
  }

  return await client.set(key, value);
}

export async function del(...keys: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.del(...keys);
}

export async function exists(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.exists(key);
}

export async function expire(key: string, seconds: number): Promise<number> {
  const client = getRedisClient();
  return await client.expire(key, seconds);
}

export async function ttl(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.ttl(key);
}

export async function incr(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.incr(key);
}

export async function decr(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.decr(key);
}

export async function info(section?: string): Promise<string> {
  const client = getRedisClient();
  return await client.info(section);
}

export function getConnectionStats(): {
  status: string;
  isConnected: boolean;
  host?: string;
  port?: number;
  mode: 'redis' | 'memory';
} {
  if (!redisClient) {
    return {
      status: 'not_initialized',
      isConnected: false,
      mode: 'memory',
    };
  }

  return {
    status: redisClient.status,
    isConnected: redisClient.status === 'ready',
    host: redisClient.options?.host,
    port: redisClient.options?.port,
    mode: usingMemoryFallback ? 'memory' : 'redis',
  };
}
