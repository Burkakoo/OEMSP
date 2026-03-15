/**
 * Pending approval notification component for instructors
 */

import React from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { useAppSelector } from '@hooks/useAppDispatch';

const PendingApprovalNotification: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user || user.role !== 'instructor' || user.isApproved) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Paper sx={{ maxWidth: 600, p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Account Pending Approval
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Your instructor account is currently under review.
        </Alert>

        <Typography variant="body1" paragraph>
          Thank you for registering as an instructor on our platform. Your account is
          currently pending approval from our administrators.
        </Typography>

        <Typography variant="body1" paragraph>
          You will receive an email notification once your account has been reviewed. This
          process typically takes 1-2 business days.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          If you have any questions, please contact our support team.
        </Typography>
      </Paper>
    </Box>
  );
};

export default PendingApprovalNotification;
