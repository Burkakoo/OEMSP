/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import { authService, RegisterDTO, LoginDTO } from '../services/auth.service';
import { UserRole } from '../models/User';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName, role',
      });
      return;
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role. Must be student, instructor, or admin',
      });
      return;
    }

    const registerData: RegisterDTO = {
      email,
      password,
      firstName,
      lastName,
      role,
    };

    const result = await authService.register(registerData);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        requiresEmailVerification: result.requiresEmailVerification ?? true,
      },
    });
  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Verify email OTP code
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, code',
      });
      return;
    }

    const result = await authService.verifyEmailCode(email, code);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Email verification controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password',
      });
      return;
    }

    const loginData: LoginDTO = {
      email,
      password,
    };

    const result = await authService.login(loginData);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    // Set HTTP-only cookies for tokens
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const token = (req as any).token;

    if (!userId || !token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    await authService.logout(userId, token);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token not provided',
      });
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    // Set new HTTP-only cookies
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    console.error('Refresh token controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Request password reset OTP
 * POST /api/v1/auth/reset-password
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    await authService.resetPassword(email);

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset OTP has been sent',
    });
  } catch (error) {
    console.error('Password reset request controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Confirm password reset with OTP
 * POST /api/v1/auth/reset-password/confirm
 */
export const confirmPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: email, code, newPassword',
      });
      return;
    }

    const result = await authService.confirmPasswordReset(email, code, newPassword);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message || 'Password reset successful',
    });
  } catch (error) {
    console.error('Password reset confirm controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: oldPassword, newPassword',
      });
      return;
    }

    await authService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('incorrect') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Approve instructor (admin only)
 * POST /api/v1/auth/instructors/:id/approve
 */
export const approveInstructor = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.userId;
    const instructorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!instructorId) {
      res.status(400).json({
        success: false,
        error: 'Instructor ID is required',
      });
      return;
    }

    const instructor = await authService.approveInstructor(instructorId, adminId);

    res.status(200).json({
      success: true,
      message: 'Instructor approved successfully',
      instructor: {
        id: instructor._id,
        email: instructor.email,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        isApproved: instructor.isApproved,
        approvedAt: instructor.approvedAt,
      },
    });
  } catch (error) {
    console.error('Approve instructor controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Reject instructor (admin only)
 * POST /api/v1/auth/instructors/:id/reject
 */
export const rejectInstructor = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.userId;
    const instructorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!instructorId) {
      res.status(400).json({
        success: false,
        error: 'Instructor ID is required',
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
      return;
    }

    await authService.rejectInstructor(instructorId, adminId, reason);

    res.status(200).json({
      success: true,
      message: 'Instructor rejected successfully',
    });
  } catch (error) {
    console.error('Reject instructor controller error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Get pending instructors (admin only)
 * GET /api/v1/auth/instructors/pending
 */
export const getPendingInstructors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const instructors = await authService.getPendingInstructors();

    res.status(200).json({
      success: true,
      count: instructors.length,
      instructors: instructors.map(instructor => ({
        id: instructor._id,
        email: instructor.email,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        createdAt: instructor.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get pending instructors controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
