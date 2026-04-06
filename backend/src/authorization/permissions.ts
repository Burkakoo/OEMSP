export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export enum PermissionMode {
  INHERIT = 'inherit',
  OVERRIDE = 'override',
}

export enum Permission {
  USERS_READ = 'users:read',
  USERS_MANAGE = 'users:manage',
  COURSES_READ = 'courses:read',
  COURSES_CREATE = 'courses:create',
  COURSES_EDIT_OWN = 'courses:edit:own',
  COURSES_EDIT_ANY = 'courses:edit:any',
  CONTENT_DOWNLOAD = 'content:download',
  CONTENT_UPLOAD = 'content:upload',
  ENROLLMENTS_READ = 'enrollments:read',
  ENROLLMENTS_MANAGE = 'enrollments:manage',
  QUIZZES_MANAGE = 'quizzes:manage',
  PAYMENTS_READ = 'payments:read',
  PAYMENTS_MANAGE = 'payments:manage',
  CERTIFICATES_DOWNLOAD = 'certificates:download',
  CERTIFICATES_MANAGE = 'certificates:manage',
  ANALYTICS_READ = 'analytics:read',
  AUDIT_LOGS_READ = 'audit-logs:read',
  PLATFORM_SETTINGS_MANAGE = 'platform-settings:manage',
  PRIVACY_REQUESTS_MANAGE = 'privacy-requests:manage',
  API_KEYS_MANAGE = 'api-keys:manage',
  WEBHOOKS_MANAGE = 'webhooks:manage',
  LMS_STANDARDS_MANAGE = 'lms-standards:manage',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export type PermissionCategory =
  | 'users'
  | 'courses'
  | 'content'
  | 'enrollments'
  | 'quizzes'
  | 'payments'
  | 'certificates'
  | 'analytics'
  | 'audit'
  | 'platform'
  | 'privacy'
  | 'integrations';

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
  category: PermissionCategory;
  defaultRoles: UserRole[];
}

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [
    Permission.COURSES_READ,
    Permission.CONTENT_DOWNLOAD,
    Permission.CERTIFICATES_DOWNLOAD,
  ],
  [UserRole.INSTRUCTOR]: [
    Permission.COURSES_READ,
    Permission.COURSES_CREATE,
    Permission.COURSES_EDIT_OWN,
    Permission.CONTENT_DOWNLOAD,
    Permission.CONTENT_UPLOAD,
    Permission.ENROLLMENTS_READ,
    Permission.QUIZZES_MANAGE,
    Permission.ANALYTICS_READ,
    Permission.CERTIFICATES_DOWNLOAD,
  ],
  [UserRole.ADMIN]: [...ALL_PERMISSIONS],
};

const PERMISSION_METADATA: Record<
  Permission,
  Omit<PermissionDefinition, 'defaultRoles' | 'key'>
