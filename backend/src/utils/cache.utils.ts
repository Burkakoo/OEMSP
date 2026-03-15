/**
 * Cache Utility Functions
 * Provides higher-level caching abstractions built on top of redis.config.ts
 * 
 * Features:
 * - Cache-aside pattern helpers
 * - TTL management with sensible defaults
 * - Cache invalidation (single key, pattern-based, tag-based)
 * - Cache warming strategies
 * - JSON serialization/deserialization
 * - Cache key generation utilities
 * - Cache namespacing
 * - Cache statistics and monitoring
 */

import { getRedisClient } from '../config/redis.config';

/**
 * Default TTL values (in seconds)
 */
export const DEFAULT_TTL = {
  SHORT: 300,      // 5 minutes - for frequently changing data
  MEDIUM: 600,     // 10 minutes - for moderately stable data
  LONG: 3600,      // 1 hour - for stable data
  VERY_LONG: 86400 // 24 hours - for rarely changing data
} as const;

/**
 * Cache namespace prefixes for different data types
 */
export const CACHE_NAMESPACE = {
  USER: 'user',
  COURSE: 'course',
  QUIZ: 'quiz',
  ENROLLMENT: 'enrollment',
  SESSION: 'session',
  RATE_LIMIT: 'ratelimit',
  BLACKLIST: 'blacklist',
  ANALYTICS: 'analytics',
  TEMP: 'temp'
} as const;

/**
 * Cache statistics interface
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

/**
 * Cache options interface
 */
export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  tags?: string[];
}

/**
 * Cache result interface for cache-aside pattern
 */
export interface CacheResult<T> {
  data: T | null;
  cached: boolean;
  key: string;
}

/**
 * Cache statistics tracker
 */
class CacheStatsTracker {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 10000) / 100, // Percentage with 2 decimals
      totalRequests
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// Global stats tracker
const statsTracker = new CacheStatsTracker();

/**
 * Generates a namespaced cache key
 * @param namespace - Cache namespace
 * @param identifier - Unique identifier
 * @param suffix - Optional suffix
 * @returns Formatted cache key
 */
export function generateCacheKey(
  namespace: string,
  identifier: string,
  suffix?: string
): string {
  const parts = [namespace, identifier];
  if (suffix) {
    parts.push(suffix);
  }
  return parts.join(':');
}

/**
 * Sets a value in cache with JSON serialization
 * @param key - Cache key
 * @param value - Value to cache (will be JSON serialized)
 * @param ttl - Time to live in seconds (optional)
 * @returns Promise that resolves to 'OK' if successful
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<string> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(value);

  if (ttl) {
    return await redis.setex(key, ttl, serialized);
  }

  return await redis.set(key, serialized);
}

/**
 * Gets a value from cache with JSON deserialization
 * @param key - Cache key
 * @returns Promise that resolves to the deserialized value or null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);

  if (!value) {
    statsTracker.recordMiss();
    return null;
  }

  statsTracker.recordHit();

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse cached value for key ${key}:`, error);
    return null;
  }
}

/**
 * Deletes one or more keys from cache
 * @param keys - Cache key(s) to delete
 * @returns Promise that resolves to the number of keys deleted
 */
export async function deleteCache(...keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  
  const redis = getRedisClient();
  return await redis.del(...keys);
}

/**
 * Checks if a key exists in cache
 * @param key - Cache key
 * @returns Promise that resolves to true if exists, false otherwise
 */
export async function existsInCache(key: string): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Sets expiration on an existing cache key
 * @param key - Cache key
 * @param ttl - Time to live in seconds
 * @returns Promise that resolves to true if successful, false if key doesn't exist
 */
export async function setExpiration(key: string, ttl: number): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.expire(key, ttl);
  return result === 1;
}

