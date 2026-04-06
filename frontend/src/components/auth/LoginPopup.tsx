/**
 * Login popup component
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { login, clearError } from '@store/slices/authSlice';
import { LoginCredentials } from '@/types/auth.types';

interface LoginPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

const LoginPopup: React.FC<LoginPopupProps> = ({
  open,
  onClose,
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
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error handled by Redux
    }
  };

  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setValidationErrors({});
    dispatch(clearError());
    onClose();
  };

  const handleRegisterClick = () => {
    handleClose();
    onRegisterClick?.();
  };

  const handleForgotPasswordClick = () => {
    handleClose();
    onForgotPasswordClick?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h1">
            Login
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
            value={formData.email}
            onChange={handleChange}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            disabled={isLoading}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            disabled={isLoading}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                handleForgotPasswordClick();
              }}
              sx={{ cursor: 'pointer' }}
            >
              Forgot password?
            </Link>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{ py: 1.5 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Login'}
        </Button>

        <Link
          component="button"
          variant="body2"
          onClick={(e) => {
            e.preventDefault();
            handleRegisterClick();
          }}
          sx={{ cursor: 'pointer', alignSelf: 'center' }}
        >
          Don't have an account? Register
        </Link>
      </DialogActions>
    </Dialog>
  );
};

export default LoginPopup;