import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PublicHeader from '@components/layout/PublicHeader';
import PublicFooter from '@components/layout/PublicFooter';

const PublicLayout: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        backgroundImage: (theme) =>
          `radial-gradient(900px 360px at 10% -10%, ${alpha(
            theme.palette.primary.main,
            0.14
          )} 0%, rgba(0,0,0,0) 55%), radial-gradient(900px 360px at 90% 0%, ${alpha(
            theme.palette.secondary.main,
            0.12
          )} 0%, rgba(0,0,0,0) 55%)`,
      }}
    >
      <PublicHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <PublicFooter />
    </Box>
  );
};

export default PublicLayout;
