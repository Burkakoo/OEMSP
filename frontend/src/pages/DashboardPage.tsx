/**
 * Dashboard page - redirects to role-specific dashboard
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppDispatch';

const DashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Redirect to role-specific dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'instructor') {
    return <Navigate to="/instructor/dashboard" replace />;
  } else if (user?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  // Fallback to login if no user
  return <Navigate to="/login" replace />;
};

export default DashboardPage;