/**
 * Gets remaining TTL for a cache key
 * @param key - Cache key
 * @returns Promise that resolves to TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
export async function getTTL(key: string): Promise<number> {
  const redis = getRedisClient();
  return await redis.ttl(key);
}

/**
 * Cache-aside pattern: Get from cache or fetch from source
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not in cache
 * @param options - Cache options (ttl, namespace, tags)
 * @returns Promise that resolves to the data
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL.MEDIUM, namespace, tags } = options;
  const cacheKey = namespace ? generateCacheKey(namespace, key) : key;

  // Try to get from cache
  const cached = await getCache<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  const data = await fetchFn();

  // Store in cache
  await setCache(cacheKey, data, ttl);

  // Store tags if provided
  if (tags && tags.length > 0) {
    await addCacheTags(cacheKey, tags);
  }

  return data;
}

/**
 * Cache-aside pattern with result metadata
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not in cache
 * @param options - Cache options
 * @returns Promise that resolves to cache result with metadata
 */
export async function cacheAsideWithMetadata<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<CacheResult<T>> {
  const { ttl = DEFAULT_TTL.MEDIUM, namespace } = options;
  const cacheKey = namespace ? generateCacheKey(namespace, key) : key;

  // Try to get from cache
  const cached = await getCache<T>(cacheKey);
  if (cached !== null) {
    return {
      data: cached,
      cached: true,
      key: cacheKey
    };
  }

  // Fetch from source
  const data = await fetchFn();

  // Store in cache
  await setCache(cacheKey, data, ttl);

  return {
    data,
    cached: false,
    key: cacheKey
  };
}

/**
 * Invalidates cache by pattern (e.g., "user:*")
 * WARNING: Use with caution on large datasets
 * @param pattern - Redis key pattern
 * @returns Promise that resolves to the number of keys deleted
 */
export async function invalidateByPattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  
  // Use SCAN for safe iteration (doesn't block Redis)
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, foundKeys] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100
    );
    cursor = nextCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');

  if (keys.length === 0) {
    return 0;
  }

  return await redis.del(...keys);
}

/**
 * Adds tags to a cache key for tag-based invalidation
 * @param key - Cache key
 * @param tags - Array of tags
 * @returns Promise that resolves when tags are added
 */
export async function addCacheTags(key: string, tags: string[]): Promise<void> {
  const redis = getRedisClient();
  
  // Store key in each tag's set
  const pipeline = redis.pipeline();
  
  for (const tag of tags) {
    const tagKey = generateCacheKey('tag', tag);
    pipeline.sadd(tagKey, key);
  }
  
  await pipeline.exec();
}

/**
 * Invalidates all cache keys associated with given tags
 * @param tags - Array of tags
 * @returns Promise that resolves to the number of keys deleted
 */
export async function invalidateByTags(...tags: string[]): Promise<number> {
  if (tags.length === 0) return 0;

  const redis = getRedisClient();
  const keysToDelete = new Set<string>();

  // Get all keys for each tag
  for (const tag of tags) {
    const tagKey = generateCacheKey('tag', tag);
    const keys = await redis.smembers(tagKey);
    keys.forEach(key => keysToDelete.add(key));
  }

  if (keysToDelete.size === 0) {
    return 0;
  }

  // Delete all keys and tag sets
  const allKeys = [
    ...Array.from(keysToDelete),
    ...tags.map(tag => generateCacheKey('tag', tag))
  ];

  return await redis.del(...allKeys);
}

/**
 * Warms up cache by pre-loading data
 * @param entries - Array of cache entries to warm up
 * @returns Promise that resolves to the number of entries cached
 */
export async function warmCache<T>(
  entries: Array<{ key: string; value: T; ttl?: number }>
): Promise<number> {
  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  for (const entry of entries) {
    const serialized = JSON.stringify(entry.value);
    
    if (entry.ttl) {
      pipeline.setex(entry.key, entry.ttl, serialized);
    } else {
      pipeline.set(entry.key, serialized);
    }
  }

  const results = await pipeline.exec();
  return results?.filter(([err]) => !err).length || 0;
}

/**
 * Warms up cache using a data fetcher function
 * @param keyPrefix - Prefix for cache keys
 * @param fetchFn - Function that returns array of items to cache
 * @param keyExtractor - Function to extract key from item
 * @param options - Cache options
 * @returns Promise that resolves to the number of entries cached
 */
export async function warmCacheFromSource<T>(
  keyPrefix: string,
  fetchFn: () => Promise<T[]>,
  keyExtractor: (item: T) => string,
  options: CacheOptions = {}
): Promise<number> {
  const { ttl = DEFAULT_TTL.LONG, namespace } = options;
  
  const items = await fetchFn();
  
  const entries = items.map(item => ({
    key: namespace 
      ? generateCacheKey(namespace, keyExtractor(item))
      : `${keyPrefix}:${keyExtractor(item)}`,
    value: item,
    ttl
  }));

  return await warmCache(entries);
}

