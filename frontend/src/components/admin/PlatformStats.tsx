/**
 * PlatformStats component - Displays platform-wide statistics for admin
 */

import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

interface PlatformStatsProps {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
}

const PlatformStats: React.FC<PlatformStatsProps> = ({
  totalUsers,
  totalCourses,
  totalEnrollments,
  totalRevenue,
}) => {
  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Total Courses',
      value: totalCourses,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Enrollments',
      value: totalEnrollments,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Total Revenue',
      value: `${totalRevenue} ETB`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, _index) => (
        <Grid>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%',
            }}
          >
            <Box sx={{ color: stat.color, mb: 2 }}>{stat.icon}</Box>
            <Typography variant="h4" gutterBottom>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.title}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PlatformStats;
