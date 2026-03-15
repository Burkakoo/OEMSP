# Redis Setup Checklist

Use this checklist to ensure your Redis instance is properly configured for the MERN Education Platform.

## Development Environment

### Local Setup

- [ ] **Redis Installation**
  - [ ] Redis installed (Docker/native)
  - [ ] Redis service is running
  - [ ] Can connect via `redis-cli ping`

- [ ] **Environment Configuration**
  - [ ] `REDIS_URL` added to `.env` file
  - [ ] Connection string format is correct
  - [ ] No trailing slashes in URL

- [ ] **Connection Testing**
  - [ ] Can ping Redis successfully
  - [ ] Can set and get values
  - [ ] Can delete keys
  - [ ] TTL/expiration works correctly

- [ ] **Basic Operations**
  - [ ] String operations work (SET/GET)
  - [ ] Key expiration works (SETEX/TTL)
  - [ ] Key deletion works (DEL)
  - [ ] Pattern matching works (KEYS/SCAN)

---

## Production Environment

### Cloud Provider Setup

- [ ] **Provider Selection**
  - [ ] Cloud provider chosen (Redis Cloud, AWS ElastiCache, etc.)
  - [ ] Appropriate plan selected
  - [ ] Region selected (close to backend servers)

- [ ] **Instance Configuration**
  - [ ] Redis version 6.0 or higher
  - [ ] Sufficient memory allocated (minimum 256MB recommended)
  - [ ] Eviction policy configured (`allkeys-lru` recommended)
  - [ ] Max memory limit set

- [ ] **Network Configuration**
  - [ ] Private network/VPC configured
  - [ ] Security groups configured
  - [ ] Firewall rules allow backend access
  - [ ] Redis NOT exposed to public internet

### Security Configuration

- [ ] **Authentication**
  - [ ] Strong password set (minimum 32 characters)
  - [ ] Password stored securely (environment variables)
  - [ ] Default user disabled (if using ACLs)
  - [ ] User-specific permissions configured (Redis 6+)

- [ ] **Encryption**
  - [ ] TLS/SSL enabled for production
  - [ ] Using `rediss://` protocol (not `redis://`)
  - [ ] Valid SSL certificates configured
  - [ ] Certificate verification enabled

- [ ] **Access Control**
  - [ ] ACLs configured (Redis 6+)
  - [ ] Dangerous commands disabled/renamed
    - [ ] `FLUSHDB` disabled
    - [ ] `FLUSHALL` disabled
    - [ ] `KEYS` disabled (use SCAN instead)
    - [ ] `CONFIG` restricted
  - [ ] Only necessary commands allowed

### Performance Configuration

- [ ] **Memory Management**
  - [ ] `maxmemory` set appropriately
  - [ ] `maxmemory-policy` configured (allkeys-lru)
  - [ ] Memory usage monitored
  - [ ] Alerts set for high memory usage

- [ ] **Persistence** (if needed)
  - [ ] RDB snapshots configured
  - [ ] AOF enabled (if durability required)
  - [ ] Backup schedule configured
  - [ ] Backup restoration tested

- [ ] **Connection Pooling**
  - [ ] ioredis client configured
  - [ ] Connection pool size appropriate
  - [ ] Connection timeout configured
  - [ ] Retry strategy configured

### Monitoring and Logging

- [ ] **Monitoring Setup**
  - [ ] Memory usage monitoring
  - [ ] CPU usage monitoring
  - [ ] Connection count monitoring
  - [ ] Command latency monitoring
  - [ ] Hit/miss ratio tracking

- [ ] **Alerting**
  - [ ] High memory usage alerts
  - [ ] Connection limit alerts
  - [ ] Slow command alerts
  - [ ] Downtime alerts

- [ ] **Logging**
  - [ ] Slow log enabled
  - [ ] Slow log threshold configured
  - [ ] Error logging configured
  - [ ] Log rotation configured

---

## Application Integration

### ioredis Client Configuration

- [ ] **Client Setup**
  - [ ] ioredis package installed
  - [ ] Redis client initialized
  - [ ] Connection error handling implemented
  - [ ] Graceful shutdown implemented

- [ ] **Connection Options**
  - [ ] Retry strategy configured
  - [ ] Connection timeout set
  - [ ] Keep-alive enabled
  - [ ] Reconnect on error enabled

### Cache Implementation

- [ ] **Cache Utility Functions**
  - [ ] `get()` function implemented
  - [ ] `set()` function with TTL implemented
  - [ ] `del()` function implemented
  - [ ] `exists()` function implemented
  - [ ] Pattern-based deletion implemented

