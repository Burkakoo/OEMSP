/**
 * Student statistics component
 */

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface StudentStatsProps {
  totalEnrollments: number;
  completedCourses: number;
  averageProgress: number;
  totalCertificates: number;
}

const StudentStats: React.FC<StudentStatsProps> = ({
  totalEnrollments,
  completedCourses,
  averageProgress,
  totalCertificates,
}) => {
  const stats = [
    {
      title: 'Enrolled Courses',
      value: totalEnrollments,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
    },
    {
      title: 'Completed Courses',
      value: completedCourses,
      icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
      color: 'success.main',
    },
    {
      title: 'Average Progress',
      value: `${Math.round(averageProgress)}%`,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: 'info.main',
    },
    {
      title: 'Certificates Earned',
      value: totalCertificates,
      icon: <AccessTimeIcon sx={{ fontSize: 40 }} />,
      color: 'warning.main',
    },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {stats.map((stat, index) => (
        <Box key={index} sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '200px' }}>
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
            <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
            <Typography variant="h4" component="div" gutterBottom>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.title}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default StudentStats;
