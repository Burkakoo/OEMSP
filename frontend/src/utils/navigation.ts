import type { User } from '@/types/auth.types';

type NavigableUser = Pick<User, 'role' | 'isApproved'> | null | undefined;

export const getDashboardPath = (user: NavigableUser): string => {
  if (!user) {
    return '/login';
  }

  if (user.role === 'admin') {
    return '/admin/dashboard';
  }

  if (user.role === 'instructor') {
    return user.isApproved === false ? '/pending-approval' : '/instructor/dashboard';
  }

  return '/student/dashboard';
};

export const canAccessCatalog = (user: NavigableUser): boolean => !user || user.role !== 'instructor';

export const getRoleLabel = (user: NavigableUser): string => {
  if (!user) {
    return 'Guest';
  }

  if (user.role === 'admin') {
    return 'Administrator';
  }

  if (user.role === 'instructor') {
    return user.isApproved === false ? 'Instructor Review' : 'Instructor';
  }

  return 'Student';
};
