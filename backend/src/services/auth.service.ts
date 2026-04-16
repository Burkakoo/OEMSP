/**
 * Authentication Service
 * Handles user authentication, authorization, JWT token management, and instructor approval workflow
 */

import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { env } from '../config/env.config';
import * as redis from '../config/redis.config';
import { sendTemplateEmail } from './email.service';
import {
  Permission,
  PermissionMode,
  UserRole,
  resolvePermissions,
} from '../authorization/permissions';

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
  message?: string;
  email?: string;
  requiresEmailVerification?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isApproved: boolean;
  permissionMode: PermissionMode;
  permissions: Permission[];
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
  permissionMode?: PermissionMode;
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
  confirmPasswordReset(email: string, code: string, newPassword: string): Promise<AuthResponse>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  approveInstructor(instructorId: string, adminId: string): Promise<IUser>;
  rejectInstructor(instructorId: string, adminId: string, reason: string): Promise<void>;
  getPendingInstructors(): Promise<IUser[]>;
  verifyEmailCode(email: string, code: string): Promise<AuthResponse>;
}

/**
 * Authentication Service Implementation
 */
class AuthService implements IAuthService {
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:token:';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:token:';
  private readonly PASSWORD_RESET_CODE_PREFIX = 'password:reset:code:';
  private readonly ACCESS_TOKEN_EXPIRY = '24h';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly EMAIL_VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly PASSWORD_RESET_CODE_TTL_SECONDS = 15 * 60; // 15 minutes

  private generateVerificationCode(): string {
    // 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendVerificationEmail(user: IUser): Promise<void> {
    const code = user.emailVerificationCode;
    if (!user.email || !code) return;

    const result = await sendTemplateEmail(user.email, 'verifyEmail', {
      firstName: user.firstName,
      code,
    });

    if (!result.success) {
      throw new Error('Failed to send verification OTP email');
    }
  }

