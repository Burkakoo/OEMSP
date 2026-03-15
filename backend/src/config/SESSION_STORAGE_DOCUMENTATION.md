# Session Storage Documentation

## Overview

The MERN Education Platform uses **Redis-backed session storage** with `express-session` and `connect-redis` for distributed, stateless session management across multiple server instances.

## Features

✅ **Redis-backed storage** - Distributed session storage for horizontal scaling  
✅ **Secure configuration** - HTTP-only cookies, CSRF protection, secure cookies in production  
✅ **Session utilities** - Helper functions for session management  
✅ **Automatic cleanup** - Redis TTL handles session expiration  
✅ **TypeScript support** - Fully typed session data  
✅ **Remember me** - Extended session duration option  
✅ **Activity tracking** - Last activity timestamps for inactivity detection  

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│   Express   │────────▶│    Redis    │
│  (Browser)  │◀────────│   Server    │◀────────│   Session   │
└─────────────┘         └─────────────┘         │    Store    │
                                                 └─────────────┘
     Cookie                 Session                  Session
   (sessionId)             Middleware                  Data
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Session secret (minimum 32 characters / 256 bits)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-session-secret-key-min-32-characters-required-change-this
```

### Session Configuration

The session configuration is automatically set up based on the environment:

**Development:**
- Secure cookies: `false` (allows HTTP)
- SameSite: `lax`
- Domain: `undefined` (current domain)

**Production:**
- Secure cookies: `true` (HTTPS only)
- SameSite: `strict`
- Domain: `undefined` (current domain)

### Session Options

```typescript
{
  secret: env.SESSION_SECRET,        // Session signing secret
  name: 'sessionId',                 // Cookie name
  resave: false,                     // Don't save if unmodified
  saveUninitialized: false,          // Don't create until data stored
  rolling: true,                     // Reset maxAge on every request
  cookie: {
    secure: isProduction(),          // HTTPS only in production
    httpOnly: true,                  // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000,    // 24 hours
    sameSite: 'strict',              // CSRF protection
  },
  store: RedisStore                  // Redis session store
}
```

## Usage

### Basic Setup

The session middleware is automatically configured in `server.ts`:

```typescript
import { createSessionMiddleware } from './config/session.config';

// After Redis connection
app.use(createSessionMiddleware());
```

### Custom Configuration

Create a custom session middleware with specific options:

```typescript
import { createCustomSessionMiddleware, SESSION_TTL } from './config/session.config';

const customSession = createCustomSessionMiddleware({
  name: 'adminSession',
  cookie: {
    maxAge: SESSION_TTL.SHORT, // 30 minutes
  },
});

app.use('/admin', customSession);
```

### Session Data Access

Access session data in route handlers:

```typescript
import { Request, Response } from 'express';

app.post('/login', async (req: Request, res: Response) => {
  // Authenticate user...
  
  // Store data in session
  req.session.userId = user._id;
  req.session.email = user.email;
  req.session.role = user.role;
  req.session.isAuthenticated = true;
  
  res.json({ success: true });
});

app.get('/profile', (req: Request, res: Response) => {
  // Access session data
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = req.session.userId;
  // Fetch user profile...
});
```

### Session Utilities

The `SessionUtils` object provides helper functions for common session operations:

#### Destroy Session (Logout)

```typescript
import { SessionUtils } from './config/session.config';

app.post('/logout', async (req: Request, res: Response) => {
  try {
    await SessionUtils.destroy(req.session);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});
```

#### Regenerate Session ID (Prevent Session Fixation)

```typescript
app.post('/login', async (req: Request, res: Response) => {
  // Authenticate user...
  
  // Regenerate session ID after login
  await SessionUtils.regenerate(req.session);
  
  // Set session data
  SessionUtils.setAuthenticated(
    req.session,
    user._id,
    user.email,
    user.role,
    req.body.rememberMe
  );
  
  res.json({ success: true });
});
```

#### Check Authentication

```typescript
app.get('/protected', (req: Request, res: Response) => {
  if (!SessionUtils.isAuthenticated(req.session)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Protected route logic...
});
```

#### Set Authenticated Session

```typescript
// Basic authentication
SessionUtils.setAuthenticated(
  req.session,
  userId,
  email,
  role
);

// With "remember me" (7 days)
SessionUtils.setAuthenticated(
  req.session,
  userId,
  email,
  role,
  true // rememberMe
);
```

#### Clear Authentication

```typescript
app.post('/logout', async (req: Request, res: Response) => {
  SessionUtils.clearAuthentication(req.session);
  await SessionUtils.destroy(req.session);
  res.json({ success: true });
});
```

#### Update Activity Timestamp

```typescript
app.use((req: Request, res: Response, next) => {
  if (req.session.isAuthenticated) {
    SessionUtils.updateActivity(req.session);
  }
  next();
});
```

#### Check Inactivity

```typescript
app.use((req: Request, res: Response, next) => {
  if (SessionUtils.isInactive(req.session, 30 * 60 * 1000)) {
    // Session inactive for 30 minutes
    SessionUtils.clearAuthentication(req.session);
    return res.status(401).json({ error: 'Session expired due to inactivity' });
  }
  next();
});
```

#### Save Session

```typescript
app.post('/update-preferences', async (req: Request, res: Response) => {
  req.session.preferences = req.body.preferences;
  
  // Explicitly save session
  await SessionUtils.save(req.session);
  
  res.json({ success: true });
});
```

#### Touch Session (Reset TTL)

```typescript
app.get('/keep-alive', async (req: Request, res: Response) => {
  await SessionUtils.touch(req.session);
  res.json({ success: true });
});
```

## Session Data Type

Extend the session data type for TypeScript support:

```typescript
// In session.config.ts or a separate types file
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    role?: string;
    isAuthenticated?: boolean;
    lastActivity?: number;
    rememberMe?: boolean;
    // Add custom properties
    preferences?: {
      theme: string;
      language: string;
    };
  }
}
```

## Session TTL Constants

Pre-defined session duration constants:

```typescript
import { SESSION_TTL } from './config/session.config';

