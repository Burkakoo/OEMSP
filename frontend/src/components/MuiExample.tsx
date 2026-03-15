import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

/**
 * Example component demonstrating Material-UI integration
 * This can be removed once actual components are implemented
 */
const MuiExample: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Material-UI Setup Complete
      </Typography>
      <Typography variant="body1" paragraph>
        Material-UI has been successfully configured for OICT TUTOR.
      </Typography>
      <Button variant="contained" color="primary" startIcon={<HomeIcon />} sx={{ mt: 2 }}>
        Example Button
      </Button>
    </Box>
  );
};

export default MuiExample;
