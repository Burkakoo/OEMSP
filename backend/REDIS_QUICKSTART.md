# Redis Quick Start Guide

Get Redis up and running in 5 minutes for local development.

## Quick Setup Options

### Option 1: Docker (Fastest - Recommended)

```bash
# Pull and run Redis
docker run -d --name mern-edu-redis -p 6379:6379 redis:7-alpine

# Test connection
docker exec -it mern-edu-redis redis-cli ping
# Expected output: PONG
```

**Add to `.env`**:
```env
REDIS_URL=redis://localhost:6379
```

✅ **Done!** Redis is ready to use.

---

### Option 2: macOS (Homebrew)

```bash
# Install
brew install redis

# Start
brew services start redis

# Test
redis-cli ping
# Expected output: PONG
```

**Add to `.env`**:
```env
REDIS_URL=redis://localhost:6379
```

✅ **Done!** Redis is ready to use.

---

### Option 3: Linux (Ubuntu/Debian)

```bash
# Install
sudo apt update && sudo apt install redis-server

# Start
sudo systemctl start redis-server

# Test
redis-cli ping
# Expected output: PONG
```

**Add to `.env`**:
```env
REDIS_URL=redis://localhost:6379
```

✅ **Done!** Redis is ready to use.

---

### Option 4: Windows

1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Install and run `redis-server.exe`
3. Test with `redis-cli.exe ping`

**Add to `.env`**:
```env
REDIS_URL=redis://localhost:6379
```

✅ **Done!** Redis is ready to use.

---

## Cloud Options (Free Tier)

### Redis Cloud (30MB Free)

1. Sign up: https://redis.com/try-free/
2. Create database (Fixed plan - free)
3. Copy connection details

**Add to `.env`**:
```env
REDIS_URL=redis://:YOUR_PASSWORD@redis-xxxxx.redislabs.com:xxxxx
```

### Render (25MB Free)

1. Sign up: https://dashboard.render.com/
2. New + → Redis (Free plan)
3. Copy Redis URL

**Add to `.env`**:
```env
REDIS_URL=redis://red-xxxxx:6379
```

---

## Verify Setup

Create `test-redis.js`:

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

redis.ping()
  .then(result => {
    console.log('✓ Redis connected:', result);
    return redis.quit();
  })
  .catch(err => {
    console.error('✗ Redis connection failed:', err.message);
    process.exit(1);
  });
```

Run:
```bash
node test-redis.js
```

Expected output: `✓ Redis connected: PONG`

---

## Common Commands

```bash
# Check if Redis is running
redis-cli ping

# Set a value
redis-cli set mykey "Hello"

# Get a value
redis-cli get mykey

# Delete a key
redis-cli del mykey

# View all keys (development only)
redis-cli keys "*"

# Monitor commands in real-time
redis-cli monitor

# Get server info
redis-cli info
```

---

## Troubleshooting

### Connection Refused

```bash
# Check if Redis is running
redis-cli ping

# If not running:
# Docker: docker start mern-edu-redis
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
```

### Authentication Error

If you see `NOAUTH Authentication required`:

```env
# Add password to connection string
REDIS_URL=redis://:YOUR_PASSWORD@host:port
```

---

## Next Steps

1. ✅ Redis is running
2. ✅ Connection string in `.env`
3. → Continue to **Task 1.5.2**: Configure ioredis client
4. → Continue to **Task 1.5.3**: Implement cache utility functions

---

For detailed setup instructions, see [REDIS_SETUP.md](./REDIS_SETUP.md)
