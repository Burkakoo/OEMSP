/**
 * Password reset form component (OTP flow)
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
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onSuccess, onBackToLogin }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'confirm'>('request');

  // Shared state
  const [email, setEmail] = useState('');

  // Request OTP state
  const [emailError, setEmailError] = useState('');

  // Confirm reset state
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState('');
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

  const validateConfirmForm = (): boolean => {
    if (!code.trim()) {
      setCodeError('OTP code is required');
      return false;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('OTP must be a 6-digit code');
      return false;
    }
    setCodeError('');

    if (!newPassword) {
      setPasswordError('Password is required');
      return false;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
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
      setSuccess(message || 'If the email exists, an OTP has been sent.');
      setStep('confirm');
    } catch (err) {
      setError((err as Error).message || 'Failed to send reset OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateEmail() || !validateConfirmForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const message = await dispatch(
        resetPassword({
          email,
          code: code.trim(),
          newPassword,
        })
      ).unwrap();
      setSuccess(message || 'Password reset successful');
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <Box component="form" onSubmit={handleResetPassword} noValidate>
        <Typography variant="h5" component="h1" gutterBottom>
          Reset Password
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the OTP sent to {email}, then set your new password.
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
          id="code"
          label="OTP Code"
          placeholder="Enter 6-digit OTP"
          name="code"
          value={code}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setCode(e.target.value);
            setCodeError('');
            setError(null);
          }}
          error={!!codeError}
          helperText={codeError}
          disabled={isLoading}
          autoFocus
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          label="New Password"
          placeholder="Enter new password"
          type="password"
          id="newPassword"
          value={newPassword}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setPasswordError('');
            setError(null);
          }}
          error={!!passwordError}
          helperText={passwordError}
          disabled={isLoading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm new password"
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setPasswordError('');
            setError(null);
          }}
          error={!!passwordError}
          disabled={isLoading}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              setStep('request');
              setCode('');
              setNewPassword('');
              setConfirmPassword('');
              setCodeError('');
              setPasswordError('');
              setError(null);
              setSuccess(null);
            }}
            sx={{ cursor: 'pointer' }}
          >
            Use a different email
          </Link>
        </Box>

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

  return (
    <Box component="form" onSubmit={handleRequestReset} noValidate>
      <Typography variant="h5" component="h1" gutterBottom>
        Forgot Password
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your email address and we will send a 6-digit OTP to reset your password.
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
        {isLoading ? <CircularProgress size={24} /> : 'Send OTP'}
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
