/**
 * Forgot password page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Box } from '@mui/material';
import PasswordResetForm from '@components/auth/PasswordResetForm';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/login');
  };

  const handleBackToLogin = () => {
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
          <PasswordResetForm onSuccess={handleSuccess} onBackToLogin={handleBackToLogin} />
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
