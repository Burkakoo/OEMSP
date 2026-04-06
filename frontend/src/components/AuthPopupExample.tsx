/**
 * Example component showing how to use LoginPopup and RegisterPopup
 */

import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { LoginPopup, RegisterPopup } from './auth';

const AuthPopupExample: React.FC = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const handleLoginSuccess = () => {
    console.log('Login successful!');
    // Handle successful login (e.g., redirect, update state)
  };

  const handleRegisterSuccess = () => {
    console.log('Registration successful!');
    // Handle successful registration (e.g., redirect, update state)
  };

  const handleSwitchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Authentication Example
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setLoginOpen(true)}
        >
          Login
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={() => setRegisterOpen(true)}
        >
          Register
        </Button>
      </Box>

      <LoginPopup
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onRegisterClick={handleSwitchToRegister}
        onForgotPasswordClick={() => console.log('Forgot password clicked')}
      />

      <RegisterPopup
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
        onLoginClick={handleSwitchToLogin}
      />
    </Box>
  );
};

export default AuthPopupExample;