/**
 * User API service (admin-focused helpers)
 */

import apiRequest from './api';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserListFilters {
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  search?: string;
}

export interface UserListItem {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface BackendUserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface BackendListUsersResponse {
  success: boolean;
  data: BackendUserProfileDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListUsersResult {
  success: boolean;
  data: {
    users: UserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const normalizeUser = (raw: BackendUserProfileDTO): UserListItem => {
  return {
    _id: String(raw?.id ?? ''),
    email: raw?.email ?? '',
    firstName: raw?.firstName ?? '',
    lastName: raw?.lastName ?? '',
    role: raw?.role ?? 'student',
    isActive: Boolean(raw?.isActive),
    createdAt: raw?.createdAt ? String(raw.createdAt) : new Date().toISOString(),
  };
};

export const userService = {
  listUsers: async (filters: UserListFilters = {}, page = 1, limit = 20): Promise<ListUsersResult> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.isEmailVerified !== undefined)
      params.append('isEmailVerified', String(filters.isEmailVerified));
    if (filters.search) params.append('searchTerm', filters.search);

    const response = await apiRequest<BackendListUsersResponse>(`/users?${params.toString()}`);
    const rawUsers = Array.isArray(response?.data) ? response.data : [];

    const users = rawUsers.map(normalizeUser);

    return {
      success: Boolean(response?.success),
      data: {
        users,
        pagination: {
          page: Number(response?.page ?? page),
          limit: Number(response?.limit ?? limit),
          total: Number(response?.total ?? users.length),
          totalPages: Number(response?.totalPages ?? 1),
        },
      },
    };
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiRequest(`/users/${userId}`, { method: 'DELETE' });
  },
};

export default userService;

