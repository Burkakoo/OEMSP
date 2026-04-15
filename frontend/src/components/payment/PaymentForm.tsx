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
import { useLocalization } from '@/context/LocalizationContext';
import { Payment } from '@/types/payment.types';

interface PaymentFormProps {
  courseId: string;
  amount: number;
  currency: string;
  couponCode?: string;
  onSuccess: (payment: Payment) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  courseId,
  amount,
  currency,
  couponCode,
  onSuccess,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const { formatCurrency, t } = useLocalization();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { value: 'paypal', label: 'PayPal' },
    { value: 'mobile-money', label: 'Mobile Money' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'mtn-momo', label: 'MTN MoMo' },
    { value: 'airtel-money', label: 'Airtel Money' },
    { value: 'telebirr', label: 'Telebirr' },
    { value: 'cbe-birr', label: 'CBE Birr' },
    { value: 'cbe', label: 'Commercial Bank of Ethiopia' },
    { value: 'awash', label: 'Awash Bank' },
    { value: 'siinqee', label: 'Siinqee Bank' },
  ];

  const mobilePaymentMethods = [
    'mobile-money',
    'mpesa',
    'mtn-momo',
    'airtel-money',
    'telebirr',
    'cbe-birr',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount > 0 && !paymentMethod) {
      onError('Please select a payment method');
      return;
    }

    if (amount > 0 && mobilePaymentMethods.includes(paymentMethod) && !phoneNumber) {
      onError('Phone number is required for mobile payments');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        courseId,
        amount,
        currency,
        paymentMethod: amount > 0 ? paymentMethod.replace('-', '_').toLowerCase() : undefined,
        couponCode,
        phoneNumber: amount > 0 && mobilePaymentMethods.includes(paymentMethod) ? phoneNumber : undefined,
      };

      const result = await dispatch(processPayment(paymentData)).unwrap();
      onSuccess(result);
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        {t('paymentDetails')}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {t('amount')}: {formatCurrency(amount, currency)}
      </Typography>

      {amount > 0 && (
        <FormControl fullWidth margin="normal" required>
          <InputLabel>{t('paymentMethod')}</InputLabel>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            label={t('paymentMethod')}
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method.value} value={method.value}>
                {method.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {amount > 0 && mobilePaymentMethods.includes(paymentMethod) && (
        <TextField
          fullWidth
          label={t('phoneNumber')}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+251900000000"
          required
          margin="normal"
          helperText={t('phoneHelper')}
        />
      )}

      {amount > 0 && paymentMethod && !mobilePaymentMethods.includes(paymentMethod) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('redirectToPayment', {
            method:
              paymentMethods.find((method) => method.value === paymentMethod)?.label || paymentMethod,
          })}
        </Alert>
      )}

      {amount === 0 && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {t('couponCoversCourse')}
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
        {isProcessing ? (
          <CircularProgress size={24} />
        ) : amount === 0 ? (
          t('completeEnrollment')
        ) : (
          t('payAmount', { amount: formatCurrency(amount, currency) })
        )}
      </Button>
    </Box>
  );
};

export default PaymentForm;
