import React from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordResetForm from '@components/auth/PasswordResetForm';
import AuthPageShell from '@components/auth/AuthPageShell';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthPageShell
      badge="Password help"
      title="Reset your password without confusion"
      description="Request a one-time code, confirm your identity, and get back into your account with a simpler recovery flow."
      highlights={[
        'OTP-based reset flow in one guided screen',
        'Clear steps for requesting and confirming reset',
        'Fast return path back to login',
      ]}
      stats={[
        { value: '6', label: 'Digits in the recovery code' },
        { value: '1', label: 'Recovery flow from request to reset' },
        { value: 'Safe', label: 'Protected account recovery process' },
      ]}
    >
      <PasswordResetForm
        onSuccess={() => navigate('/login')}
        onBackToLogin={() => navigate('/login')}
      />
    </AuthPageShell>
  );
};

export default ForgotPasswordPage;
