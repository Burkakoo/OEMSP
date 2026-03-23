/**
 * Authentication API service
 */

import apiRequest from './api';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  RegisterResponse,
  VerifyEmailData,
  PasswordResetRequest,
  PasswordResetData,
} from '@/types/auth.types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmail: async (data: VerifyEmailData): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
    });
  },

  refreshToken: async (): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
  },

  requestPasswordReset: async (data: PasswordResetRequest): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetPassword: async (data: PasswordResetData): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/auth/reset-password/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
