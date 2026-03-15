# Cache Utilities Documentation

## Overview

The cache utilities module (`cache.utils.ts`) provides high-level caching abstractions built on top of the Redis configuration. It implements common caching patterns, TTL management, cache invalidation strategies, and monitoring capabilities.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Cache Patterns](#cache-patterns)
- [Cache Invalidation](#cache-invalidation)
- [Cache Warming](#cache-warming)
- [Monitoring](#monitoring)
- [Express Middleware](#express-middleware)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Features

✅ **Cache-Aside Pattern** - Automatic cache-aside implementation with fallback  
✅ **TTL Management** - Sensible default TTLs for different data types  
✅ **JSON Serialization** - Automatic JSON serialization/deserialization  
✅ **Cache Invalidation** - Single key, pattern-based, and tag-based invalidation  
✅ **Cache Warming** - Pre-load cache with frequently accessed data  
✅ **Cache Namespacing** - Organize cache keys by data type  
✅ **Statistics Tracking** - Monitor cache hit rates and performance  
✅ **Express Middleware** - Route-level caching with automatic key generation  
✅ **Multi-Operations** - Batch get/set operations for efficiency  
✅ **Counter Operations** - Atomic increment/decrement operations

## Installation

The cache utilities are already included in the project. Simply import the functions you need:

```typescript
import {
  setCache,
  getCache,
  cacheAside,
  invalidateByPattern,
  DEFAULT_TTL,
  CACHE_NAMESPACE
} from './utils/cache.utils';
```

## Basic Usage

### Setting and Getting Values

```typescript
import { setCache, getCache } from './utils/cache.utils';

// Set a value with automatic JSON serialization
await setCache('user:123', { name: 'John', email: 'john@example.com' }, 3600);

// Get a value with automatic deserialization
const user = await getCache<User>('user:123');
console.log(user); // { name: 'John', email: 'john@example.com' }
```

### Using Namespaces

```typescript
import { generateCacheKey, CACHE_NAMESPACE } from './utils/cache.utils';

// Generate namespaced keys
const userKey = generateCacheKey(CACHE_NAMESPACE.USER, '123');
// Result: 'user:123'

const courseKey = generateCacheKey(CACHE_NAMESPACE.COURSE, '456', 'details');
// Result: 'course:456:details'
```

### Default TTL Values

```typescript
import { DEFAULT_TTL } from './utils/cache.utils';

// Use predefined TTL constants
await setCache('trending:courses', courses, DEFAULT_TTL.SHORT);      // 5 minutes
await setCache('user:profile', profile, DEFAULT_TTL.MEDIUM);         // 10 minutes
await setCache('course:details', course, DEFAULT_TTL.LONG);          // 1 hour
await setCache('categories', categories, DEFAULT_TTL.VERY_LONG);     // 24 hours
```

## Cache Patterns

### Cache-Aside Pattern

The cache-aside pattern automatically checks the cache first, and fetches from the source if not found:

```typescript
import { cacheAside, CACHE_NAMESPACE, DEFAULT_TTL } from './utils/cache.utils';

async function getCourse(courseId: string) {
  return await cacheAside(
    courseId,
    async () => {
      // This function only runs on cache miss
      const course = await Course.findById(courseId);
      return course;
    },
    {
      namespace: CACHE_NAMESPACE.COURSE,
      ttl: DEFAULT_TTL.LONG,
      tags: ['courses', 'public']
    }
  );
}
```

### Cache-Aside with Metadata

Get additional information about cache hits/misses:

```typescript
import { cacheAsideWithMetadata } from './utils/cache.utils';

const result = await cacheAsideWithMetadata(
  'course:123',
  async () => await Course.findById('123')
);

console.log(result.data);    // The course data
console.log(result.cached);  // true if from cache, false if fetched
console.log(result.key);     // The cache key used
```

### Multi-Get and Multi-Set

Efficiently fetch or store multiple values:

```typescript
import { multiGet, multiSet } from './utils/cache.utils';

// Get multiple values at once
const keys = ['user:1', 'user:2', 'user:3'];
const users = await multiGet<User>(keys);

// Set multiple values at once
const entries = [
  { key: 'user:1', value: { name: 'Alice' } },
  { key: 'user:2', value: { name: 'Bob' } },
  { key: 'user:3', value: { name: 'Charlie' } }
];
await multiSet(entries, 3600);
```

## Cache Invalidation

### Single Key Deletion

```typescript
import { deleteCache } from './utils/cache.utils';

// Delete one key
await deleteCache('user:123');

// Delete multiple keys
await deleteCache('user:123', 'user:456', 'user:789');
```

### Pattern-Based Invalidation

Invalidate all keys matching a pattern:

```typescript
import { invalidateByPattern } from './utils/cache.utils';

// Invalidate all user cache entries
await invalidateByPattern('user:*');

// Invalidate all course details
await invalidateByPattern('course:*:details');

// Invalidate specific pattern
await invalidateByPattern('session:user:123:*');
```

**⚠️ Warning**: Pattern-based invalidation uses SCAN which is safe but can be slow on large datasets.

### Tag-Based Invalidation

Tag cache entries for grouped invalidation:

```typescript
import { addCacheTags, invalidateByTags } from './utils/cache.utils';

// Add tags when caching
await setCache('course:123', courseData, 3600);
await addCacheTags('course:123', ['courses', 'instructor:456', 'category:programming']);

await setCache('course:124', courseData2, 3600);
await addCacheTags('course:124', ['courses', 'instructor:456', 'category:design']);

// Invalidate all courses by a specific instructor
await invalidateByTags('instructor:456');

// Invalidate multiple tags
await invalidateByTags('courses', 'category:programming');
```

### Automatic Invalidation on Updates

```typescript
async function updateCourse(courseId: string, updateData: any) {
  // Update in database
  const course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });
  
  // Invalidate related cache entries
  await invalidateByPattern(`course:${courseId}*`);
  await invalidateByTags('courses', `instructor:${course.instructorId}`);
  
  return course;
}
```

## Cache Warming

### Warm Cache with Entries

Pre-load cache with frequently accessed data:

```typescript
import { warmCache } from './utils/cache.utils';

async function warmPopularCourses() {
  const popularCourses = await Course.find({ popular: true });
  
  const entries = popularCourses.map(course => ({
    key: `course:${course._id}`,
    value: course,
    ttl: 3600
  }));
  
  const count = await warmCache(entries);
  console.log(`Warmed ${count} courses`);
}
```

### Warm Cache from Source

Automatically fetch and cache data:

```typescript
import { warmCacheFromSource, CACHE_NAMESPACE } from './utils/cache.utils';

async function warmUserProfiles() {
  const count = await warmCacheFromSource(
    'user',
    async () => await User.find({ active: true }),
    user => user._id.toString(),
    {
      namespace: CACHE_NAMESPACE.USER,
      ttl: DEFAULT_TTL.LONG
    }
  );
  
  console.log(`Warmed ${count} user profiles`);
}
```

### Warm Cache on Startup

```typescript
// server.ts
import { warmCacheFromSource } from './utils/cache.utils';

async function startServer() {
  await connectRedis();
  
  // Warm cache on startup
  console.log('🔥 Warming cache...');
  await warmUserProfiles();
  await warmPopularCourses();
  console.log('✅ Cache warmed');
  
  app.listen(PORT);
}
```

## Monitoring

### Cache Statistics

Track cache performance:

```typescript
import { getCacheStats, resetCacheStats } from './utils/cache.utils';

// Get current statistics
const stats = getCacheStats();
console.log(`Hit Rate: ${stats.hitRate}%`);
console.log(`Hits: ${stats.hits}`);
console.log(`Misses: ${stats.misses}`);
console.log(`Total Requests: ${stats.totalRequests}`);

// Reset statistics
resetCacheStats();
```

### Memory Information

Monitor Redis memory usage:

```typescript
import { getCacheMemoryInfo } from './utils/cache.utils';

const memInfo = await getCacheMemoryInfo();
console.log(`Used Memory: ${memInfo.usedMemoryHuman}`);
console.log(`Peak Memory: ${memInfo.usedMemoryPeakHuman}`);
```

### Key Count

Count cached keys:

```typescript
import { getKeyCount } from './utils/cache.utils';

// Count all keys
const totalKeys = await getKeyCount();

// Count keys matching pattern
const userKeys = await getKeyCount('user:*');
const courseKeys = await getKeyCount('course:*');

console.log(`Total: ${totalKeys}, Users: ${userKeys}, Courses: ${courseKeys}`);
```

### Health Check Endpoint

```typescript
import { getCacheStats, getCacheMemoryInfo, getKeyCount } from './utils/cache.utils';

app.get('/api/cache/health', async (req, res) => {
  const stats = getCacheStats();
  const memory = await getCacheMemoryInfo();
  const keyCount = await getKeyCount();
  
  res.json({
    status: 'healthy',
    statistics: stats,
    memory: memory,
    keyCount: keyCount
  });
});
```

## Express Middleware

### Basic Route Caching

```typescript
import { cacheMiddleware } from './middleware/cache.middleware';

// Cache GET requests for 5 minutes
app.get('/api/courses', cacheMiddleware({ ttl: 300 }), async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});
```

### Custom Cache Key

```typescript
import { cacheMiddleware } from './middleware/cache.middleware';

// Cache with custom key generator
app.get('/api/users/:id', 
  cacheMiddleware({
    ttl: 600,
    keyGenerator: (req) => `user:${req.params.id}`
  }),
  async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
  }
);
```

### Conditional Caching

```typescript
import { cacheMiddleware } from './middleware/cache.middleware';

// Only cache for authenticated users
app.get('/api/dashboard',
  cacheMiddleware({
    condition: (req) => !!req.user
  }),
  getDashboard
);
```

### Cache Invalidation Middleware

```typescript
import { invalidateCacheMiddleware } from './middleware/cache.middleware';

// Invalidate cache on update
app.put('/api/courses/:id',
  invalidateCacheMiddleware(['course:*', 'courses:all']),
  async (req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body);
    res.json(course);
  }
);
```

### No-Cache Middleware

```typescript
import { noCacheMiddleware } from './middleware/cache.middleware';

// Prevent caching for sensitive routes
app.get('/api/user/profile', noCacheMiddleware(), getUserProfile);
```

### Cache Statistics Middleware

```typescript
import { cacheStatsMiddleware } from './middleware/cache.middleware';

// Add cache statistics to response headers
app.use(cacheStatsMiddleware());
```

## Best Practices

### 1. Use Appropriate TTLs

Choose TTL based on data volatility:

```typescript
// Frequently changing data - short TTL
await setCache('trending:courses', courses, DEFAULT_TTL.SHORT); // 5 min

// Moderately stable data - medium TTL
await setCache('user:profile', profile, DEFAULT_TTL.MEDIUM); // 10 min

// Stable data - long TTL
await setCache('course:details', course, DEFAULT_TTL.LONG); // 1 hour

// Rarely changing data - very long TTL
await setCache('categories', categories, DEFAULT_TTL.VERY_LONG); // 24 hours
```

### 2. Use Namespaces

Organize cache keys with namespaces:

```typescript
// Good - namespaced keys
const userKey = generateCacheKey(CACHE_NAMESPACE.USER, userId);
const courseKey = generateCacheKey(CACHE_NAMESPACE.COURSE, courseId);

// Bad - flat keys
await setCache('123', data);
await setCache('userdata', data);
```

### 3. Handle Cache Failures Gracefully

Always provide fallbacks:

```typescript
async function getCourse(courseId: string) {
  try {
    // Try cache-aside pattern
    return await cacheAside(
      courseId,
      async () => await Course.findById(courseId),
      { namespace: CACHE_NAMESPACE.COURSE }
    );
  } catch (error) {
    console.error('Cache error, falling back to database:', error);
    // Fallback to database on cache failure
    return await Course.findById(courseId);
  }
}
```

### 4. Invalidate on Updates

Always invalidate cache when data changes:

```typescript
async function updateCourse(courseId: string, data: any) {
  // Update database
  const course = await Course.findByIdAndUpdate(courseId, data);
  
  // Invalidate cache
  await deleteCache(generateCacheKey(CACHE_NAMESPACE.COURSE, courseId));
  await invalidateByPattern('courses:list:*');
  
  return course;
}
```

### 5. Use Tags for Complex Invalidation

Tag related cache entries:

```typescript
// When caching
await setCache('course:123', course, 3600);
await addCacheTags('course:123', [
  'courses',
  `instructor:${course.instructorId}`,
  `category:${course.category}`
]);

// When invalidating
await invalidateByTags(`instructor:${instructorId}`); // Invalidate all instructor's courses
```

### 6. Monitor Cache Performance

Regularly check cache statistics:

```typescript
// Add monitoring endpoint
app.get('/api/admin/cache/stats', async (req, res) => {
  const stats = getCacheStats();
  const memory = await getCacheMemoryInfo();
  
  res.json({
    hitRate: stats.hitRate,
    totalRequests: stats.totalRequests,
    memoryUsed: memory.usedMemoryHuman
  });
});
```

### 7. Warm Critical Data

Pre-load frequently accessed data:

```typescript
async function warmCriticalData() {
  await warmPopularCourses();
  await warmActiveUsers();
  await warmCategories();
}

// Call on startup
startServer().then(() => warmCriticalData());
```

## API Reference

### Core Functions

#### `setCache<T>(key: string, value: T, ttl?: number): Promise<string>`
Sets a value in cache with JSON serialization.

#### `getCache<T>(key: string): Promise<T | null>`
Gets a value from cache with JSON deserialization.

#### `deleteCache(...keys: string[]): Promise<number>`
Deletes one or more keys from cache.

#### `existsInCache(key: string): Promise<boolean>`
Checks if a key exists in cache.

### Cache-Aside Pattern

#### `cacheAside<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>`
Implements cache-aside pattern with automatic fallback.

#### `cacheAsideWithMetadata<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<CacheResult<T>>`
Cache-aside pattern with metadata about cache hit/miss.

### Invalidation

#### `invalidateByPattern(pattern: string): Promise<number>`
Invalidates all keys matching a pattern.

#### `addCacheTags(key: string, tags: string[]): Promise<void>`
Adds tags to a cache key for tag-based invalidation.

#### `invalidateByTags(...tags: string[]): Promise<number>`
Invalidates all keys associated with given tags.

### Cache Warming

#### `warmCache<T>(entries: Array<{key: string, value: T, ttl?: number}>): Promise<number>`
Warms cache with pre-loaded entries.

#### `warmCacheFromSource<T>(keyPrefix: string, fetchFn: () => Promise<T[]>, keyExtractor: (item: T) => string, options?: CacheOptions): Promise<number>`
Warms cache by fetching from a data source.

### Monitoring

#### `getCacheStats(): CacheStats`
Gets cache hit/miss statistics.

#### `resetCacheStats(): void`
Resets cache statistics.

#### `getCacheMemoryInfo(): Promise<MemoryInfo>`
Gets Redis memory usage information.

#### `getKeyCount(pattern?: string): Promise<number>`
Counts keys matching a pattern.

### Batch Operations

#### `multiGet<T>(keys: string[]): Promise<(T | null)[]>`
Gets multiple values from cache.

#### `multiSet<T>(entries: Array<{key: string, value: T}>, ttl?: number): Promise<number>`
Sets multiple values in cache.

### Counter Operations

#### `incrementCounter(key: string, amount?: number): Promise<number>`
Increments a counter in cache.

#### `decrementCounter(key: string, amount?: number): Promise<number>`
Decrements a counter in cache.

#### `getCounter(key: string): Promise<number>`
Gets a counter value.

### Utilities

#### `generateCacheKey(namespace: string, identifier: string, suffix?: string): string`
Generates a namespaced cache key.

#### `setExpiration(key: string, ttl: number): Promise<boolean>`
Sets expiration on an existing key.

#### `getTTL(key: string): Promise<number>`
Gets remaining TTL for a key.

#### `flushCache(): Promise<string>`
Flushes all cache data (USE WITH CAUTION!).

## Constants

### DEFAULT_TTL

```typescript
{
  SHORT: 300,      // 5 minutes
  MEDIUM: 600,     // 10 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
}
```

### CACHE_NAMESPACE

```typescript
{
  USER: 'user',
  COURSE: 'course',
  QUIZ: 'quiz',
  ENROLLMENT: 'enrollment',
  SESSION: 'session',
  RATE_LIMIT: 'ratelimit',
  BLACKLIST: 'blacklist',
  ANALYTICS: 'analytics',
  TEMP: 'temp'
}
```

## Related Documentation

- [REDIS_CONFIG.md](../config/REDIS_CONFIG.md) - Redis configuration
- [REDIS_INTEGRATION_EXAMPLE.md](../config/REDIS_INTEGRATION_EXAMPLE.md) - Integration examples
- [cache.middleware.ts](../middleware/cache.middleware.ts) - Express middleware

---

**Last Updated**: 2024  
**Version**: 1.0.0
