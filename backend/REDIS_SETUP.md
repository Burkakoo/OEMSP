# Redis Setup Guide for MERN Education Platform

## Overview

Redis is used in the MERN Education Platform for:
- **Distributed caching**: Course lists, quiz questions, and frequently accessed data
- **Session storage**: Stateless authentication across multiple server instances
- **Token blacklisting**: JWT token invalidation on logout
- **Rate limiting**: Distributed rate limit counters across server instances

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Cloud Options](#cloud-options)
3. [Configuration](#configuration)
4. [Verification](#verification)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Option 1: Docker (Recommended)

**Prerequisites**: Docker installed on your system

1. **Pull Redis image**:
   ```bash
   docker pull redis:7-alpine
   ```

2. **Run Redis container**:
   ```bash
   docker run -d \
     --name mern-edu-redis \
     -p 6379:6379 \
     redis:7-alpine
   ```

3. **Verify Redis is running**:
   ```bash
   docker ps | grep redis
   ```

4. **Test connection**:
   ```bash
   docker exec -it mern-edu-redis redis-cli ping
   # Should return: PONG
   ```

5. **Update `.env` file**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

**Useful Docker commands**:
```bash
# Stop Redis
docker stop mern-edu-redis

# Start Redis
docker start mern-edu-redis

# View logs
docker logs mern-edu-redis

# Remove container
docker rm -f mern-edu-redis
```

### Option 2: Native Installation

#### Windows

1. **Download Redis for Windows**:
   - Visit: https://github.com/microsoftarchive/redis/releases
   - Download latest `.msi` installer
   - Run installer and follow prompts

2. **Start Redis**:
   ```powershell
   redis-server
   ```

3. **Test connection**:
   ```powershell
   redis-cli ping
   # Should return: PONG
   ```

#### macOS

1. **Install via Homebrew**:
   ```bash
   brew install redis
   ```

2. **Start Redis**:
   ```bash
   # Start as background service
   brew services start redis
   
   # Or run in foreground
   redis-server
   ```

3. **Test connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

#### Linux (Ubuntu/Debian)

1. **Install Redis**:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

2. **Start Redis**:
   ```bash
   sudo systemctl start redis-server
   sudo systemctl enable redis-server  # Auto-start on boot
   ```

3. **Test connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

---

## Cloud Options

### Option 1: Redis Cloud (Recommended for Production)

**Free Tier**: 30MB storage, suitable for development/testing

1. **Create account**:
   - Visit: https://redis.com/try-free/
   - Sign up for free account

2. **Create database**:
   - Click "New Database"
   - Select "Fixed" plan (free tier)
   - Choose cloud provider and region (closest to your backend)
   - Click "Activate"

3. **Get connection details**:
   - Navigate to database details
   - Copy "Public endpoint" (format: `redis-xxxxx.redislabs.com:xxxxx`)
   - Copy password

4. **Update `.env` file**:
   ```env
   REDIS_URL=redis://:YOUR_PASSWORD@redis-xxxxx.redislabs.com:xxxxx
   ```

**Pricing** (as of 2024):
- Free: 30MB
- Paid plans start at $5/month for 100MB

### Option 2: AWS ElastiCache

**Prerequisites**: AWS account

1. **Create ElastiCache cluster**:
   ```bash
   # Via AWS CLI
   aws elasticache create-cache-cluster \
     --cache-cluster-id mern-edu-redis \
     --engine redis \
     --cache-node-type cache.t3.micro \
     --num-cache-nodes 1 \
     --engine-version 7.0
   ```

2. **Configure security group**:
   - Allow inbound traffic on port 6379 from your backend servers
   - Never expose Redis publicly

3. **Get endpoint**:
   ```bash
   aws elasticache describe-cache-clusters \
     --cache-cluster-id mern-edu-redis \
     --show-cache-node-info
   ```

4. **Update `.env` file**:
   ```env
   REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
   ```

**Pricing**:
- cache.t3.micro: ~$0.017/hour (~$12/month)
- cache.t3.small: ~$0.034/hour (~$25/month)

### Option 3: DigitalOcean Managed Redis

1. **Create cluster**:
   - Visit: https://cloud.digitalocean.com/databases
   - Click "Create Database"
   - Select "Redis"
   - Choose plan and region
   - Click "Create Database Cluster"

2. **Get connection details**:
   - Navigate to cluster overview
   - Copy connection string

3. **Update `.env` file**:
   ```env
   REDIS_URL=rediss://default:password@your-cluster.db.ondigitalocean.com:25061
   ```

**Pricing**:
- Basic: $15/month (1GB RAM)
- Professional: $60/month (4GB RAM)

### Option 4: Render Redis

**Free Tier**: 25MB storage

1. **Create Redis instance**:
   - Visit: https://dashboard.render.com/
   - Click "New +" → "Redis"
   - Choose free plan
   - Select region
   - Click "Create Redis"

2. **Get connection details**:
   - Copy "Internal Redis URL" for same-region services
   - Copy "External Redis URL" for external access

3. **Update `.env` file**:
   ```env
   REDIS_URL=redis://red-xxxxx:6379
   ```

**Pricing**:
- Free: 25MB
- Paid plans start at $10/month for 1GB

### Option 5: Railway

**Free Tier**: $5 credit/month (enough for small Redis instance)

1. **Create Redis service**:
   - Visit: https://railway.app/
   - Create new project
   - Click "New" → "Database" → "Add Redis"

2. **Get connection details**:
   - Click on Redis service
   - Copy "REDIS_URL" from variables

3. **Update `.env` file**:
   ```env
   REDIS_URL=redis://default:password@containers-us-west-xxx.railway.app:6379
   ```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# For Redis Cloud with password
# REDIS_URL=redis://:YOUR_PASSWORD@host:port

# For Redis with username and password
# REDIS_URL=redis://username:password@host:port

# For Redis with TLS (rediss://)
# REDIS_URL=rediss://username:password@host:port
```

### Connection String Format

```
redis://[username][:password]@host:port[/database]
rediss://[username][:password]@host:port[/database]  # TLS/SSL
```

**Examples**:
- Local: `redis://localhost:6379`
- With password: `redis://:mypassword@localhost:6379`
- With username: `redis://myuser:mypassword@localhost:6379`
- Specific database: `redis://localhost:6379/1`
- TLS connection: `rediss://host:6380`

### Redis Configuration Options

For production, consider these Redis configuration settings:

```conf
# /etc/redis/redis.conf (Linux)
# or redis.windows.conf (Windows)

# Maximum memory (adjust based on your needs)
maxmemory 256mb

# Eviction policy when max memory is reached
maxmemory-policy allkeys-lru

# Enable persistence (optional, for session storage)
save 900 1
save 300 10
save 60 10000

# Append-only file for durability
appendonly yes
appendfilename "appendonly.aof"

# Require password (production)
requirepass your_strong_password_here

# Bind to specific interface (production)
bind 127.0.0.1

# Enable TLS (production)
tls-port 6380
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
```

---

## Verification

### Test Redis Connection

1. **Using redis-cli**:
   ```bash
   # Local
   redis-cli ping
   
   # Remote with password
   redis-cli -h host -p port -a password ping
   
   # Test set/get
   redis-cli set test "Hello Redis"
   redis-cli get test
   redis-cli del test
   ```

2. **Using Node.js** (create `test-redis.js`):
   ```javascript
   const Redis = require('ioredis');
   
   const redis = new Redis(process.env.REDIS_URL);
   
   async function testRedis() {
     try {
       // Test connection
       const pong = await redis.ping();
       console.log('✓ Redis connection:', pong);
       
       // Test set/get
       await redis.set('test:key', 'Hello Redis');
       const value = await redis.get('test:key');
       console.log('✓ Set/Get test:', value);
       
       // Test expiration
       await redis.setex('test:expire', 5, 'Expires in 5s');
       const ttl = await redis.ttl('test:expire');
       console.log('✓ TTL test:', ttl, 'seconds');
       
       // Cleanup
       await redis.del('test:key', 'test:expire');
       console.log('✓ All tests passed!');
       
       await redis.quit();
     } catch (error) {
       console.error('✗ Redis test failed:', error.message);
       process.exit(1);
     }
   }
   
   testRedis();
   ```

   Run test:
   ```bash
   node test-redis.js
   ```

### Monitor Redis

```bash
# Monitor all commands in real-time
redis-cli monitor

# Get server info
redis-cli info

# Check memory usage
redis-cli info memory

# List all keys (use carefully in production)
redis-cli keys "*"

# Get number of keys
redis-cli dbsize

# Check connected clients
redis-cli client list
```

---

## Best Practices

### 1. Security

- **Never expose Redis publicly**: Always use private networks or VPNs
- **Use strong passwords**: Minimum 32 characters, random
- **Enable TLS**: Use `rediss://` protocol for encrypted connections
- **Disable dangerous commands**: `CONFIG`, `FLUSHALL`, `FLUSHDB`, `KEYS`
- **Use ACLs**: Redis 6+ supports user-based access control

```bash
# Disable dangerous commands in redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""
```

### 2. Performance

- **Use connection pooling**: ioredis handles this automatically
- **Set appropriate TTLs**: Prevent memory bloat
- **Use pipelining**: Batch multiple commands
- **Monitor memory**: Set `maxmemory` and eviction policy
- **Use appropriate data structures**: Choose the right Redis data type

### 3. Caching Strategy

```javascript
// Cache with TTL
await redis.setex('course:123', 300, JSON.stringify(courseData)); // 5 minutes

// Cache invalidation
await redis.del('course:123');

// Pattern-based invalidation
const keys = await redis.keys('course:*');
if (keys.length > 0) {
  await redis.del(...keys);
}
```

### 4. Session Storage

```javascript
// Store session
await redis.setex(`session:${userId}`, 86400, JSON.stringify(sessionData)); // 24 hours

// Get session
const session = await redis.get(`session:${userId}`);

// Delete session (logout)
await redis.del(`session:${userId}`);
```

### 5. Rate Limiting

```javascript
// Sliding window rate limit
const key = `ratelimit:${ip}:${endpoint}`;
const current = await redis.incr(key);

if (current === 1) {
  await redis.expire(key, 60); // 1 minute window
}

if (current > 100) {
  throw new Error('Rate limit exceeded');
}
```

### 6. Monitoring

- **Track memory usage**: Set up alerts for high memory
- **Monitor slow commands**: Use `SLOWLOG` to identify bottlenecks
- **Track connection count**: Ensure you're not hitting connection limits
- **Monitor hit/miss ratio**: Optimize cache effectiveness

---

## Troubleshooting

### Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:
1. Verify Redis is running: `redis-cli ping`
2. Check Redis port: `netstat -an | grep 6379`
3. Verify REDIS_URL in `.env`
4. Check firewall rules

**Problem**: `Error: NOAUTH Authentication required`

**Solutions**:
1. Add password to connection string: `redis://:password@host:port`
2. Check Redis password in `redis.conf`

**Problem**: `Error: Connection timeout`

**Solutions**:
1. Check network connectivity
2. Verify security group rules (cloud)
3. Increase connection timeout in ioredis config

### Memory Issues

**Problem**: `OOM command not allowed when used memory > 'maxmemory'`

**Solutions**:
1. Increase `maxmemory` in redis.conf
2. Set eviction policy: `maxmemory-policy allkeys-lru`
3. Clear unused keys: `redis-cli FLUSHDB` (development only)
4. Reduce TTLs for cached data

### Performance Issues

**Problem**: Slow Redis operations

**Solutions**:
1. Check slow log: `redis-cli SLOWLOG GET 10`
2. Avoid `KEYS` command in production (use `SCAN` instead)
3. Use pipelining for multiple operations
4. Monitor network latency
5. Consider Redis cluster for scaling

### Data Persistence Issues

**Problem**: Data lost after Redis restart

**Solutions**:
1. Enable RDB snapshots: `save 900 1` in redis.conf
2. Enable AOF: `appendonly yes` in redis.conf
3. Verify persistence settings: `redis-cli CONFIG GET save`

---

## Next Steps

After setting up Redis:

1. **Task 1.5.2**: Configure ioredis client in your application
2. **Task 1.5.3**: Implement cache utility functions
3. **Task 1.5.4**: Set up session storage in Redis
4. **Task 12.1.3**: Implement rate limiting with Redis

## Additional Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Redis Security](https://redis.io/docs/manual/security/)
- [Redis Persistence](https://redis.io/docs/manual/persistence/)

---

**Last Updated**: 2024
**Maintained By**: MERN Education Platform Team
