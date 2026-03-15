/**
 * EnrollmentChart component - Displays enrollment trends
 */

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface EnrollmentData {
  month: string;
  enrollments: number;
}

interface EnrollmentChartProps {
  data: EnrollmentData[];
}

const EnrollmentChart: React.FC<EnrollmentChartProps> = ({ data }) => {
  const maxEnrollments = Math.max(...data.map((d) => d.enrollments), 1);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Enrollment Trends
      </Typography>

      {data.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No enrollment data available
        </Typography>
      ) : (
        <Box sx={{ mt: 3 }}>
          {data.map((item, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">{item.month}</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {item.enrollments}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${(item.enrollments / maxEnrollments) * 100}%`,
                    height: '100%',
                    bgcolor: 'primary.main',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Total Enrollments: {data.reduce((sum, d) => sum + d.enrollments, 0)}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default EnrollmentChart;