/**
 * Gets cache statistics
 * @returns Cache statistics object
 */
export function getCacheStats(): CacheStats {
  return statsTracker.getStats();
}

/**
 * Resets cache statistics
 */
export function resetCacheStats(): void {
  statsTracker.reset();
}

/**
 * Gets memory usage information from Redis
 * @returns Promise that resolves to memory info object
 */
export async function getCacheMemoryInfo(): Promise<{
  usedMemory: string;
  usedMemoryHuman: string;
  usedMemoryPeak: string;
  usedMemoryPeakHuman: string;
}> {
  const redis = getRedisClient();
  const info = await redis.info('memory');
  
  const lines = info.split('\r\n');
  const memoryInfo: Record<string, string> = {};
  
  for (const line of lines) {
    const [key, value] = line.split(':');
    if (key && value) {
      memoryInfo[key] = value;
    }
  }

  return {
    usedMemory: memoryInfo.used_memory || '0',
    usedMemoryHuman: memoryInfo.used_memory_human || '0B',
    usedMemoryPeak: memoryInfo.used_memory_peak || '0',
    usedMemoryPeakHuman: memoryInfo.used_memory_peak_human || '0B'
  };
}

/**
 * Gets count of keys matching a pattern
 * @param pattern - Redis key pattern (default: "*")
 * @returns Promise that resolves to the count of matching keys
 */
export async function getKeyCount(pattern: string = '*'): Promise<number> {
  const redis = getRedisClient();
  let count = 0;
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100
    );
    cursor = nextCursor;
    count += keys.length;
  } while (cursor !== '0');

  return count;
}

/**
 * Flushes all cache data (USE WITH CAUTION!)
 * @returns Promise that resolves to 'OK' if successful
 */
export async function flushCache(): Promise<string> {
  const redis = getRedisClient();
  console.warn('⚠️  Flushing all cache data...');
  return await redis.flushdb();
}

/**
 * Multi-get: Gets multiple values from cache
 * @param keys - Array of cache keys
 * @returns Promise that resolves to array of values (null for missing keys)
 */
export async function multiGet<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];

  const redis = getRedisClient();
  const values = await redis.mget(...keys);

  return values.map((value, index) => {
    if (!value) {
      statsTracker.recordMiss();
      return null;
    }

    statsTracker.recordHit();

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse cached value for key ${keys[index]}:`, error);
      return null;
    }
  });
}

/**
 * Multi-set: Sets multiple values in cache
 * @param entries - Array of key-value pairs
 * @param ttl - Optional TTL for all entries
 * @returns Promise that resolves to the number of entries set
 */
export async function multiSet<T>(
  entries: Array<{ key: string; value: T }>,
  ttl?: number
): Promise<number> {
  if (entries.length === 0) return 0;

  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  for (const entry of entries) {
    const serialized = JSON.stringify(entry.value);
    
    if (ttl) {
      pipeline.setex(entry.key, ttl, serialized);
    } else {
      pipeline.set(entry.key, serialized);
    }
  }

  const results = await pipeline.exec();
  return results?.filter(([err]) => !err).length || 0;
}

/**
 * Increments a counter in cache
 * @param key - Cache key
 * @param amount - Amount to increment (default: 1)
 * @returns Promise that resolves to the new value
 */
export async function incrementCounter(key: string, amount: number = 1): Promise<number> {
  const redis = getRedisClient();
  return await redis.incrby(key, amount);
}

/**
 * Decrements a counter in cache
 * @param key - Cache key
 * @param amount - Amount to decrement (default: 1)
 * @returns Promise that resolves to the new value
 */
export async function decrementCounter(key: string, amount: number = 1): Promise<number> {
  const redis = getRedisClient();
  return await redis.decrby(key, amount);
}

/**
 * Gets a counter value
 * @param key - Cache key
 * @returns Promise that resolves to the counter value or 0 if not exists
 */
export async function getCounter(key: string): Promise<number> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  return value ? parseInt(value, 10) : 0;
}
