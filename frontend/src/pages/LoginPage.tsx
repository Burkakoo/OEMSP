import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppDispatch';
import LoginForm from '@components/auth/LoginForm';
import AuthPageShell from '@components/auth/AuthPageShell';
import { getDashboardPath } from '@/utils/navigation';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardPath(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <AuthPageShell
      badge="Welcome back"
      title="Return to your learning space"
      description="Pick up your lessons, certificates, and dashboard work from a cleaner, simpler sign-in flow."
      highlights={[
        'Quick access to your role-based dashboard',
        'Fewer distractions between login and next action',
        'Better experience on mobile and desktop',
      ]}
      stats={[
        { value: '1', label: 'Sign in to access your dashboard' },
        { value: '24/7', label: 'Learn or manage courses anytime' },
        { value: 'Secure', label: 'Role-aware access and protection' },
      ]}
    >
      <LoginForm
        onRegisterClick={() => navigate('/register')}
        onForgotPasswordClick={() => navigate('/forgot-password')}
      />
    </AuthPageShell>
  );
};

export default LoginPage;
