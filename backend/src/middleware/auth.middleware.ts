/**
 * Authentication Middleware
 * Provides JWT verification, role-based access control, and resource ownership verification
 */

import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import authService, { TokenPayload } from '../services/auth.service';
import {
  Permission,
  UserRole,
  hasAnyPermission,
  resolvePermissions,
} from '../authorization/permissions';

/**
 * Extended Express Request with user information
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication error class
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Extract token from request headers or cookies
 */
function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (if using cookie-based authentication)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

async function hydrateUserContext(payload: TokenPayload): Promise<TokenPayload> {
  const user = await User.findById(payload.userId)
    .select('email role isActive isApproved permissionMode customPermissions')
    .lean()
    .exec();

  if (!user || !user.isActive) {
    throw new AuthenticationError('Account not found or inactive', 401);
  }

  if (user.role === UserRole.INSTRUCTOR && !user.isApproved) {
    throw new AuthenticationError('Account pending admin approval', 403);
  }

  return {
    ...payload,
    email: user.email,
    role: user.role,
    permissionMode: user.permissionMode,
    permissions: resolvePermissions({
      role: user.role,
      permissionMode: user.permissionMode,
      customPermissions: user.customPermissions,
    }),
  };
}

/**
 * Middleware: Authenticate user by verifying JWT token
 * Extracts token from Authorization header or cookies, verifies it, and attaches user info to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from request
    const token = extractToken(req);

    if (!token) {
      throw new AuthenticationError('Authentication required', 401);
    }

    // Verify token using auth service
    const payload = await authService.verifyToken(token);
    const hydratedPayload = await hydrateUserContext(payload);

    // Attach user information to request
    req.user = hydratedPayload;
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Handle token verification errors
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('expired')) {
        res.status(401).json({
          success: false,
          error: 'Token has expired',
        });
        return;
      }

      if (message.includes('invalid') || message.includes('revoked') || message.includes('Invalid')) {
        res.status(401).json({
          success: false,
          error: 'Invalid or revoked token',
        });
        return;
      }
    }

    // Generic authentication error
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Middleware factory: Require specific role(s) to access endpoint
 * Must be used after authenticate middleware
 * 
 * @param roles - Single role or array of roles allowed to access the endpoint
 * @returns Express middleware function
 * 
 * @example
 * router.get('/admin', authenticate, requireRole(UserRole.ADMIN), handler);
 * router.post('/course', authenticate, requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]), handler);
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

export const requirePermission = (permissions: Permission | Permission[]) => {
  const requiredPermissions = Array.isArray(permissions)
    ? permissions
    : [permissions];

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      if (!hasAnyPermission(req.user.permissions, requiredPermissions)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

/**
 * Resource ownership verification options
 */
export interface OwnershipOptions {
  /**
   * Parameter name containing the resource ID (default: 'id')
   */
  paramName?: string;
  
  /**
   * Field name in the resource document containing the owner ID (default: 'instructorId')
   */
  ownerField?: string;
  
  /**
   * Mongoose model to query for the resource
   */
  model: any;
  
  /**
   * Whether admins can bypass ownership check (default: true)
   */
  allowAdmin?: boolean;
}

/**
 * Middleware factory: Verify resource ownership
 * Checks if the authenticated user owns the requested resource
 * Must be used after authenticate middleware
 * 
 * @param options - Ownership verification options
 * @returns Express middleware function
 * 
 * @example
 * // Verify course ownership
 * router.put('/courses/:id', 
 *   authenticate, 
 *   requireOwnership({ model: Course, ownerField: 'instructorId' }),
 *   handler
 * );
 * 
 * // Verify user profile ownership
 * router.put('/users/:userId',
 *   authenticate,
 *   requireOwnership({ model: User, paramName: 'userId', ownerField: '_id' }),
 *   handler
 * );
 */
export const requireOwnership = (options: OwnershipOptions) => {
  const {
    paramName = 'id',
    ownerField = 'instructorId',
    model,
    allowAdmin = true,
  } = options;

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      // Allow admins to bypass ownership check
      if (allowAdmin && req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      // Get resource ID from request parameters
      const resourceId = req.params[paramName];
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: `Missing ${paramName} parameter`,
        });
        return;
      }

      // Query resource from database
      const resource = await model.findById(resourceId);
      if (!resource) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
        return;
      }

      // Get owner ID from resource
      const ownerId = resource[ownerField];
      if (!ownerId) {
        res.status(500).json({
          success: false,
          error: 'Resource ownership information missing',
        });
        return;
      }

      // Compare owner ID with authenticated user ID
      const ownerIdString = ownerId.toString();
      if (ownerIdString !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to access this resource',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }

      console.error('Ownership verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership verification failed',
      });
    }
  };
};

/**
 * Middleware factory: Verify user owns their own profile
 * Shorthand for requireOwnership with User model
 * 
 * @param paramName - Parameter name containing the user ID (default: 'id')
 * @returns Express middleware function
 * 
 * @example
 * router.put('/users/:id', authenticate, requireSelf(), handler);
 */
export const requireSelf = (paramName: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 401);
      }

      // Allow admins to bypass
      if (req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      // Get user ID from request parameters
      const targetUserId = req.params[paramName];
      if (!targetUserId) {
        res.status(400).json({
          success: false,
          error: `Missing ${paramName} parameter`,
        });
        return;
      }

      // Compare with authenticated user ID
      if (targetUserId !== req.user.userId) {
        res.status(403).json({
          success: false,
          error: 'You can only access your own profile',
        });
        return;
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 * 
 * @example
 * router.get('/courses', optionalAuth, handler);
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const payload = await authService.verifyToken(token);
        req.user = await hydrateUserContext(payload);
        req.token = token;
      } catch (error) {
        // Ignore token verification errors for optional auth
        // User will be treated as unauthenticated
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
