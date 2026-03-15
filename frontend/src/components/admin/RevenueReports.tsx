/**
 * RevenueReports component - Displays revenue reports for admin
 */

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface RevenueData {
  month: string;
  revenue: number;
}

interface RevenueReportsProps {
  data: RevenueData[];
  totalRevenue: number;
  monthlyAverage: number;
  growth: number;
}

const RevenueReports: React.FC<RevenueReportsProps> = ({
  data,
  totalRevenue,
  monthlyAverage,
  growth,
}) => {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Revenue Reports
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box
          sx={{
            flex: '1 1 30%',
            minWidth: '200px',
            p: 2,
            bgcolor: 'primary.light',
            borderRadius: 1,
            color: 'white',
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Total Revenue
          </Typography>
          <Typography variant="h4">{totalRevenue} ETB</Typography>
        </Box>
        <Box
          sx={{
            flex: '1 1 30%',
            minWidth: '200px',
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 1,
            color: 'white',
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Monthly Average
          </Typography>
          <Typography variant="h4">{monthlyAverage} ETB</Typography>
        </Box>
        <Box
          sx={{
            flex: '1 1 30%',
            minWidth: '200px',
            p: 2,
            bgcolor: growth >= 0 ? 'success.light' : 'error.light',
            borderRadius: 1,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Growth
            </Typography>
            <Typography variant="h4">{growth}%</Typography>
          </Box>
          {growth >= 0 ? (
            <TrendingUpIcon sx={{ fontSize: 40 }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 40 }} />
          )}
        </Box>
      </Box>

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
                    bgcolor: 'primary.main',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default RevenueReports;
