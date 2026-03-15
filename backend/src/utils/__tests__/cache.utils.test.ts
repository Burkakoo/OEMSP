/**
 * Cache Utilities Test Suite
 * Tests for cache.utils.ts functions
 */
import {
  generateCacheKey,
  setCache,
  getCache,
  deleteCache,
  existsInCache,
  setExpiration,
  getTTL,
  cacheAside,
  cacheAsideWithMetadata,
  invalidateByPattern,
  addCacheTags,
  invalidateByTags,
  warmCache,
  warmCacheFromSource,
  getCacheStats,
  resetCacheStats,
  getCacheMemoryInfo,
  getKeyCount,
  flushCache,
  multiGet,
  multiSet,
  incrementCounter,
  decrementCounter,
  getCounter,
  DEFAULT_TTL,
  CACHE_NAMESPACE
} from '../cache.utils';
import { connectRedis, disconnectRedis } from '../../config/redis.config';

describe('Cache Utilities', () => {
  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await flushCache();
    resetCacheStats();
  });

  describe('generateCacheKey', () => {
    it('should generate key with namespace and identifier', () => {
      const key = generateCacheKey('user', '123');
      expect(key).toBe('user:123');
    });

    it('should generate key with namespace, identifier, and suffix', () => {
      const key = generateCacheKey('user', '123', 'profile');
      expect(key).toBe('user:123:profile');
    });

    it('should handle empty suffix', () => {
      const key = generateCacheKey('course', '456', '');
      expect(key).toBe('course:456');
    });
  });

  describe('setCache and getCache', () => {
    it('should set and get a string value', async () => {
      await setCache('test:string', 'hello');
      const value = await getCache<string>('test:string');
      expect(value).toBe('hello');
    });

    it('should set and get an object', async () => {
      const obj = { name: 'John', age: 30 };
      await setCache('test:object', obj);
      const value = await getCache<typeof obj>('test:object');
      expect(value).toEqual(obj);
    });

    it('should set and get an array', async () => {
      const arr = [1, 2, 3, 4, 5];
      await setCache('test:array', arr);
      const value = await getCache<number[]>('test:array');
      expect(value).toEqual(arr);
    });

    it('should return null for non-existent key', async () => {
      const value = await getCache('test:nonexistent');
      expect(value).toBeNull();
    });

    it('should set value with TTL', async () => {
      await setCache('test:ttl', 'value', 2);
      const value = await getCache('test:ttl');
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2100));
      const expired = await getCache('test:ttl');
      expect(expired).toBeNull();
    });
  });

  describe('deleteCache', () => {
    it('should delete a single key', async () => {
      await setCache('test:delete', 'value');
      const deleted = await deleteCache('test:delete');
      expect(deleted).toBe(1);

      const value = await getCache('test:delete');
      expect(value).toBeNull();
    });

    it('should delete multiple keys', async () => {
      await setCache('test:delete1', 'value1');
      await setCache('test:delete2', 'value2');
      await setCache('test:delete3', 'value3');

      const deleted = await deleteCache('test:delete1', 'test:delete2', 'test:delete3');
      expect(deleted).toBe(3);
    });

    it('should return 0 for non-existent keys', async () => {
      const deleted = await deleteCache('test:nonexistent');
      expect(deleted).toBe(0);
    });
  });

  describe('existsInCache', () => {
    it('should return true for existing key', async () => {
      await setCache('test:exists', 'value');
      const exists = await existsInCache('test:exists');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const exists = await existsInCache('test:nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('setExpiration and getTTL', () => {
    it('should set expiration on existing key', async () => {
      await setCache('test:expire', 'value');
      const result = await setExpiration('test:expire', 10);
      expect(result).toBe(true);

      const ttl = await getTTL('test:expire');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);
    });

    it('should return false for non-existent key', async () => {
      const result = await setExpiration('test:nonexistent', 10);
      expect(result).toBe(false);
    });

    it('should return -2 for non-existent key TTL', async () => {
      const ttl = await getTTL('test:nonexistent');
      expect(ttl).toBe(-2);
    });

    it('should return -1 for key without expiration', async () => {
      await setCache('test:noexpire', 'value');
      const ttl = await getTTL('test:noexpire');
      expect(ttl).toBe(-1);
    });
  });

  describe('cacheAside', () => {
    it('should fetch from source on cache miss', async () => {
      let fetchCalled = false;
      const fetchFn = async () => {
        fetchCalled = true;
        return { data: 'test' };
      };

      const result = await cacheAside('test:aside', fetchFn);
      expect(result).toEqual({ data: 'test' });
      expect(fetchCalled).toBe(true);
    });

    it('should return cached value on cache hit', async () => {
      let fetchCount = 0;
      const fetchFn = async () => {
        fetchCount++;
        return { data: 'test' };
      };

      // First call - cache miss
      await cacheAside('test:aside2', fetchFn);
      expect(fetchCount).toBe(1);

      // Second call - cache hit
      const result = await cacheAside('test:aside2', fetchFn);
      expect(result).toEqual({ data: 'test' });
      expect(fetchCount).toBe(1); // Should not increment
    });

    it('should use namespace option', async () => {
      const fetchFn = async () => ({ data: 'test' });
      await cacheAside('123', fetchFn, { namespace: CACHE_NAMESPACE.USER });

      const cached = await getCache(generateCacheKey(CACHE_NAMESPACE.USER, '123'));
      expect(cached).toEqual({ data: 'test' });
    });
  });

  describe('cacheAsideWithMetadata', () => {
    it('should return metadata with cache miss', async () => {
      const fetchFn = async () => ({ data: 'test' });
      const result = await cacheAsideWithMetadata('test:meta', fetchFn);

      expect(result.data).toEqual({ data: 'test' });
      expect(result.cached).toBe(false);
      expect(result.key).toBe('test:meta');
    });

    it('should return metadata with cache hit', async () => {
      const fetchFn = async () => ({ data: 'test' });
      
      // First call
      await cacheAsideWithMetadata('test:meta2', fetchFn);

      // Second call
      const result = await cacheAsideWithMetadata('test:meta2', fetchFn);
      expect(result.data).toEqual({ data: 'test' });
      expect(result.cached).toBe(true);
      expect(result.key).toBe('test:meta2');
    });
  });

  describe('invalidateByPattern', () => {
    it('should invalidate keys matching pattern', async () => {
      await setCache('user:1', 'data1');
      await setCache('user:2', 'data2');
      await setCache('user:3', 'data3');
      await setCache('course:1', 'course1');

      const deleted = await invalidateByPattern('user:*');
      expect(deleted).toBe(3);

      const user1 = await getCache('user:1');
      const course1 = await getCache('course:1');
      expect(user1).toBeNull();
      expect(course1).toBe('course1');
    });

    it('should return 0 for no matching keys', async () => {
      const deleted = await invalidateByPattern('nonexistent:*');
      expect(deleted).toBe(0);
    });
  });

  describe('tag-based invalidation', () => {
    it('should add tags to cache key', async () => {
      await setCache('test:tagged', 'value');
      await addCacheTags('test:tagged', ['tag1', 'tag2']);

      // Verify tags were added (keys should exist in tag sets)
      const exists = await existsInCache('tag:tag1');
      expect(exists).toBe(true);
    });

    it('should invalidate by tags', async () => {
      await setCache('test:tag1', 'value1');
      await setCache('test:tag2', 'value2');
      await setCache('test:tag3', 'value3');

      await addCacheTags('test:tag1', ['user', 'profile']);
      await addCacheTags('test:tag2', ['user']);
      await addCacheTags('test:tag3', ['course']);

      const deleted = await invalidateByTags('user');
      expect(deleted).toBeGreaterThanOrEqual(2); // At least the 2 tagged keys

      const value1 = await getCache('test:tag1');
      const value2 = await getCache('test:tag2');
      const value3 = await getCache('test:tag3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBe('value3'); // Should still exist
    });
  });

  describe('warmCache', () => {
    it('should warm cache with multiple entries', async () => {
      const entries = [
        { key: 'warm:1', value: { id: 1 }, ttl: 60 },
        { key: 'warm:2', value: { id: 2 }, ttl: 60 },
        { key: 'warm:3', value: { id: 3 }, ttl: 60 }
      ];

      const count = await warmCache(entries);
      expect(count).toBe(3);

      const value1 = await getCache('warm:1');
      expect(value1).toEqual({ id: 1 });
    });
  });

  describe('warmCacheFromSource', () => {
    it('should warm cache from data source', async () => {
      const fetchFn = async () => [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' }
      ];

      const count = await warmCacheFromSource(
        'item',
        fetchFn,
        item => item.id,
        { namespace: 'test' }
      );

      expect(count).toBe(3);

      const item1 = await getCache(generateCacheKey('test', '1'));
      expect(item1).toEqual({ id: '1', name: 'Item 1' });
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits and misses', async () => {
      resetCacheStats();

      await setCache('stats:1', 'value');

      // Cache hit
      await getCache('stats:1');

      // Cache miss
      await getCache('stats:nonexistent');

      const stats = getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.hitRate).toBe(50);
    });

    it('should reset statistics', async () => {
      await setCache('stats:2', 'value');
      await getCache('stats:2');

      resetCacheStats();

      const stats = getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('getCacheMemoryInfo', () => {
    it('should return memory information', async () => {
      const memInfo = await getCacheMemoryInfo();
      
      expect(memInfo).toHaveProperty('usedMemory');
      expect(memInfo).toHaveProperty('usedMemoryHuman');
      expect(memInfo).toHaveProperty('usedMemoryPeak');
      expect(memInfo).toHaveProperty('usedMemoryPeakHuman');
    });
  });

  describe('getKeyCount', () => {
    it('should count all keys', async () => {
      await setCache('count:1', 'value1');
      await setCache('count:2', 'value2');
      await setCache('count:3', 'value3');

      const count = await getKeyCount();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should count keys matching pattern', async () => {
      await setCache('count:a:1', 'value1');
      await setCache('count:a:2', 'value2');
      await setCache('count:b:1', 'value3');

      const count = await getKeyCount('count:a:*');
      expect(count).toBe(2);
    });
  });

  describe('multiGet and multiSet', () => {
    it('should get multiple values', async () => {
      await setCache('multi:1', { id: 1 });
      await setCache('multi:2', { id: 2 });
      await setCache('multi:3', { id: 3 });

      const values = await multiGet<{ id: number }>(['multi:1', 'multi:2', 'multi:3']);
      expect(values).toHaveLength(3);
      expect(values[0]).toEqual({ id: 1 });
      expect(values[1]).toEqual({ id: 2 });
      expect(values[2]).toEqual({ id: 3 });
    });

    it('should return null for missing keys in multiGet', async () => {
      await setCache('multi:4', { id: 4 });

      const values = await multiGet(['multi:4', 'multi:nonexistent']);
      expect(values).toHaveLength(2);
      expect(values[0]).toEqual({ id: 4 });
      expect(values[1]).toBeNull();
    });

    it('should set multiple values', async () => {
      const entries = [
        { key: 'multi:5', value: { id: 5 } },
        { key: 'multi:6', value: { id: 6 } },
        { key: 'multi:7', value: { id: 7 } }
      ];

      const count = await multiSet(entries);
      expect(count).toBe(3);

      const value = await getCache('multi:5');
      expect(value).toEqual({ id: 5 });
    });
  });

  describe('counter operations', () => {
    it('should increment counter', async () => {
      const value1 = await incrementCounter('counter:1');
      expect(value1).toBe(1);

      const value2 = await incrementCounter('counter:1');
      expect(value2).toBe(2);

      const value3 = await incrementCounter('counter:1', 5);
      expect(value3).toBe(7);
    });

    it('should decrement counter', async () => {
      await incrementCounter('counter:2', 10);

      const value1 = await decrementCounter('counter:2');
      expect(value1).toBe(9);

      const value2 = await decrementCounter('counter:2', 3);
      expect(value2).toBe(6);
    });

    it('should get counter value', async () => {
      await incrementCounter('counter:3', 42);

      const value = await getCounter('counter:3');
      expect(value).toBe(42);
    });

    it('should return 0 for non-existent counter', async () => {
      const value = await getCounter('counter:nonexistent');
      expect(value).toBe(0);
    });
  });

  describe('DEFAULT_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(DEFAULT_TTL.SHORT).toBe(300);
      expect(DEFAULT_TTL.MEDIUM).toBe(600);
      expect(DEFAULT_TTL.LONG).toBe(3600);
      expect(DEFAULT_TTL.VERY_LONG).toBe(86400);
    });
  });

  describe('CACHE_NAMESPACE constants', () => {
    it('should have correct namespace values', () => {
      expect(CACHE_NAMESPACE.USER).toBe('user');
      expect(CACHE_NAMESPACE.COURSE).toBe('course');
      expect(CACHE_NAMESPACE.QUIZ).toBe('quiz');
      expect(CACHE_NAMESPACE.ENROLLMENT).toBe('enrollment');
      expect(CACHE_NAMESPACE.SESSION).toBe('session');
      expect(CACHE_NAMESPACE.RATE_LIMIT).toBe('ratelimit');
      expect(CACHE_NAMESPACE.BLACKLIST).toBe('blacklist');
      expect(CACHE_NAMESPACE.ANALYTICS).toBe('analytics');
      expect(CACHE_NAMESPACE.TEMP).toBe('temp');
    });
  });
});
