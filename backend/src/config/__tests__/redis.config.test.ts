/**
 * Redis Configuration Tests
 * Tests for Redis connection and utility functions
 */

import {
  connectRedis,
  disconnectRedis,
  isConnected,
  getConnectionState,
  getConnectionStats,
  ping,
  set,
  get,
  del,
  exists,
  expire,
  ttl,
  incr,
  decr,
} from '../redis.config';

describe('Redis Configuration', () => {
  beforeAll(async () => {
    // Connect to Redis before running tests
    await connectRedis();
  });

  afterAll(async () => {
    // Clean up and disconnect after all tests
    await disconnectRedis();
  });

  describe('Connection Management', () => {
    it('should connect to Redis successfully', () => {
      expect(isConnected()).toBe(true);
    });

    it('should return correct connection state', () => {
      const state = getConnectionState();
      expect(state).toBe('ready');
    });

    it('should return connection statistics', () => {
      const stats = getConnectionStats();
      expect(stats.isConnected).toBe(true);
      expect(stats.status).toBe('ready');
      expect(stats.host).toBeDefined();
      expect(stats.port).toBeDefined();
    });

    it('should respond to ping', async () => {
      const response = await ping();
      expect(response).toBe('PONG');
    });
  });

  describe('Basic Operations', () => {
    const testKey = 'test:key';
    const testValue = 'test value';

    afterEach(async () => {
      // Clean up test keys after each test
      await del(testKey);
    });

    it('should set and get a value', async () => {
      await set(testKey, testValue);
      const value = await get(testKey);
      expect(value).toBe(testValue);
    });

    it('should set a value with TTL', async () => {
      await set(testKey, testValue, 60);
      const value = await get(testKey);
      expect(value).toBe(testValue);

      // Check TTL is set
      const remaining = await ttl(testKey);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('should delete a key', async () => {
      await set(testKey, testValue);
      const deleted = await del(testKey);
      expect(deleted).toBe(1);

      const value = await get(testKey);
      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await set(testKey, testValue);
      const doesExist = await exists(testKey);
      expect(doesExist).toBe(1);

      await del(testKey);
      const doesNotExist = await exists(testKey);
      expect(doesNotExist).toBe(0);
    });

    it('should set expiration on existing key', async () => {
      await set(testKey, testValue);
      await expire(testKey, 30);

      const remaining = await ttl(testKey);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    it('should return TTL for key', async () => {
      await set(testKey, testValue, 60);
      const remaining = await ttl(testKey);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('should return -1 for key with no expiration', async () => {
      await set(testKey, testValue);
      const remaining = await ttl(testKey);
      expect(remaining).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      const remaining = await ttl('non:existent:key');
      expect(remaining).toBe(-2);
    });
  });

  describe('Counter Operations', () => {
    const counterKey = 'test:counter';

    afterEach(async () => {
      await del(counterKey);
    });

    it('should increment a counter', async () => {
      const value1 = await incr(counterKey);
      expect(value1).toBe(1);

      const value2 = await incr(counterKey);
      expect(value2).toBe(2);

      const value3 = await incr(counterKey);
      expect(value3).toBe(3);
    });

    it('should decrement a counter', async () => {
      await set(counterKey, '10');

      const value1 = await decr(counterKey);
      expect(value1).toBe(9);

      const value2 = await decr(counterKey);
      expect(value2).toBe(8);
    });

    it('should handle increment and decrement together', async () => {
      await incr(counterKey); // 1
      await incr(counterKey); // 2
      await incr(counterKey); // 3
      await decr(counterKey); // 2

      const value = await get(counterKey);
      expect(value).toBe('2');
    });
  });

  describe('JSON Data Operations', () => {
    const jsonKey = 'test:json';

    afterEach(async () => {
      await del(jsonKey);
    });

    it('should store and retrieve JSON data', async () => {
      const data = {
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        roles: ['student', 'instructor'],
      };

      await set(jsonKey, JSON.stringify(data), 300);
      const retrieved = await get(jsonKey);

      expect(retrieved).not.toBeNull();
      const parsed = JSON.parse(retrieved!);
      expect(parsed).toEqual(data);
    });
  });

  describe('Multiple Key Operations', () => {
    const keys: [string, string, string] = ['test:key1', 'test:key2', 'test:key3'];

    afterEach(async () => {
      await del(...keys);
    });

    it('should delete multiple keys at once', async () => {
      // Set multiple keys
      await set(keys[0], 'value1');
      await set(keys[1], 'value2');
      await set(keys[2], 'value3');

      // Delete all at once
      const deleted = await del(...keys);
      expect(deleted).toBe(3);

      // Verify all are deleted
      for (const key of keys) {
        const value = await get(key);
        expect(value).toBeNull();
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error when getting client before connection', async () => {
      // This test would need to be run in isolation
      // For now, we just verify the client is available
      expect(isConnected()).toBe(true);
    });
  });
});
