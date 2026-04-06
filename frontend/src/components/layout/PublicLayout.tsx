import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PublicHeader from '@components/layout/PublicHeader';
import PublicFooter from '@components/layout/PublicFooter';

const PublicLayout: React.FC = () => {
  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-20% auto auto -12%',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, 0.12),
          filter: 'blur(40px)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '80px -12% auto auto',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: alpha(theme.palette.secondary.main, 0.1),
          filter: 'blur(42px)',
          pointerEvents: 'none',
        },
      })}
    >
      <PublicHeader />
      <Box component="main" sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <Outlet />
      </Box>
      <PublicFooter />
    </Box>
  );
};

export default PublicLayout;