  private async sendPasswordResetCodeEmail(user: IUser, code: string): Promise<void> {
    if (!user.email) return;

    const result = await sendTemplateEmail(user.email, 'passwordResetOtp', {
      firstName: user.firstName,
      code,
    });

    if (!result.success) {
      throw new Error('Failed to send password reset OTP email');
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterDTO): Promise<AuthResponse> {
    try {
      const normalizedEmail = userData.email.trim().toLowerCase();

      // Validate email format
      if (!this.isValidEmail(normalizedEmail)) {
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
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Create new user
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Create new user
      const verificationCode = this.generateVerificationCode();
      const verificationExpires = new Date(Date.now() + this.EMAIL_VERIFICATION_CODE_TTL_MS);

      const user = new User({
        email: normalizedEmail,
        passwordHash: userData.password, // Will be hashed by pre-save hook
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
        isEmailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpiresAt: verificationExpires,
      });

      await user.save();

      // Send verification email (best effort)
      try {
        console.log(`[DEBUG] Email verification code generated for ${user.email}: ${verificationCode}`);
        await this.sendVerificationEmail(user);
      } catch (err) {
        console.error('Failed to send verification email:', err);
      }

      return {
        success: true,
        message: 'Registration successful. Please verify your email with the OTP sent to your inbox.',
        email: user.email,
        requiresEmailVerification: true,
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
      const normalizedEmail = credentials.email.trim().toLowerCase();
      const normalizedPassword = credentials.password.trim();

      // Validate input format
      if (!this.isValidEmail(normalizedEmail)) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (normalizedPassword.length < 8) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Find user by email
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Generic error to prevent user enumeration
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if account is active
      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          error: 'Email not verified. Please check your inbox for the verification code.',
        };
      }

      // Check if instructor is approved
      if (user.role === UserRole.INSTRUCTOR && !user.isApproved) {
        return { success: false, error: 'Account pending admin approval' };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(normalizedPassword);
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
   * Verify email OTP code
   */
  async verifyEmailCode(email: string, code: string): Promise<AuthResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCode = code.trim();

      if (!this.isValidEmail(normalizedEmail) || !normalizedCode) {
        return { success: false, error: 'Invalid request' };
      }

      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return { success: false, error: 'Invalid verification code' };
      }

      if (user.isEmailVerified) {
        return { success: true, error: 'Email already verified' };
      }

      if (!user.emailVerificationCode || !user.emailVerificationCodeExpiresAt) {
        return { success: false, error: 'Verification code not found. Please request a new one.' };
      }

      if (new Date() > user.emailVerificationCodeExpiresAt) {
        return { success: false, error: 'Verification code has expired. Please request a new one.' };
      }

      if (user.emailVerificationCode !== normalizedCode) {
        return { success: false, error: 'Invalid verification code' };
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationCodeExpiresAt = undefined;
      await user.save();

      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Verification failed' };
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

      // Block token refresh for unverified users
      if (!user.isEmailVerified) {
        return { success: false, error: 'Email not verified. Please verify your email first.' };
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
      const normalizedEmail = email.trim().toLowerCase();

      // Validate email format
      if (!this.isValidEmail(normalizedEmail)) {
        // Don't reveal validation errors (security)
        return;
      }

      // Check rate limit: 3 requests per hour per email
      const rateLimitKey = `password:reset:ratelimit:${normalizedEmail}`;
      const requestCount = await redis.get(rateLimitKey);
      
      if (requestCount && parseInt(requestCount, 10) >= 3) {
        // Don't reveal rate limit to prevent information disclosure
        return;
      }

      const user = await User.findOne({ email: normalizedEmail });
      
      // Don't reveal if user exists (security)
      if (!user || !user.isActive) {
        await this.incrementResetRateLimit(rateLimitKey);
        return;
      }

      const code = this.generateVerificationCode();
      const resetCodeKey = `${this.PASSWORD_RESET_CODE_PREFIX}${normalizedEmail}`;

      // Store OTP in Redis with 15-minute expiry
      await redis.set(resetCodeKey, code, this.PASSWORD_RESET_CODE_TTL_SECONDS);
      await this.incrementResetRateLimit(rateLimitKey);

      // Send OTP email (best effort)
      try {
        console.log(`[DEBUG] Password reset code generated for ${normalizedEmail}: ${code}`);
        await this.sendPasswordResetCodeEmail(user, code);
      } catch (err) {
        console.error('Failed to send password reset OTP email:', err);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      // Don't throw error to prevent information disclosure
      // Silently fail from user perspective
    }
  }

  /**
   * Confirm password reset using OTP
   */
  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<AuthResponse> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCode = code.trim();
      const normalizedNewPassword = newPassword.trim();

      if (!this.isValidEmail(normalizedEmail) || !normalizedCode || !normalizedNewPassword) {
        return { success: false, error: 'Invalid request' };
      }
      const user = await User.findOne({ email: normalizedEmail });

      if (!user || !user.isActive) {
        return { success: false, error: 'Invalid or expired reset code' };
      }

      const resetCodeKey = `${this.PASSWORD_RESET_CODE_PREFIX}${normalizedEmail}`;
      const storedCode = await redis.get(resetCodeKey);

      if (!storedCode || storedCode !== normalizedCode) {
        return { success: false, error: 'Invalid or expired reset code' };
      }

      const passwordValidation = User.validatePasswordStrength(normalizedNewPassword);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      // Update password (hashed by model pre-save hook)
      user.passwordHash = normalizedNewPassword;
      await user.save();

      // Invalidate OTP and active refresh sessions
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${user._id.toString()}`;
      await redis.del(resetCodeKey, refreshKey);

      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return { success: false, error: 'Password reset failed' };
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
      permissionMode: user.permissionMode ?? PermissionMode.INHERIT,
      permissions: resolvePermissions({
        role: user.role,
        permissionMode: user.permissionMode,
        customPermissions: user.customPermissions,
      }),
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
      const newCount = parseInt(currentCount, 10) + 1;
      // Get remaining TTL to preserve it
      const ttl = await redis.ttl(rateLimitKey);
      await redis.set(rateLimitKey, newCount.toString(), ttl > 0 ? ttl : 3600);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