- [ ] **Cache Strategy**
  - [ ] Appropriate TTLs set for different data types
  - [ ] Cache invalidation strategy defined
  - [ ] Cache warming strategy (if needed)
  - [ ] Cache key naming convention established

### Session Storage

- [ ] **Session Configuration**
  - [ ] Session store configured
  - [ ] Session TTL configured (24 hours recommended)
  - [ ] Session serialization implemented
  - [ ] Session cleanup implemented

- [ ] **Session Operations**
  - [ ] Create session on login
  - [ ] Retrieve session on request
  - [ ] Update session on activity
  - [ ] Delete session on logout

### Token Blacklisting

- [ ] **Blacklist Implementation**
  - [ ] Blacklist key format defined
  - [ ] TTL matches token expiration
  - [ ] Blacklist check in auth middleware
  - [ ] Cleanup of expired tokens

### Rate Limiting

- [ ] **Rate Limit Configuration**
  - [ ] Rate limit counters in Redis
  - [ ] Sliding window implementation
  - [ ] Different limits for different endpoints
  - [ ] Rate limit headers returned

---

## Testing

### Functional Testing

- [ ] **Connection Tests**
  - [ ] Can connect to Redis
  - [ ] Connection retry works
  - [ ] Graceful degradation on Redis failure

- [ ] **Cache Tests**
  - [ ] Cache hit works
  - [ ] Cache miss works
  - [ ] Cache invalidation works
  - [ ] TTL expiration works

- [ ] **Session Tests**
  - [ ] Session creation works
  - [ ] Session retrieval works
  - [ ] Session deletion works
  - [ ] Session expiration works

- [ ] **Rate Limit Tests**
  - [ ] Rate limit enforcement works
  - [ ] Rate limit reset works
  - [ ] Rate limit headers correct

### Performance Testing

- [ ] **Load Testing**
  - [ ] Tested under expected load
  - [ ] Tested under peak load
  - [ ] Memory usage acceptable
  - [ ] Response times acceptable

- [ ] **Failover Testing**
  - [ ] Application handles Redis downtime
  - [ ] Reconnection works after downtime
  - [ ] No data corruption on failure

---

## Documentation

- [ ] **Setup Documentation**
  - [ ] Connection string documented
  - [ ] Configuration options documented
  - [ ] Environment variables documented

- [ ] **Usage Documentation**
  - [ ] Cache usage patterns documented
  - [ ] Session storage usage documented
  - [ ] Rate limiting usage documented
  - [ ] Common operations documented

- [ ] **Troubleshooting Guide**
  - [ ] Common issues documented
  - [ ] Solutions documented
  - [ ] Contact information for support

---

## Maintenance

### Regular Tasks

- [ ] **Daily**
  - [ ] Monitor memory usage
  - [ ] Check error logs
  - [ ] Verify connection count

- [ ] **Weekly**
  - [ ] Review slow log
  - [ ] Check hit/miss ratio
  - [ ] Review cache effectiveness

- [ ] **Monthly**
  - [ ] Review and optimize TTLs
  - [ ] Review cache key patterns
  - [ ] Update Redis version (if needed)
  - [ ] Test backup restoration

### Backup and Recovery

- [ ] **Backup Strategy**
  - [ ] Backup schedule defined
  - [ ] Backup location configured
  - [ ] Backup retention policy defined
  - [ ] Backup encryption enabled

- [ ] **Recovery Plan**
  - [ ] Recovery procedure documented
  - [ ] Recovery tested
  - [ ] RTO/RPO defined
  - [ ] Team trained on recovery

---

## Sign-off

- [ ] **Development Environment**
  - [ ] All development checks completed
  - [ ] Tested by: ________________
  - [ ] Date: ________________

- [ ] **Production Environment**
  - [ ] All production checks completed
  - [ ] Security review completed
  - [ ] Performance testing completed
  - [ ] Approved by: ________________
  - [ ] Date: ________________

---

## Quick Reference

### Essential Commands

```bash
# Check connection
redis-cli ping

# Monitor commands
redis-cli monitor

# Check memory
redis-cli info memory

# Check slow log
redis-cli slowlog get 10

# Get server info
redis-cli info

# Check connected clients
redis-cli client list
```

### Connection Strings

```env
# Local
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:password@host:port

# With TLS
REDIS_URL=rediss://:password@host:port
```

---

**Last Updated**: 2024
**Version**: 1.0
