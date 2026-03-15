/**
 * InstructorStats component - Displays instructor statistics
 */

import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

interface InstructorStatsProps {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

const InstructorStats: React.FC<InstructorStatsProps> = ({
  totalCourses,
  totalStudents,
  totalRevenue,
  averageRating,
}) => {
  const stats = [
    {
      title: 'Total Courses',
      value: totalCourses,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Total Students',
      value: totalStudents,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Revenue',
      value: `${totalRevenue} ETB`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Average Rating',
      value: averageRating.toFixed(1),
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
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

export default InstructorStats;
