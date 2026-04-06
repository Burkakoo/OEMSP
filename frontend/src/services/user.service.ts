/**
 * User API service (admin-focused helpers)
 */

import apiRequest from './api';

export type UserRole = 'student' | 'instructor' | 'admin';
export type PermissionMode = 'inherit' | 'override';

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
  permissionMode?: PermissionMode;
  customPermissions?: string[];
  permissions?: string[];
  createdAt: string;
}

interface BackendUserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  permissionMode?: PermissionMode;
  customPermissions?: string[];
  permissions?: string[];
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

export interface PermissionCatalogItem {
  key: string;
  label: string;
  description: string;
  category: string;
  defaultRoles: UserRole[];
}

export interface RolePermissionDefaults {
  role: UserRole;
  defaultPermissions: string[];
}

interface BackendPermissionCatalogResponse {
  success: boolean;
  data: {
    permissions: PermissionCatalogItem[];
    roleDefaults: RolePermissionDefaults[];
  };
}

export interface PermissionCatalogResult {
  permissions: PermissionCatalogItem[];
  roleDefaults: RolePermissionDefaults[];
}

export interface UpdateUserPermissionsPayload {
  permissionMode?: PermissionMode;
  customPermissions?: string[];
}

const normalizeUser = (raw: BackendUserProfileDTO): UserListItem => {
  return {
    _id: String(raw?.id ?? ''),
    email: raw?.email ?? '',
    firstName: raw?.firstName ?? '',
    lastName: raw?.lastName ?? '',
    role: raw?.role ?? 'student',
    isActive: Boolean(raw?.isActive),
    permissionMode: raw?.permissionMode,
    customPermissions: Array.isArray(raw?.customPermissions) ? raw.customPermissions : [],
    permissions: Array.isArray(raw?.permissions) ? raw.permissions : [],
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

  setUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
    await apiRequest(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  getPermissionCatalog: async (): Promise<PermissionCatalogResult> => {
    const response = await apiRequest<BackendPermissionCatalogResponse>(
      '/users/permissions/catalog'
    );

    return {
      permissions: Array.isArray(response?.data?.permissions)
        ? response.data.permissions
        : [],
      roleDefaults: Array.isArray(response?.data?.roleDefaults)
        ? response.data.roleDefaults
        : [],
    };
  },

  updateUserPermissions: async (
    userId: string,
    payload: UpdateUserPermissionsPayload
  ): Promise<void> => {
    await apiRequest(`/users/${userId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};

export default userService;
