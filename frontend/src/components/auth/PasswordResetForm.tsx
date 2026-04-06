import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
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

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      return false;
    }

    setEmailError('');
    return true;
  };

  const validateConfirmForm = (): boolean => {
    if (!code.trim()) {
      setCodeError('Enter the 6-digit OTP');
      return false;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('OTP must be a 6-digit code');
      return false;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
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

    setCodeError('');
    setPasswordError('');
    return true;
  };

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
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
    } catch (submissionError) {
      setError((submissionError as Error).message || 'Failed to send reset OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
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
      }, 1200);
    } catch (submissionError) {
      setError((submissionError as Error).message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <Box component="form" onSubmit={handleResetPassword} noValidate>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" color="primary.main">
              Confirm reset
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
              Finish resetting your password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the OTP sent to {email}, then choose your new password.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            required
            fullWidth
            id="code"
            label="OTP code"
            placeholder="123456"
            name="code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setCodeError('');
              setError(null);
            }}
            error={!!codeError}
            helperText={codeError}
            disabled={isLoading}
            autoFocus
          />

          <TextField
            required
            fullWidth
            name="newPassword"
            label="New password"
            placeholder="Create a new password"
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setPasswordError('');
              setError(null);
            }}
            error={!!passwordError}
            helperText={passwordError}
            disabled={isLoading}
          />

          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm new password"
            placeholder="Re-enter your new password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setPasswordError('');
              setError(null);
            }}
            error={!!passwordError}
            disabled={isLoading}
          />

          <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Reset password'}
          </Button>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Link
              component="button"
              variant="body2"
              onClick={(event) => {
                event.preventDefault();
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
            <Link
              component="button"
              variant="body2"
              onClick={(event) => {
                event.preventDefault();
                onBackToLogin?.();
              }}
              sx={{ cursor: 'pointer' }}
            >
              Back to login
            </Link>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleRequestReset} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="primary.main">
            Password recovery
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
            Request a reset code
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email address and we will send a 6-digit OTP to help you reset your password.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          required
          fullWidth
          id="email"
          label="Email address"
          name="email"
          placeholder="name@example.com"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
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
          size="large"
          disabled={isLoading || !!success}
        >
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Send OTP'}
        </Button>

        <Link
          component="button"
          variant="body2"
          onClick={(event) => {
            event.preventDefault();
            onBackToLogin?.();
          }}
          sx={{ cursor: 'pointer', alignSelf: 'flex-start' }}
        >
          Back to login
        </Link>
      </Stack>
    </Box>
  );
};

export default PasswordResetForm;
