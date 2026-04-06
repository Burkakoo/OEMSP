import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppDispatch';
import RegisterForm from '@components/auth/RegisterForm';
import AuthPageShell from '@components/auth/AuthPageShell';
import { getDashboardPath } from '@/utils/navigation';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardPath(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <AuthPageShell
      badge="Create account"
      title="Join the platform with a smoother start"
      description="Set up a student or instructor account, verify your email, and move straight into a dashboard designed for your role."
      highlights={[
        'Shorter registration flow with clear steps',
        'Email verification built directly into onboarding',
        'Student and instructor paths explained up front',
      ]}
      stats={[
        { value: '2', label: 'Available roles to get started' },
        { value: 'Minutes', label: 'Typical setup time' },
        { value: 'Simple', label: 'Guided verification flow' },
      ]}
    >
      <RegisterForm onLoginClick={() => navigate('/login')} />
    </AuthPageShell>
  );
};

export default RegisterPage;
