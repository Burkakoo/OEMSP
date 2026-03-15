/**
 * Password reset form component
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { requestPasswordReset, resetPassword } from '@store/slices/authSlice';

interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  token,
  onSuccess,
  onBackToLogin,
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Request reset state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePasswords = (): boolean => {
    if (!newPassword) {
      setPasswordError('Password is required');
      return false;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      const message = await dispatch(requestPasswordReset({ email })).unwrap();
      setSuccess(message);
    } catch (err) {
      setError((err as Error).message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validatePasswords()) {
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      const message = await dispatch(resetPassword({ token, newPassword })).unwrap();
      setSuccess(message);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError((err as Error).message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (token) {
    // Reset password form
    return (
      <Box component="form" onSubmit={handleResetPassword} noValidate>
        <Typography variant="h5" component="h1" gutterBottom>
          Reset Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          label="New Password"
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setPasswordError('');
            setError(null);
          }}
          error={!!passwordError}
          helperText={passwordError}
          disabled={isLoading || !!success}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setPasswordError('');
            setError(null);
          }}
          error={!!passwordError}
          disabled={isLoading || !!success}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading || !!success}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onBackToLogin?.();
            }}
            sx={{ cursor: 'pointer' }}
          >
            Back to Login
          </Link>
        </Box>
      </Box>
    );
  }

  // Request reset form
  return (
    <Box component="form" onSubmit={handleRequestReset} noValidate>
      <Typography variant="h5" component="h1" gutterBottom>
        Forgot Password
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your email address and we'll send you a link to reset your password.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError('');
          setError(null);
        }}
        error={!!emailError}
        helperText={emailError}
        disabled={isLoading || !!success}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading || !!success}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={(e) => {
            e.preventDefault();
            onBackToLogin?.();
          }}
          sx={{ cursor: 'pointer' }}
        >
          Back to Login
        </Link>
      </Box>
    </Box>
  );
};

export default PasswordResetForm;
