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
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { login, clearError } from '@store/slices/authSlice';
import { LoginCredentials } from '@/types/auth.types';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      onSuccess?.();
    } catch {
      // Redux handles the displayed error state.
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="primary.main">
            Sign in
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
            Access your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use your email and password to continue to your dashboard.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          required
          fullWidth
          id="email"
          label="Email address"
          name="email"
          placeholder="name@example.com"
          autoComplete="email"
          autoFocus
          value={formData.email}
          onChange={handleChange}
          error={!!validationErrors.email}
          helperText={validationErrors.email}
          disabled={isLoading}
        />

        <TextField
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          error={!!validationErrors.password}
          helperText={validationErrors.password}
          disabled={isLoading}
        />

        <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading}>
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
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
              onForgotPasswordClick?.();
            }}
            sx={{ cursor: 'pointer' }}
          >
            Forgot password?
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={(event) => {
              event.preventDefault();
              onRegisterClick?.();
            }}
            sx={{ cursor: 'pointer' }}
          >
            Need an account? Register
          </Link>
        </Stack>
      </Stack>
    </Box>
  );
};

export default LoginForm;
