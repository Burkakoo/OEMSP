/**
 * Authentication Service
 * Handles user authentication, authorization, JWT token management, and instructor approval workflow
 */

import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/User';
import { env } from '../config/env.config';
import * as redis from '../config/redis.config';

// DTOs and Interfaces
export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: UserProfile;
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isApproved: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Authentication Service Interface
 */
export interface IAuthService {
  register(userData: RegisterDTO): Promise<AuthResponse>;
  login(credentials: LoginDTO): Promise<AuthResponse>;
  logout(userId: string, token: string): Promise<void>;
  verifyToken(token: string): Promise<TokenPayload>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  resetPassword(email: string): Promise<void>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  approveInstructor(instructorId: string, adminId: string): Promise<IUser>;
  rejectInstructor(instructorId: string, adminId: string, reason: string): Promise<void>;
  getPendingInstructors(): Promise<IUser[]>;
}

/**
 * Authentication Service Implementation
 */
class AuthService implements IAuthService {
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:token:';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:token:';
  private readonly ACCESS_TOKEN_EXPIRY = '24h';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Register a new user
   */
  async register(userData: RegisterDTO): Promise<AuthResponse> {
    try {
      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Validate password strength
      const passwordValidation = User.validatePasswordStrength(userData.password);
      if (!passwordValidation.valid) {
        return { 
          success: false, 
          error: passwordValidation.errors.join(', ') 
        };
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Create new user
      const user = new User({
        email: userData.email.toLowerCase(),
        passwordHash: userData.password, // Will be hashed by pre-save hook
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
        isEmailVerified: false,
        // isApproved defaults based on role (false for instructors, true for others)
      });

      await user.save();

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token in Redis
      await this.storeRefreshToken(user._id.toString(), refreshToken);

      return {
        success: true,
        token,
        refreshToken,
        user: this.mapUserToProfile(user),
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(credentials: LoginDTO): Promise<AuthResponse> {
    try {
      // Validate input format
      if (!this.isValidEmail(credentials.email)) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (credentials.password.length < 8) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Find user by email
      const user = await User.findOne({ email: credentials.email.toLowerCase() });
      if (!user) {
        // Generic error to prevent user enumeration
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is active
      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Check if instructor is approved
      if (user.role === UserRole.INSTRUCTOR && !user.isApproved) {
        return { success: false, error: 'Account pending admin approval' };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token in Redis
      await this.storeRefreshToken(user._id.toString(), refreshToken);

      // Update last login timestamp
      await User.updateOne(
        { _id: user._id },
        { lastLoginAt: new Date() }
      );

      return {
        success: true,
        token,
        refreshToken,
        user: this.mapUserToProfile(user),
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Authentication failed' 
      };
    }
  }

  /**
   * Logout user and blacklist token
   */
  async logout(userId: string, token: string): Promise<void> {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token');
      }

      // Calculate TTL (time until token expires)
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        // Blacklist the token in Redis
        const blacklistKey = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
        await redis.set(blacklistKey, userId, ttl);
      }

      // Remove refresh token
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
      await redis.del(refreshKey);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const blacklistKey = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
      const isBlacklisted = await redis.exists(blacklistKey);
      
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Verify token signature and expiration
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken, 
        env.REFRESH_TOKEN_SECRET
      ) as RefreshTokenPayload;

      // Check if refresh token exists in Redis
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${payload.userId}`;
      const storedToken = await redis.get(refreshKey);

      if (!storedToken || storedToken !== refreshToken) {
        return { success: false, error: 'Invalid refresh token' };
      }

      // Get user
      const user = await User.findById(payload.userId);
      if (!user || !user.isActive) {
        return { success: false, error: 'User not found or inactive' };
      }

      // Check instructor approval
      if (user.role === UserRole.INSTRUCTOR && !user.isApproved) {
        return { success: false, error: 'Account pending admin approval' };
      }

      // Generate new tokens (token rotation)
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Store new refresh token
      await this.storeRefreshToken(user._id.toString(), newRefreshToken);

      return {
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: this.mapUserToProfile(user),
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return { 
        success: false, 
        error: 'Token refresh failed' 
      };
    }
  }

  /**
   * Initiate password reset
   * Implements rate limiting: 3 requests per hour per email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        // Don't reveal validation errors (security)
        return;
      }

      const normalizedEmail = email.toLowerCase();

      // Check rate limit: 3 requests per hour per email
      const rateLimitKey = `password:reset:ratelimit:${normalizedEmail}`;
      const requestCount = await redis.get(rateLimitKey);
      
      if (requestCount && parseInt(requestCount) >= 3) {
        // Don't reveal rate limit to prevent information disclosure
        return;
      }

      const user = await User.findOne({ email: normalizedEmail });
      
      // Don't reveal if user exists (security)
      if (!user) {
        // Still increment rate limit counter to prevent email enumeration
        await this.incrementResetRateLimit(rateLimitKey);
        return;
      }

      // Check if user account is active
      if (!user.isActive) {
        return;
      }

      // Generate password reset token (1 hour expiration)
      const resetToken = jwt.sign(
        { 
          userId: user._id.toString(), 
          email: user.email,
          type: 'password_reset' 
        },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store reset token in Redis with 1 hour expiration (3600 seconds)
      const resetKey = `password:reset:${user._id}`;
      await redis.set(resetKey, resetToken, 3600);

      // Increment rate limit counter (1 hour expiration)
      await this.incrementResetRateLimit(rateLimitKey);

      // TODO: Send password reset email with token
      // Email should contain a link like: https://domain.com/reset-password?token={resetToken}
      console.log(`Password reset token for ${email}: ${resetToken}`);
    } catch (error) {
      console.error('Password reset error:', error);
      // Don't throw error to prevent information disclosure
      // Silently fail from user perspective
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string, 
    oldPassword: string, 
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isPasswordValid = await user.comparePassword(oldPassword);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = User.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save hook
      await user.save();

      // Invalidate all existing tokens for this user
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
      await redis.del(refreshKey);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Approve instructor account (admin only)
   */
  async approveInstructor(instructorId: string, adminId: string): Promise<IUser> {
    try {
      // Get instructor
      const instructor = await User.findById(instructorId);
      if (!instructor) {
        throw new Error('Instructor not found');
      }

      if (instructor.role !== UserRole.INSTRUCTOR) {
        throw new Error('User is not an instructor');
      }

      if (instructor.isApproved) {
        throw new Error('Instructor is already approved');
      }

      // Update instructor approval status
      instructor.isApproved = true;
      instructor.approvedBy = adminId as any;
      instructor.approvedAt = new Date();
      await instructor.save();

      // TODO: Send approval notification email to instructor
      console.log(`Instructor ${instructor.email} approved by admin ${adminId}`);

      return instructor;
    } catch (error) {
      console.error('Approve instructor error:', error);
      throw error;
    }
  }

  /**
   * Reject instructor account (admin only)
   */
  async rejectInstructor(
    instructorId: string, 
    adminId: string, 
    reason: string
  ): Promise<void> {
    try {
      // Get instructor
      const instructor = await User.findById(instructorId);
      if (!instructor) {
        throw new Error('Instructor not found');
      }

      if (instructor.role !== UserRole.INSTRUCTOR) {
        throw new Error('User is not an instructor');
      }

      // Deactivate the account
      instructor.isActive = false;
      await instructor.save();

      // TODO: Send rejection notification email with reason
      console.log(`Instructor ${instructor.email} rejected by admin ${adminId}. Reason: ${reason}`);
    } catch (error) {
      console.error('Reject instructor error:', error);
      throw error;
    }
  }

  /**
   * Get list of pending instructor approvals (admin only)
   */
  async getPendingInstructors(): Promise<IUser[]> {
    try {
      const pendingInstructors = await User.find({
        role: UserRole.INSTRUCTOR,
        isApproved: false,
        isActive: true,
      }).sort({ createdAt: -1 });

      return pendingInstructors;
    } catch (error) {
      console.error('Get pending instructors error:', error);
      throw new Error('Failed to fetch pending instructors');
    }
  }

  // Private helper methods

  /**
   * Generate JWT access token
   */
  private generateAccessToken(user: IUser): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
    };

    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${userId}`;
    // 7 days in seconds
    const ttl = 7 * 24 * 60 * 60;
    await redis.set(key, token, ttl);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Map User document to UserProfile
   */
  private mapUserToProfile(user: IUser): UserProfile {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isApproved: user.isApproved,
    };
  }

  /**
   * Increment password reset rate limit counter
   * Sets 1 hour expiration on first request
   */
  private async incrementResetRateLimit(rateLimitKey: string): Promise<void> {
    const currentCount = await redis.get(rateLimitKey);
    
    if (!currentCount) {
      // First request - set counter to 1 with 1 hour TTL (3600 seconds)
      await redis.set(rateLimitKey, '1', 3600);
    } else {
      // Increment counter (Redis INCR would be better but using set for consistency)
      const newCount = parseInt(currentCount) + 1;
      // Get remaining TTL to preserve it
      const ttl = await redis.ttl(rateLimitKey);
      await redis.set(rateLimitKey, newCount.toString(), ttl > 0 ? ttl : 3600);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
