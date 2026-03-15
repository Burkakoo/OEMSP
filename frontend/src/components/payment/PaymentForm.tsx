/**
 * PaymentForm component - Handles payment processing
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { processPayment } from '@store/slices/paymentSlice';

interface PaymentFormProps {
  courseId: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  courseId,
  amount,
  onSuccess,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const ethiopianPaymentMethods = [
    { value: 'telebirr', label: 'Telebirr' },
    { value: 'cbe-birr', label: 'CBE Birr' },
    { value: 'cbe', label: 'Commercial Bank of Ethiopia' },
    { value: 'awash', label: 'Awash Bank' },
    { value: 'siinqee', label: 'Siinqee Bank' },
  ];

  const mobilePaymentMethods = ['telebirr', 'cbe-birr'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      onError('Please select a payment method');
      return;
    }

    if (mobilePaymentMethods.includes(paymentMethod) && !phoneNumber) {
      onError('Phone number is required for mobile payments');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        courseId,
        amount,
        currency: 'ETB',
        paymentMethod: paymentMethod.replace('-', '_').toLowerCase(), // Convert to backend format
        phoneNumber: mobilePaymentMethods.includes(paymentMethod) ? phoneNumber : undefined,
      };

      const result = await dispatch(processPayment(paymentData)).unwrap();
      onSuccess(result._id);
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Amount: {amount} ETB
      </Typography>

      <FormControl fullWidth margin="normal" required>
        <InputLabel>Payment Method</InputLabel>
        <Select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          label="Payment Method"
        >
          {ethiopianPaymentMethods.map((method) => (
            <MenuItem key={method.value} value={method.value}>
              {method.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {mobilePaymentMethods.includes(paymentMethod) && (
        <TextField
          fullWidth
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="09XXXXXXXX"
          required
          margin="normal"
          helperText="Enter your mobile number for payment"
        />
      )}

      {paymentMethod && !mobilePaymentMethods.includes(paymentMethod) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You will be redirected to {ethiopianPaymentMethods.find(m => m.value === paymentMethod)?.label} to complete your payment.
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isProcessing}
        sx={{ mt: 3 }}
      >
        {isProcessing ? <CircularProgress size={24} /> : `Pay ${amount} ETB`}
      </Button>
    </Box>
  );
};

export default PaymentForm;
