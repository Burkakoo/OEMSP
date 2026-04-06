import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearMessages = () => {
    setLocalError(null);
    setSuccessMessage(null);

    if (error) {
      dispatch(clearError());
    }
  };

  const validateRegistrationForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateVerificationForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!verificationCode.trim()) {
      errors.verificationCode = 'Enter the 6-digit code from your email';
    } else if (!/^\d{6}$/.test(verificationCode.trim())) {
      errors.verificationCode = 'Verification code must be 6 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
    clearMessages();
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    const value = event.target.value as RegisterData['role'];
    setFormData((prev) => ({ ...prev, role: value }));
    clearFieldError('role');
    clearMessages();
  };

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    clearFieldError('confirmPassword');
    clearMessages();
  };

  const handleVerificationCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(event.target.value);
    clearFieldError('verificationCode');
    clearMessages();
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!validateRegistrationForm()) {
      return;
    }

    try {
      await dispatch(register(formData)).unwrap();
      setIsVerificationStep(true);
      setSuccessMessage(`We sent a 6-digit verification code to ${formData.email}.`);
      setValidationErrors({});
    } catch (submissionError) {
      setLocalError((submissionError as Error).message || 'Registration failed');
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    } catch (submissionError) {
      setLocalError((submissionError as Error).message || 'Verification failed');
    }
  };

  if (isVerificationStep) {
    return (
      <Box component="form" onSubmit={handleVerifySubmit} noValidate>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" color="primary.main">
              Verify email
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
              Confirm your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the 6-digit code sent to {formData.email} to finish setting up your account.
            </Typography>
          </Box>

          {(localError || error) && <Alert severity="error">{localError || error}</Alert>}
          {successMessage && <Alert severity="success">{successMessage}</Alert>}

          <TextField
            required
            fullWidth
            id="verificationCode"
            label="Verification code"
            name="verificationCode"
            placeholder="123456"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            error={!!validationErrors.verificationCode}
            helperText={validationErrors.verificationCode}
            disabled={isLoading}
            autoFocus
          />

          <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Verify and continue'}
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
                setIsVerificationStep(false);
                setVerificationCode('');
                setValidationErrors({});
                clearMessages();
              }}
              sx={{ cursor: 'pointer' }}
            >
              Back to registration
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={(event) => {
                event.preventDefault();
                onLoginClick?.();
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
    <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="primary.main">
            Create account
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
            Start with the role that fits you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Students can start learning right away. Instructors can create content after approval.
          </Typography>
        </Box>

        {(localError || error) && <Alert severity="error">{localError || error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            required
            fullWidth
            id="firstName"
            label="First name"
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
            required
            fullWidth
            id="lastName"
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
            error={!!validationErrors.lastName}
            helperText={validationErrors.lastName}
            disabled={isLoading}
          />
        </Stack>

        <TextField
          required
          fullWidth
          id="email"
          label="Email address"
          name="email"
          placeholder="name@example.com"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={!!validationErrors.email}
          helperText={validationErrors.email}
          disabled={isLoading}
        />

        <FormControl fullWidth error={!!validationErrors.role} disabled={isLoading}>
          <InputLabel id="role-label">I am joining as</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            name="role"
            value={formData.role}
            label="I am joining as"
            onChange={handleRoleChange}
          >
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="instructor">Instructor</MenuItem>
          </Select>
          <FormHelperText>
            {validationErrors.role ||
              (formData.role === 'instructor'
                ? 'Instructor accounts may require approval before teaching tools are unlocked.'
                : 'Student accounts can browse and enroll in courses after signup.')}
          </FormHelperText>
        </FormControl>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            disabled={isLoading}
          />
          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm password"
            type="password"
            id="confirmPassword"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={!!validationErrors.confirmPassword}
            helperText={validationErrors.confirmPassword}
            disabled={isLoading}
          />
        </Stack>

        <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading}>
          {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Create account'}
        </Button>

        <Typography variant="caption" color="text.secondary">
          By continuing, you will verify your email before accessing the platform.
        </Typography>

        <Link
          component="button"
          variant="body2"
          onClick={(event) => {
            event.preventDefault();
            onLoginClick?.();
          }}
          sx={{ cursor: 'pointer', alignSelf: 'flex-start' }}
        >
          Already have an account? Sign in
        </Link>
      </Stack>
    </Box>
  );
};

export default RegisterForm;
