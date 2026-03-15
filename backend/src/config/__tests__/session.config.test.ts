/**
 * Session Configuration Tests
 * Tests session setup, middleware, and utility functions
 */

import { SessionOptions } from 'express-session';
import {
  createSessionConfig,
  createSessionMiddleware,
  createCustomSessionMiddleware,
  SessionUtils,
  SESSION_TTL,
  setupSessionCleanup,
  stopSessionCleanup,
  getSessionStats,
} from '../session.config';
import { connectRedis, disconnectRedis, getRedisClient } from '../redis.config';

// Mock environment
jest.mock('../env.config', () => ({
  env: {
    SESSION_SECRET: 'test-session-secret-key-32-characters-long',
    NODE_ENV: 'test',
  },
  isProduction: jest.fn(() => false),
}));

describe('Session Configuration', () => {
  beforeAll(async () => {
    // Connect to Redis before tests
    await connectRedis();
  });

  afterAll(async () => {
    // Clean up
    stopSessionCleanup();
    await disconnectRedis();
  });

  afterEach(async () => {
    // Clear all session keys after each test
    const client = getRedisClient();
    const keys = await client.keys('session:*');
    if (keys.length > 0) {
      await client.del(...keys);
    }
  });

  describe('createSessionConfig', () => {
    it('should create default session configuration', () => {
      const config = createSessionConfig();

      expect(config.secret).toBe('test-session-secret-key-32-characters-long');
      expect(config.name).toBe('sessionId');
      expect(config.resave).toBe(false);
      expect(config.saveUninitialized).toBe(false);
      expect(config.rolling).toBe(true);
      expect(config.store).toBeDefined();
    });

    it('should configure secure cookies in production', () => {
      const { isProduction } = require('../env.config');
      isProduction.mockReturnValue(true);

      const config = createSessionConfig();

      expect(config.cookie?.secure).toBe(true);
      expect(config.cookie?.sameSite).toBe('strict');

      isProduction.mockReturnValue(false);
    });

    it('should configure non-secure cookies in development', () => {
      const config = createSessionConfig();

      expect(config.cookie?.secure).toBe(false);
      expect(config.cookie?.sameSite).toBe('lax');
    });

    it('should set httpOnly cookie flag', () => {
      const config = createSessionConfig();

      expect(config.cookie?.httpOnly).toBe(true);
    });

    it('should set default session maxAge to 24 hours', () => {
      const config = createSessionConfig();

      expect(config.cookie?.maxAge).toBe(SESSION_TTL.DEFAULT);
      expect(config.cookie?.maxAge).toBe(24 * 60 * 60 * 1000);
    });

    it('should allow custom configuration overrides', () => {
      const customOptions: Partial<SessionOptions> = {
        name: 'customSessionId',
        rolling: false,
        cookie: {
          maxAge: SESSION_TTL.SHORT,
        },
      };

      const config = createSessionConfig(customOptions);

      expect(config.name).toBe('customSessionId');
      expect(config.rolling).toBe(false);
      expect(config.cookie?.maxAge).toBe(SESSION_TTL.SHORT);
    });
  });

  describe('createSessionMiddleware', () => {
    it('should create session middleware', () => {
      const middleware = createSessionMiddleware();

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('createCustomSessionMiddleware', () => {
    it('should create custom session middleware', () => {
      const middleware = createCustomSessionMiddleware({
        name: 'customSession',
      });

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('SessionUtils', () => {
    let mockSession: any;

    beforeEach(() => {
      mockSession = {
        id: 'test-session-id',
        cookie: {
          maxAge: SESSION_TTL.DEFAULT,
        },
        destroy: jest.fn((callback) => callback()),
        regenerate: jest.fn((callback) => callback()),
        save: jest.fn((callback) => callback()),
        reload: jest.fn((callback) => callback()),
        touch: jest.fn(),
      };
    });

    describe('destroy', () => {
      it('should destroy session successfully', async () => {
        await SessionUtils.destroy(mockSession);

        expect(mockSession.destroy).toHaveBeenCalled();
      });

      it('should reject on error', async () => {
        mockSession.destroy = jest.fn((callback) => callback(new Error('Destroy failed')));

        await expect(SessionUtils.destroy(mockSession)).rejects.toThrow('Destroy failed');
      });
    });

    describe('regenerate', () => {
      it('should regenerate session ID successfully', async () => {
        await SessionUtils.regenerate(mockSession);

        expect(mockSession.regenerate).toHaveBeenCalled();
      });

      it('should reject on error', async () => {
        mockSession.regenerate = jest.fn((callback) => callback(new Error('Regenerate failed')));

        await expect(SessionUtils.regenerate(mockSession)).rejects.toThrow('Regenerate failed');
      });
    });

    describe('save', () => {
      it('should save session successfully', async () => {
        await SessionUtils.save(mockSession);

        expect(mockSession.save).toHaveBeenCalled();
      });

      it('should reject on error', async () => {
        mockSession.save = jest.fn((callback) => callback(new Error('Save failed')));

        await expect(SessionUtils.save(mockSession)).rejects.toThrow('Save failed');
      });
    });

    describe('reload', () => {
      it('should reload session successfully', async () => {
        await SessionUtils.reload(mockSession);

        expect(mockSession.reload).toHaveBeenCalled();
      });

      it('should reject on error', async () => {
        mockSession.reload = jest.fn((callback) => callback(new Error('Reload failed')));

        await expect(SessionUtils.reload(mockSession)).rejects.toThrow('Reload failed');
      });
    });

    describe('touch', () => {
      it('should touch session and save', async () => {
        await SessionUtils.touch(mockSession);

        expect(mockSession.touch).toHaveBeenCalled();
        expect(mockSession.save).toHaveBeenCalled();
      });
    });

    describe('isAuthenticated', () => {
      it('should return true for authenticated session', () => {
        mockSession.isAuthenticated = true;
        mockSession.userId = 'user123';

        expect(SessionUtils.isAuthenticated(mockSession)).toBe(true);
      });

      it('should return false for unauthenticated session', () => {
        mockSession.isAuthenticated = false;

        expect(SessionUtils.isAuthenticated(mockSession)).toBe(false);
      });

      it('should return false if userId is missing', () => {
        mockSession.isAuthenticated = true;
        mockSession.userId = undefined;

        expect(SessionUtils.isAuthenticated(mockSession)).toBe(false);
      });
    });

    describe('setAuthenticated', () => {
      it('should set authentication data', () => {
        SessionUtils.setAuthenticated(mockSession, 'user123', 'test@example.com', 'student');

        expect(mockSession.userId).toBe('user123');
        expect(mockSession.email).toBe('test@example.com');
        expect(mockSession.role).toBe('student');
        expect(mockSession.isAuthenticated).toBe(true);
        expect(mockSession.lastActivity).toBeDefined();
        expect(mockSession.rememberMe).toBe(false);
      });

      it('should extend session duration with remember me', () => {
        SessionUtils.setAuthenticated(mockSession, 'user123', 'test@example.com', 'student', true);

        expect(mockSession.rememberMe).toBe(true);
        expect(mockSession.cookie.maxAge).toBe(SESSION_TTL.REMEMBER_ME);
      });
    });

    describe('clearAuthentication', () => {
      it('should clear authentication data', () => {
        mockSession.userId = 'user123';
        mockSession.email = 'test@example.com';
        mockSession.role = 'student';
        mockSession.isAuthenticated = true;
        mockSession.lastActivity = Date.now();

        SessionUtils.clearAuthentication(mockSession);

        expect(mockSession.userId).toBeUndefined();
        expect(mockSession.email).toBeUndefined();
        expect(mockSession.role).toBeUndefined();
        expect(mockSession.isAuthenticated).toBeUndefined();
        expect(mockSession.lastActivity).toBeUndefined();
      });
    });

    describe('updateActivity', () => {
      it('should update last activity timestamp', () => {
        const beforeTime = Date.now();
        SessionUtils.updateActivity(mockSession);
        const afterTime = Date.now();

        expect(mockSession.lastActivity).toBeGreaterThanOrEqual(beforeTime);
        expect(mockSession.lastActivity).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('isInactive', () => {
      it('should return false for active session', () => {
        mockSession.lastActivity = Date.now();

        expect(SessionUtils.isInactive(mockSession)).toBe(false);
      });

      it('should return true for inactive session', () => {
        mockSession.lastActivity = Date.now() - 31 * 60 * 1000; // 31 minutes ago

        expect(SessionUtils.isInactive(mockSession)).toBe(true);
      });

      it('should return false if lastActivity is not set', () => {
        mockSession.lastActivity = undefined;

        expect(SessionUtils.isInactive(mockSession)).toBe(false);
      });

      it('should use custom inactivity threshold', () => {
        mockSession.lastActivity = Date.now() - 10 * 60 * 1000; // 10 minutes ago

        expect(SessionUtils.isInactive(mockSession, 5 * 60 * 1000)).toBe(true);
        expect(SessionUtils.isInactive(mockSession, 15 * 60 * 1000)).toBe(false);
      });
    });
  });

  describe('Session Cleanup', () => {
    it('should set up session cleanup', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      setupSessionCleanup({ enabled: true, intervalMs: 1000 });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Session cleanup enabled'));

      consoleSpy.mockRestore();
      stopSessionCleanup();
    });

    it('should not set up cleanup when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      setupSessionCleanup({ enabled: false, intervalMs: 1000 });

      expect(consoleSpy).toHaveBeenCalledWith('ℹ️  Session cleanup disabled');

      consoleSpy.mockRestore();
    });

    it('should stop session cleanup', () => {
      setupSessionCleanup({ enabled: true, intervalMs: 1000 });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      stopSessionCleanup();

      expect(consoleSpy).toHaveBeenCalledWith('✅ Session cleanup stopped');

      consoleSpy.mockRestore();
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const client = getRedisClient();

      // Create some test sessions
      await client.set('session:user1', 'data1', 'EX', 3600);
      await client.set('session:user2', 'data2', 'EX', 3600);
      await client.set('session:user3', 'data3', 'EX', 3600);

      const stats = await getSessionStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.activeSessions).toBe(3);
    });

    it('should return zero stats when no sessions exist', async () => {
      const stats = await getSessionStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });
  });

  describe('SESSION_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(SESSION_TTL.DEFAULT).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(SESSION_TTL.REMEMBER_ME).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
      expect(SESSION_TTL.SHORT).toBe(30 * 60 * 1000); // 30 minutes
    });
  });
});
