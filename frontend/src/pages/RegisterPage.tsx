/**
 * Register page
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Box } from '@mui/material';
import { useAppSelector } from '@hooks/useAppDispatch';
import RegisterForm from '@components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect authenticated users to their role-specific dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'instructor') {
        // Check if instructor is pending approval
        if (user.isApproved === false) {
          navigate('/pending-approval', { replace: true });
        } else {
          navigate('/instructor/dashboard', { replace: true });
        }
      } else if (user.role === 'student') {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSuccess = () => {
    // Navigation will be handled by the useEffect above
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <RegisterForm onSuccess={handleSuccess} onLoginClick={handleLoginClick} />
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