> = {
  [Permission.USERS_READ]: {
    label: 'Read Users',
    description: 'View user profiles, user listings, and user-management screens.',
    category: 'users',
  },
  [Permission.USERS_MANAGE]: {
    label: 'Manage Users',
    description: 'Change user status, profile access privileges, and delegated access settings.',
    category: 'users',
  },
  [Permission.COURSES_READ]: {
    label: 'Read Courses',
    description: 'View course catalog data and course records.',
    category: 'courses',
  },
  [Permission.COURSES_CREATE]: {
    label: 'Create Courses',
    description: 'Create new course records and draft learning content.',
    category: 'courses',
  },
  [Permission.COURSES_EDIT_OWN]: {
    label: 'Edit Own Courses',
    description: 'Modify courses owned by the authenticated instructor.',
    category: 'courses',
  },
  [Permission.COURSES_EDIT_ANY]: {
    label: 'Edit Any Course',
    description: 'Modify courses across the entire platform, regardless of ownership.',
    category: 'courses',
  },
  [Permission.CONTENT_DOWNLOAD]: {
    label: 'Download Content',
    description: 'Access downloadable course attachments and related learning files.',
    category: 'content',
  },
  [Permission.CONTENT_UPLOAD]: {
    label: 'Upload Content',
    description: 'Upload lesson attachments and supporting learning materials.',
    category: 'content',
  },
  [Permission.ENROLLMENTS_READ]: {
    label: 'Read Enrollments',
    description: 'View enrollment records and learner-course access information.',
    category: 'enrollments',
  },
  [Permission.ENROLLMENTS_MANAGE]: {
    label: 'Manage Enrollments',
    description: 'Create, update, or revoke enrollments and related access rules.',
    category: 'enrollments',
  },
  [Permission.QUIZZES_MANAGE]: {
    label: 'Manage Quizzes',
    description: 'Create, update, and administer quizzes and related assessments.',
    category: 'quizzes',
  },
  [Permission.PAYMENTS_READ]: {
    label: 'Read Payments',
    description: 'View payment records and finance-related transaction history.',
    category: 'payments',
  },
  [Permission.PAYMENTS_MANAGE]: {
    label: 'Manage Payments',
    description: 'Process refunds and operate payment-related workflows.',
    category: 'payments',
  },
  [Permission.CERTIFICATES_DOWNLOAD]: {
    label: 'Download Certificates',
    description: 'Access issued certificate files.',
    category: 'certificates',
  },
  [Permission.CERTIFICATES_MANAGE]: {
    label: 'Manage Certificates',
    description: 'Issue, configure, and administer certificates and templates.',
    category: 'certificates',
  },
  [Permission.ANALYTICS_READ]: {
    label: 'Read Analytics',
    description: 'View platform, instructor, or learner analytics dashboards.',
    category: 'analytics',
  },
  [Permission.AUDIT_LOGS_READ]: {
    label: 'Read Audit Logs',
    description: 'Review sensitive audit history and operational trace records.',
    category: 'audit',
  },
  [Permission.PLATFORM_SETTINGS_MANAGE]: {
    label: 'Manage Platform Settings',
    description: 'Update platform-level configuration and operational settings.',
    category: 'platform',
  },
  [Permission.PRIVACY_REQUESTS_MANAGE]: {
    label: 'Manage Privacy Requests',
    description: 'Review and fulfill GDPR-style privacy, export, and deletion requests.',
    category: 'privacy',
  },
  [Permission.API_KEYS_MANAGE]: {
    label: 'Manage API Keys',
    description: 'Create, rotate, and revoke integration API credentials.',
    category: 'integrations',
  },
  [Permission.WEBHOOKS_MANAGE]: {
    label: 'Manage Webhooks',
    description: 'Configure webhook endpoints, secrets, and delivery settings.',
    category: 'integrations',
  },
  [Permission.LMS_STANDARDS_MANAGE]: {
    label: 'Manage LMS Standards',
    description: 'Administer SCORM, xAPI, and related learning-standard integrations.',
    category: 'integrations',
  },
};

export interface PermissionSubject {
  role: UserRole;
  permissionMode?: PermissionMode;
  customPermissions?: Permission[] | string[];
}

export function isPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.includes(value as Permission);
}

export function normalizePermissions(
  permissions: Permission[] | string[] | undefined
): Permission[] {
  if (!permissions || permissions.length === 0) {
    return [];
  }

  const normalized: Permission[] = [];

  for (const permission of permissions) {
    if (isPermission(permission) && !normalized.includes(permission)) {
      normalized.push(permission);
    }
  }

  return normalized;
}

export function getDefaultPermissionsForRole(role: UserRole): Permission[] {
  return [...(ROLE_DEFAULT_PERMISSIONS[role] ?? [])];
}

export function getDefaultRolesForPermission(permission: Permission): UserRole[] {
  return (Object.values(UserRole) as UserRole[]).filter((role) =>
    getDefaultPermissionsForRole(role).includes(permission)
  );
}

export function getPermissionCatalog(): PermissionDefinition[] {
  return ALL_PERMISSIONS.map((permission) => ({
    key: permission,
    ...PERMISSION_METADATA[permission],
    defaultRoles: getDefaultRolesForPermission(permission),
  }));
}

export function resolvePermissions(subject: PermissionSubject): Permission[] {
  const mode = subject.permissionMode ?? PermissionMode.INHERIT;
  const customPermissions = normalizePermissions(subject.customPermissions);

  if (mode === PermissionMode.OVERRIDE) {
    return customPermissions;
  }

  return normalizePermissions([
    ...getDefaultPermissionsForRole(subject.role),
    ...customPermissions,
  ]);
}

export function hasPermission(
  permissions: Permission[] | string[] | undefined,
  requiredPermission: Permission
): boolean {
  return normalizePermissions(permissions).includes(requiredPermission);
}

export function hasAnyPermission(
  permissions: Permission[] | string[] | undefined,
  requiredPermissions: Permission | Permission[]
): boolean {
  const normalizedPermissions = normalizePermissions(permissions);
  const required = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return required.some((permission) => normalizedPermissions.includes(permission));
}
