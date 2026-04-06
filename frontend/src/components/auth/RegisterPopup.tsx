/**
 * Register popup component
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { register, verifyEmail, login, clearError } from '@store/slices/authSlice';
import { RegisterData } from '@/types/auth.types';

interface RegisterPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

const RegisterPopup: React.FC<RegisterPopupProps> = ({
  open,
  onClose,
  onSuccess,
  onLoginClick,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const validateRegistrationForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateVerificationForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!verificationCode.trim()) {
      errors.verificationCode = 'OTP code is required';
    } else if (!/^\d{6}$/.test(verificationCode.trim())) {
      errors.verificationCode = 'OTP must be a 6-digit code';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearMessages = () => {
    setLocalError(null);
    setSuccessMessage(null);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev: RegisterData) => ({ ...prev, [name]: value as string }));
      if (validationErrors[name]) {
        setValidationErrors((prev: Record<string, string>) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
    clearMessages();
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (validationErrors.confirmPassword) {
      setValidationErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
    clearMessages();
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
    if (validationErrors.verificationCode) {
      setValidationErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors.verificationCode;
        return newErrors;
      });
    }
    clearMessages();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!validateRegistrationForm()) {
      return;
    }

    try {
      await dispatch(register(formData)).unwrap();
      setSuccessMessage('Registration successful! Please check your email for verification code.');
      setIsVerificationStep(true);
    } catch (err) {
      setLocalError('Registration failed. Please try again.');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!validateVerificationForm()) {
      return;
    }

    try {
      await dispatch(verifyEmail({
        email: formData.email,
        code: verificationCode.trim(),
      })).unwrap();

      // Auto-login after verification
      await dispatch(login({
        email: formData.email,
        password: formData.password,
      })).unwrap();

      onSuccess?.();
      handleClose();
    } catch (err) {
      setLocalError('Verification failed. Please check your code and try again.');
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'student',
    });
    setConfirmPassword('');
    setVerificationCode('');
    setIsVerificationStep(false);
    setLocalError(null);
    setSuccessMessage(null);
    setValidationErrors({});
    dispatch(clearError());
    onClose();
  };

  const handleLoginClick = () => {
    handleClose();
    onLoginClick?.();
  };

  const handleBackToRegistration = () => {
    setIsVerificationStep(false);
    setLocalError(null);
    setSuccessMessage(null);
    setValidationErrors({});
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
            {isVerificationStep ? 'Verify Email' : 'Register'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!isVerificationStep ? (
          <Box component="form" onSubmit={handleRegisterSubmit} noValidate sx={{ mt: 1 }}>
            {(error || localError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || localError}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={formData.firstName}
              onChange={handleChange}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              disabled={isLoading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              disabled={isLoading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              disabled={isLoading}
            />

            <FormControl
              fullWidth
              margin="normal"
              error={!!validationErrors.role}
              disabled={isLoading}
            >
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleChange}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
              </Select>
              {validationErrors.role && (
                <FormHelperText>{validationErrors.role}</FormHelperText>
              )}
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              disabled={isLoading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              disabled={isLoading}
            />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleVerificationSubmit} noValidate sx={{ mt: 1 }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {(error || localError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || localError}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We've sent a 6-digit verification code to {formData.email}
            </Typography>

            <TextField
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Verification Code"
              name="verificationCode"
              autoComplete="one-time-code"
              autoFocus
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              error={!!validationErrors.verificationCode}
              helperText={validationErrors.verificationCode}
              disabled={isLoading}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
              }}
            />

            <Button
              type="button"
              fullWidth
              variant="text"
              onClick={handleBackToRegistration}
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              Back to Registration
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
        {!isVerificationStep ? (
          <>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={handleRegisterSubmit}
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Link
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                handleLoginClick();
              }}
              sx={{ cursor: 'pointer', alignSelf: 'center' }}
            >
              Already have an account? Login
            </Link>
          </>
        ) : (
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={handleVerificationSubmit}
            disabled={isLoading}
            sx={{ py: 1.5 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Verify & Login'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RegisterPopup;