SESSION_TTL.DEFAULT      // 24 hours (86400000 ms)
SESSION_TTL.REMEMBER_ME  // 7 days (604800000 ms)
SESSION_TTL.SHORT        // 30 minutes (1800000 ms)
```

## Session Cleanup

Redis automatically handles session expiration through TTL. The cleanup function provides additional monitoring:

```typescript
import { setupSessionCleanup, stopSessionCleanup } from './config/session.config';

// Enable cleanup (runs every hour by default)
setupSessionCleanup();

// Custom interval
setupSessionCleanup({
  enabled: true,
  intervalMs: 30 * 60 * 1000, // 30 minutes
});

// Disable cleanup
setupSessionCleanup({ enabled: false });

// Stop cleanup
stopSessionCleanup();
```

## Session Statistics

Get session statistics from Redis:

```typescript
import { getSessionStats } from './config/session.config';

const stats = await getSessionStats();
console.log(`Total sessions: ${stats.totalSessions}`);
console.log(`Active sessions: ${stats.activeSessions}`);
```

## Authentication Middleware Example

Create an authentication middleware using sessions:

```typescript
import { Request, Response, NextFunction } from 'express';
import { SessionUtils } from './config/session.config';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!SessionUtils.isAuthenticated(req.session)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check for inactivity (30 minutes)
  if (SessionUtils.isInactive(req.session, 30 * 60 * 1000)) {
    SessionUtils.clearAuthentication(req.session);
    return res.status(401).json({ error: 'Session expired due to inactivity' });
  }
  
  // Update activity timestamp
  SessionUtils.updateActivity(req.session);
  
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!SessionUtils.isAuthenticated(req.session)) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.session.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
app.get('/profile', requireAuth, (req, res) => {
  // Protected route
});

app.get('/admin', requireRole('admin'), (req, res) => {
  // Admin-only route
});
```

## Security Best Practices

### 1. Session Fixation Prevention

Always regenerate session ID after login:

```typescript
await SessionUtils.regenerate(req.session);
SessionUtils.setAuthenticated(req.session, userId, email, role);
```

### 2. CSRF Protection

Sessions use `sameSite` cookie attribute for CSRF protection:
- Production: `strict`
- Development: `lax`

### 3. XSS Protection

Sessions use `httpOnly` cookies to prevent JavaScript access.

### 4. Secure Cookies

In production, cookies are only sent over HTTPS (`secure: true`).

### 5. Session Timeout

Implement inactivity timeout:

```typescript
if (SessionUtils.isInactive(req.session, 30 * 60 * 1000)) {
  SessionUtils.clearAuthentication(req.session);
  return res.status(401).json({ error: 'Session expired' });
}
```

### 6. Strong Session Secret

Use a strong, random session secret (minimum 32 characters):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Redis Session Keys

Sessions are stored in Redis with the following key pattern:

```
session:<sessionId>
```

Example:
```
session:abc123def456...
```

## Troubleshooting

### Sessions Not Persisting

1. Check Redis connection:
```typescript
import { isConnected } from './config/redis.config';
console.log('Redis connected:', isConnected());
```

2. Verify session middleware is added after Redis connection
3. Check `saveUninitialized` setting (should be `false`)

### Session Data Lost After Server Restart

This is expected behavior. Sessions are stored in Redis with TTL and will expire. For persistent authentication, use JWT tokens instead.

### Cookie Not Being Set

1. Check `secure` setting matches your protocol (HTTP/HTTPS)
2. Verify `sameSite` setting is compatible with your setup
3. Check CORS configuration allows credentials

### Session Expired Too Quickly

1. Check `maxAge` setting in cookie configuration
2. Verify `rolling` is set to `true` to reset TTL on each request
3. Check Redis TTL configuration

## Performance Considerations

### Connection Pooling

Redis client uses connection pooling automatically. No additional configuration needed.

### Session Size

Keep session data minimal. Store only essential information:
- ✅ User ID, email, role
- ✅ Authentication status
- ❌ Large objects, arrays
- ❌ Sensitive data (passwords, tokens)

### TTL Management

Redis automatically handles session expiration through TTL. No manual cleanup required.

## Integration with JWT

Sessions and JWT can work together:

```typescript
// Store JWT in session for server-side validation
req.session.accessToken = jwtToken;

// Or use sessions for web, JWT for mobile
if (req.headers['user-agent']?.includes('Mobile')) {
  // Use JWT
} else {
  // Use sessions
}
```

## Testing

Run session configuration tests:

```bash
npm test -- session.config.test.ts
```

## Next Steps

1. ✅ Session storage configured
2. ⏭️ Implement authentication service (Task 3.1)
3. ⏭️ Create authentication middleware (Task 3.2)
4. ⏭️ Implement rate limiting (Task 12.1.3)

## References

- [express-session documentation](https://github.com/expressjs/session)
- [connect-redis documentation](https://github.com/tj/connect-redis)
- [Redis TTL documentation](https://redis.io/commands/ttl/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
