/**
 * Cache Middleware for Express Routes
 * Provides route-level caching with automatic cache key generation
 */

import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, generateCacheKey, CACHE_NAMESPACE, DEFAULT_TTL } from '../utils/cache.utils';

/**
 * Cache middleware options
 */
export interface CacheMiddlewareOptions {
  ttl?: number;
  namespace?: string;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  includeQuery?: boolean;
  includeHeaders?: string[];
}

/**
 * Default cache key generator
 * Generates key from method, path, and optionally query params
 */
function defaultKeyGenerator(req: Request, includeQuery: boolean = true): string {
  const base = `${req.method}:${req.path}`;

  if (includeQuery && Object.keys(req.query).length > 0) {
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    return `${base}?${queryString}`;
  }

  return base;
}

/**
 * Cache middleware factory
 * Creates middleware that caches route responses
 * 
 * @param options - Cache middleware options
 * @returns Express middleware function
 * 
 * @example
 * // Cache for 5 minutes
 * app.get('/api/courses', cacheMiddleware({ ttl: 300 }), getCourses);
 * 
 * @example
 * // Cache with custom key generator
 * app.get('/api/user/:id', cacheMiddleware({
 *   ttl: 600,
 *   keyGenerator: (req) => `user:${req.params.id}`
 * }), getUser);
 * 
 * @example
 * // Conditional caching (only for GET requests)
 * app.use(cacheMiddleware({
 *   condition: (req) => req.method === 'GET'
 * }));
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = DEFAULT_TTL.SHORT,
    namespace = CACHE_NAMESPACE.TEMP,
    keyGenerator = defaultKeyGenerator,
    condition,
    includeQuery = true,
    includeHeaders = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check condition if provided
    if (condition && !condition(req)) {
      return next();
    }

    // Only cache GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey = keyGenerator(req, includeQuery);

      // Include specified headers in cache key
      if (includeHeaders.length > 0) {
        const headerValues = includeHeaders
          .map(header => `${header}:${req.get(header) || ''}`)
          .join('|');
        cacheKey = `${cacheKey}|${headerValues}`;
      }

      const fullKey = generateCacheKey(namespace, cacheKey);

      // Try to get from cache
      const cached = await getCache<{
        status: number;
        headers: Record<string, string>;
        body: any;
      }>(fullKey);

      if (cached) {
        // Set cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Add cache hit header
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', fullKey);

        // Send cached response
        return res.status(cached.status).json(cached.body);
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', fullKey);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Extract relevant headers
          const headers: Record<string, string> = {};
          const relevantHeaders = ['content-type', 'etag', 'last-modified'];

          relevantHeaders.forEach(header => {
            const value = res.get(header);
            if (value) {
              headers[header] = value;
            }
          });

          // Cache the response
          setCache(
            fullKey,
            {
              status: res.statusCode,
              headers,
              body
            },
            ttl
          ).catch(error => {
            console.error('Failed to cache response:', error);
          });
        }

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache for specific patterns on write operations
 * 
 * @param patterns - Array of cache key patterns to invalidate
 * @returns Express middleware function
 * 
 * @example
 * // Invalidate course cache on update
 * app.put('/api/courses/:id', 
 *   invalidateCacheMiddleware(['course:*', 'courses:all']),
 *   updateCourse
 * );
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (body: any) {
      // Only invalidate on successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache asynchronously (don't wait)
        Promise.all(
          patterns.map(async pattern => {
            try {
              const { invalidateByPattern } = await import('../utils/cache.utils');
              const count = await invalidateByPattern(pattern);
              console.log(`🗑️  Invalidated ${count} cache entries matching: ${pattern}`);
            } catch (error) {
              console.error(`Failed to invalidate cache pattern ${pattern}:`, error);
            }
          })
        );
      }

      // Call original json method
      return originalJson(body);
    };

    next();
  };
}

/**
 * Cache warming middleware
 * Warms up cache on application startup
 * 
 * @param warmupFn - Function that performs cache warming
 * @returns Express middleware function
 * 
 * @example
 * // Warm up course catalog on startup
 * app.use(cacheWarmingMiddleware(async () => {
 *   const courses = await Course.find();
 *   await warmCache(courses.map(c => ({
 *     key: `course:${c._id}`,
 *     value: c,
 *     ttl: 3600
 *   })));
 * }));
 */
export function cacheWarmingMiddleware(warmupFn: () => Promise<void>) {
  let warmed = false;

  return async (_req: Request, _res: Response, next: NextFunction) => {
    if (!warmed) {
      try {
        console.log('🔥 Warming up cache...');
        await warmupFn();
        console.log('✅ Cache warmed successfully');
        warmed = true;
      } catch (error) {
        console.error('❌ Cache warming failed:', error);
        // Continue anyway - don't block requests
      }
    }

    next();
  };
}

/**
 * No-cache middleware
 * Prevents caching for specific routes
 * 
 * @returns Express middleware function
 * 
 * @example
 * // Prevent caching for sensitive routes
 * app.get('/api/user/profile', noCacheMiddleware(), getUserProfile);
 */
export function noCacheMiddleware() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  };
}

/**
 * Cache statistics middleware
 * Adds cache statistics to response headers
 * 
 * @returns Express middleware function
 * 
 * @example
 * // Add cache stats to all responses
 * app.use(cacheStatsMiddleware());
 */
export function cacheStatsMiddleware() {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { getCacheStats } = await import('../utils/cache.utils');
      const stats = getCacheStats();

      res.setHeader('X-Cache-Hits', stats.hits.toString());
      res.setHeader('X-Cache-Misses', stats.misses.toString());
      res.setHeader('X-Cache-Hit-Rate', `${stats.hitRate}%`);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }

    next();
  };
}
