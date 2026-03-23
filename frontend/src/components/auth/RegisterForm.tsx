/**
 * Register form component
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { register, verifyEmail, login, clearError } from '@store/slices/authSlice';
import { RegisterData } from '@/types/auth.types';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
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
      setIsVerificationStep(true);
      setSuccessMessage(`We sent a 6-digit OTP to ${formData.email}. Enter it below to verify your account.`);
      setValidationErrors({});
    } catch (err) {
      setLocalError((err as Error).message || 'Registration failed');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!validateVerificationForm()) {
      return;
    }

    try {
      await dispatch(
        verifyEmail({
          email: formData.email,
          code: verificationCode.trim(),
        })
      ).unwrap();

      setSuccessMessage('Email verified. Signing you in...');

      await dispatch(
        login({
          email: formData.email,
          password: formData.password,
        })
      ).unwrap();

      onSuccess?.();
    } catch (err) {
      setLocalError((err as Error).message || 'Verification failed');
    }
  };

  if (isVerificationStep) {
    return (
      <Box component="form" onSubmit={handleVerifySubmit} noValidate>
        <Typography variant="h5" component="h1" gutterBottom>
          Verify Email
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the 6-digit OTP sent to {formData.email}.
        </Typography>

        {(localError || error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {localError || error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="verificationCode"
          label="OTP Code"
          name="verificationCode"
          value={verificationCode}
          onChange={handleVerificationCodeChange}
          error={!!validationErrors.verificationCode}
          helperText={validationErrors.verificationCode}
          disabled={isLoading}
          autoFocus
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Verify OTP'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onLoginClick?.();
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
    <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
      <Typography variant="h5" component="h1" gutterBottom>
        Register
      </Typography>

      {(localError || error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {localError || error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
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

      <FormControl fullWidth margin="normal" error={!!validationErrors.role}>
        <InputLabel id="role-label">Role</InputLabel>
        <Select
          labelId="role-label"
          id="role"
          name="role"
          value={formData.role}
          label="Role"
          onChange={handleChange}
          disabled={isLoading}
        >
          <MenuItem value="student">Student</MenuItem>
          <MenuItem value="instructor">Instructor</MenuItem>
        </Select>
        {validationErrors.role && <FormHelperText>{validationErrors.role}</FormHelperText>}
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

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Register'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={(e) => {
            e.preventDefault();
            onLoginClick?.();
          }}
          sx={{ cursor: 'pointer' }}
        >
          Already have an account? Login
        </Link>
      </Box>
    </Box>
  );
};

export default RegisterForm;
