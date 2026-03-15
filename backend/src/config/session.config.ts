/**
 * Session Configuration Module
 * Configures express-session with Redis store for distributed session management
 */

import session, { SessionOptions } from 'express-session';
import { RedisStore } from 'connect-redis';
import { getRedisClient } from './redis.config';
import { env, isProduction } from './env.config';

/**
 * Session configuration interface
 */
export interface SessionConfig {
  secret: string;
  name: string;
  resave: boolean;
  saveUninitialized: boolean;
  rolling: boolean;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
  };
  store: RedisStore;
}

/**
 * Session TTL constants (in milliseconds)
 */
export const SESSION_TTL = {
  DEFAULT: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME: 7 * 24 * 60 * 60 * 1000, // 7 days
  SHORT: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Creates Redis store for session storage
 * @returns RedisStore instance
 */
function createRedisStore(): RedisStore {
  const redisClient = getRedisClient();

  // Create Redis store with connect-redis
  const store = new RedisStore({
    client: redisClient,
    prefix: 'session:', // Prefix for session keys in Redis
    ttl: SESSION_TTL.DEFAULT / 1000, // TTL in seconds (24 hours)
    disableTouch: false, // Enable session TTL refresh on access
    disableTTL: false, // Enable TTL
  });

  return store;
}

/**
 * Creates session configuration based on environment
 * @param options - Optional session configuration overrides
 * @returns Session configuration object
 */
export function createSessionConfig(options?: Partial<SessionOptions>): SessionOptions {
  const store = createRedisStore();

  const config: SessionOptions = {
    // Session secret for signing session ID cookie
    secret: env.SESSION_SECRET,

    // Session ID cookie name
    name: 'sessionId',

    // Don't save session if unmodified
    resave: false,

    // Don't create session until something stored
    saveUninitialized: false,

    // Reset cookie maxAge on every request
    rolling: true,

    // Cookie settings
    cookie: {
      // Secure cookies in production (HTTPS only)
      secure: isProduction(),

      // Prevent client-side JavaScript access
      httpOnly: true,

      // Session duration (24 hours)
      maxAge: SESSION_TTL.DEFAULT,

      // CSRF protection
      sameSite: isProduction() ? 'strict' : 'lax',

      // Domain for cookie (undefined for current domain)
      domain: undefined,
    },

    // Redis store for session data
    store,

    // Apply any custom options
    ...options,
  };

  return config;
}

/**
 * Creates session middleware with default configuration
 * @returns Express session middleware
 */
export function createSessionMiddleware(): ReturnType<typeof session> {
  const config = createSessionConfig();
  return session(config);
}

/**
 * Creates session middleware with custom configuration
 * @param options - Custom session options
 * @returns Express session middleware
 */
export function createCustomSessionMiddleware(
  options: Partial<SessionOptions>
): ReturnType<typeof session> {
  const config = createSessionConfig(options);
  return session(config);
}

/**
 * Session data type extension for TypeScript
 * Extend this interface to add custom session properties
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    role?: string;
    isAuthenticated?: boolean;
    lastActivity?: number;
    rememberMe?: boolean;
  }
}

/**
 * Session utility functions
 */
export const SessionUtils = {
  /**
   * Destroys a session
   * @param session - Express session object
   * @returns Promise that resolves when session is destroyed
   */
  destroy: (session: session.Session): Promise<void> => {
    return new Promise((resolve, reject) => {
      session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Regenerates session ID (prevents session fixation attacks)
   * @param session - Express session object
   * @returns Promise that resolves when session is regenerated
   */
  regenerate: (session: session.Session): Promise<void> => {
    return new Promise((resolve, reject) => {
      session.regenerate((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Saves session data
   * @param session - Express session object
   * @returns Promise that resolves when session is saved
   */
  save: (session: session.Session): Promise<void> => {
    return new Promise((resolve, reject) => {
      session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Reloads session data from store
   * @param session - Express session object
   * @returns Promise that resolves when session is reloaded
   */
  reload: (session: session.Session): Promise<void> => {
    return new Promise((resolve, reject) => {
      session.reload((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Touches session to reset TTL
   * @param session - Express session object
   * @returns Promise that resolves when session is touched
   */
  touch: (session: session.Session): Promise<void> => {
    return new Promise((resolve, reject) => {
      session.touch();
      session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Checks if session is authenticated
   * @param session - Express session object
   * @returns True if session is authenticated
   */
  isAuthenticated: (session: session.Session & Partial<session.SessionData>): boolean => {
    return session.isAuthenticated === true && !!session.userId;
  },

  /**
   * Sets session as authenticated
   * @param session - Express session object
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @param rememberMe - Remember me flag
   */
  setAuthenticated: (
    session: session.Session & Partial<session.SessionData>,
    userId: string,
    email: string,
    role: string,
    rememberMe: boolean = false
  ): void => {
    session.userId = userId;
    session.email = email;
    session.role = role;
    session.isAuthenticated = true;
    session.lastActivity = Date.now();
    session.rememberMe = rememberMe;

    // Extend session duration if remember me is enabled
    if (rememberMe && session.cookie) {
      session.cookie.maxAge = SESSION_TTL.REMEMBER_ME;
    }
  },

  /**
   * Clears authentication data from session
   * @param session - Express session object
   */
  clearAuthentication: (session: session.Session & Partial<session.SessionData>): void => {
    delete session.userId;
    delete session.email;
    delete session.role;
    delete session.isAuthenticated;
    delete session.lastActivity;
    delete session.rememberMe;
  },

  /**
   * Updates last activity timestamp
   * @param session - Express session object
   */
  updateActivity: (session: session.Session & Partial<session.SessionData>): void => {
    session.lastActivity = Date.now();
  },

  /**
   * Checks if session has expired due to inactivity
   * @param session - Express session object
   * @param maxInactiveMs - Maximum inactive time in milliseconds (default: 30 minutes)
   * @returns True if session is inactive
   */
  isInactive: (
    session: session.Session & Partial<session.SessionData>,
    maxInactiveMs: number = 30 * 60 * 1000
  ): boolean => {
    if (!session.lastActivity) {
      return false;
    }

    const inactiveTime = Date.now() - session.lastActivity;
    return inactiveTime > maxInactiveMs;
  },
};

/**
 * Session cleanup configuration
 */
export interface SessionCleanupConfig {
  enabled: boolean;
  intervalMs: number;
}

/**
 * Default cleanup configuration
 */
const DEFAULT_CLEANUP_CONFIG: SessionCleanupConfig = {
  enabled: true,
  intervalMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Session cleanup interval reference
 */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Sets up automatic cleanup of expired sessions
 * Note: Redis automatically handles TTL expiration, but this provides additional monitoring
 * @param config - Cleanup configuration
 */
export function setupSessionCleanup(config: SessionCleanupConfig = DEFAULT_CLEANUP_CONFIG): void {
  if (!config.enabled) {
    console.log('ℹ️  Session cleanup disabled');
    return;
  }

  // Clear existing interval if any
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  console.log(`✅ Session cleanup enabled (interval: ${config.intervalMs / 1000}s)`);

  // Redis automatically handles TTL expiration, so this is mainly for logging
  cleanupInterval = setInterval(() => {
    console.log('🧹 Session cleanup check (Redis handles TTL automatically)');
  }, config.intervalMs);
}

/**
 * Stops session cleanup
 */
export function stopSessionCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('✅ Session cleanup stopped');
  }
}

/**
 * Gets session statistics from Redis
 * @returns Promise that resolves to session statistics
 */
export async function getSessionStats(): Promise<{
  totalSessions: number;
  activeSessions: number;
}> {
  const redisClient = getRedisClient();

  try {
    // Count session keys in Redis
    const keys = await redisClient.keys('session:*');
    const totalSessions = keys.length;

    // For simplicity, consider all sessions as active
    // In production, you might want to check lastActivity timestamps
    const activeSessions = totalSessions;

    return {
      totalSessions,
      activeSessions,
    };
  } catch (error) {
    console.error('Failed to get session stats:', error);
    return {
      totalSessions: 0,
      activeSessions: 0,
    };
  }
}
