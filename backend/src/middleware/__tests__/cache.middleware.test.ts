/**
 * Cache Middleware Test Suite
 * Tests for cache.middleware.ts functions
 */
import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
  noCacheMiddleware,
  cacheStatsMiddleware
} from '../cache.middleware';
import { connectRedis, disconnectRedis } from '../../config/redis.config';
import { flushCache, setCache, getCache } from '../../utils/cache.utils';

describe('Cache Middleware', () => {
  let app: express.Application;

  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await flushCache();

    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
  });

  describe('cacheMiddleware', () => {
    it('should cache GET request responses', async () => {
      let callCount = 0;

      app.get(
        '/test',
        cacheMiddleware({ ttl: 60 }),
        (req: Request, res: Response) => {
          callCount++;
          res.json({ message: 'Hello', count: callCount });
        }
      );

      // First request - cache miss
      const response1 = await request(app).get('/test');
      expect(response1.status).toBe(200);
      expect(response1.body.count).toBe(1);
      expect(response1.headers['x-cache']).toBe('MISS');

      // Second request - cache hit
      const response2 = await request(app).get('/test');
      expect(response2.status).toBe(200);
      expect(response2.body.count).toBe(1); // Should be same as first
      expect(response2.headers['x-cache']).toBe('HIT');

      // Handler should only be called once
      expect(callCount).toBe(1);
    });

    it('should not cache POST requests', async () => {
      let callCount = 0;

      app.post(
        '/test',
        cacheMiddleware({ ttl: 60 }),
        (req: Request, res: Response) => {
          callCount++;
          res.json({ message: 'Created', count: callCount });
        }
      );

      // First request
      const response1 = await request(app).post('/test');
      expect(response1.status).toBe(200);
      expect(response1.body.count).toBe(1);

      // Second request
      const response2 = await request(app).post('/test');
      expect(response2.status).toBe(200);
      expect(response2.body.count).toBe(2);

      // Handler should be called twice
      expect(callCount).toBe(2);
    });

    it('should include query parameters in cache key', async () => {
      let callCount = 0;

      app.get(
        '/test',
        cacheMiddleware({ ttl: 60, includeQuery: true }),
        (req: Request, res: Response) => {
          callCount++;
          res.json({ query: req.query, count: callCount });
        }
      );

      // Request with query param 1
      const response1 = await request(app).get('/test?page=1');
      expect(response1.body.count).toBe(1);

      // Same query - should hit cache
      const response2 = await request(app).get('/test?page=1');
      expect(response2.body.count).toBe(1);
      expect(response2.headers['x-cache']).toBe('HIT');

      // Different query - should miss cache
      const response3 = await request(app).get('/test?page=2');
      expect(response3.body.count).toBe(2);
      expect(response3.headers['x-cache']).toBe('MISS');

      expect(callCount).toBe(2);
    });

    it('should use custom key generator', async () => {
      let callCount = 0;

      app.get(
        '/users/:id',
        cacheMiddleware({
          ttl: 60,
          keyGenerator: (req) => `user:${req.params.id}`
        }),
        (req: Request, res: Response) => {
          callCount++;
          res.json({ id: req.params.id, count: callCount });
        }
      );

      // First request
      const response1 = await request(app).get('/users/123');
      expect(response1.body.count).toBe(1);
      expect(response1.headers['x-cache']).toBe('MISS');

      // Second request - should hit cache
      const response2 = await request(app).get('/users/123');
      expect(response2.body.count).toBe(1);
      expect(response2.headers['x-cache']).toBe('HIT');

      expect(callCount).toBe(1);
    });

    it('should respect condition option', async () => {
      let callCount = 0;

      app.get(
        '/test',
        cacheMiddleware({
          ttl: 60,
          condition: (req) => req.query.cache === 'true'
        }),
        (req: Request, res: Response) => {
          callCount++;
          res.json({ count: callCount });
        }
      );

      // Request without cache flag
      const response1 = await request(app).get('/test');
      expect(response1.body.count).toBe(1);

      const response2 = await request(app).get('/test');
      expect(response2.body.count).toBe(2);

      // Request with cache flag
      const response3 = await request(app).get('/test?cache=true');
      expect(response3.body.count).toBe(3);
      expect(response3.headers['x-cache']).toBe('MISS');

      const response4 = await request(app).get('/test?cache=true');
      expect(response4.body.count).toBe(3); // Should be cached
      expect(response4.headers['x-cache']).toBe('HIT');

      expect(callCount).toBe(3);
    });

    it('should only cache successful responses', async () => {
      let callCount = 0;

      app.get(
        '/test',
        cacheMiddleware({ ttl: 60 }),
        (req: Request, res: Response) => {
          callCount++;
          if (callCount === 1) {
            res.status(500).json({ error: 'Server error' });
          } else {
            res.json({ message: 'Success', count: callCount });
          }
        }
      );

      // First request - error response
      const response1 = await request(app).get('/test');
      expect(response1.status).toBe(500);

      // Second request - should not use cached error
      const response2 = await request(app).get('/test');
      expect(response2.status).toBe(200);
      expect(response2.body.count).toBe(2);

      expect(callCount).toBe(2);
    });
  });

  describe('invalidateCacheMiddleware', () => {
    it('should invalidate cache on successful write', async () => {
      // Set up cached data
      await setCache('temp:GET:/courses', {
        status: 200,
        headers: {},
        body: { courses: ['old'] }
      });

      app.put(
        '/courses/:id',
        invalidateCacheMiddleware(['temp:GET:/courses*']),
        (req: Request, res: Response) => {
          res.json({ message: 'Updated' });
        }
      );

      // Update request
      await request(app).put('/courses/123');

      // Give it a moment to invalidate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check cache was invalidated
      const cached = await getCache('temp:GET:/courses');
      expect(cached).toBeNull();
    });

    it('should not invalidate cache on error response', async () => {
      // Set up cached data
      await setCache('temp:test-key', { data: 'test' });

      app.put(
        '/test',
        invalidateCacheMiddleware(['temp:test-key']),
        (req: Request, res: Response) => {
          res.status(400).json({ error: 'Bad request' });
        }
      );

      // Request that returns error
      await request(app).put('/test');

      // Give it a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cache should still exist
      const cached = await getCache('temp:test-key');
      expect(cached).toEqual({ data: 'test' });
    });
  });

  describe('noCacheMiddleware', () => {
    it('should set no-cache headers', async () => {
      app.get(
        '/test',
        noCacheMiddleware(),
        (req: Request, res: Response) => {
          res.json({ message: 'No cache' });
        }
      );

      const response = await request(app).get('/test');
      
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.headers['cache-control']).toContain('no-cache');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });
  });

  describe('cacheStatsMiddleware', () => {
    it('should add cache statistics headers', async () => {
      app.get(
        '/test',
        cacheStatsMiddleware(),
        (req: Request, res: Response) => {
          res.json({ message: 'Stats' });
        }
      );

      const response = await request(app).get('/test');
      
      expect(response.headers).toHaveProperty('x-cache-hits');
      expect(response.headers).toHaveProperty('x-cache-misses');
      expect(response.headers).toHaveProperty('x-cache-hit-rate');
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple middleware together', async () => {
      let callCount = 0;

      app.get(
        '/test',
        cacheStatsMiddleware(),
        cacheMiddleware({ ttl: 60 }),
        (req: Request, res: Response) => {
          callCount++;
          res.json({ count: callCount });
        }
      );

      // First request
      const response1 = await request(app).get('/test');
      expect(response1.body.count).toBe(1);
      expect(response1.headers['x-cache']).toBe('MISS');
      expect(response1.headers).toHaveProperty('x-cache-hits');

      // Second request
      const response2 = await request(app).get('/test');
      expect(response2.body.count).toBe(1);
      expect(response2.headers['x-cache']).toBe('HIT');

      expect(callCount).toBe(1);
    });

    it('should handle cache expiration', async () => {
      let callCount = 0;

      app.get(
        '/test',
        cacheMiddleware({ ttl: 1 }), // 1 second TTL
        (req: Request, res: Response) => {
          callCount++;
          res.json({ count: callCount });
        }
      );

      // First request
      const response1 = await request(app).get('/test');
      expect(response1.body.count).toBe(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second request after expiration
      const response2 = await request(app).get('/test');
      expect(response2.body.count).toBe(2);
      expect(response2.headers['x-cache']).toBe('MISS');

      expect(callCount).toBe(2);
    });
  });
});
