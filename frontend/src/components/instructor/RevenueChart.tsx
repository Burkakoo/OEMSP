/**
 * RevenueChart component - Displays revenue trends
 */

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Revenue Trends
      </Typography>

      {data.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No revenue data available
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
                  {item.revenue} ETB
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
                    width: `${(item.revenue / maxRevenue) * 100}%`,
                    height: '100%',
                    bgcolor: 'success.main',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h6" color="success.main">
                {totalRevenue} ETB
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Average: {(totalRevenue / data.length).toFixed(2)} ETB per month
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default RevenueChart;
