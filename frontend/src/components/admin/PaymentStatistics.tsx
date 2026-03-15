/**
 * PaymentStatistics component - Admin payment statistics panel
 */

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { paymentService } from '../../services/payment.service';
import { PaymentStatistics as PaymentStatisticsType, PaymentStatus } from '../../types/payment.types';

const STATUSES: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded'];

const PaymentStatistics: React.FC = () => {
  const [stats, setStats] = React.useState<PaymentStatisticsType | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const resp = await paymentService.getPaymentStatistics();
      setStats(resp.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load payment statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Payment Statistics</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => void loadStats()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && !stats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : !stats ? (
        <Alert severity="info">No payment statistics available.</Alert>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">
                Total Revenue ({stats.revenueStatus})
              </Typography>
              <Typography variant="h6">{stats.totalRevenue}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">
                Transactions
              </Typography>
              <Typography variant="h6">{stats.transactionCount}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">
                Avg Transaction
              </Typography>
              <Typography variant="h6">{stats.averageTransactionValue}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">
                Total Payments (all statuses)
              </Typography>
              <Typography variant="h6">{stats.totalPayments}</Typography>
            </Paper>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Status Breakdown
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {STATUSES.map((status) => (
                  <TableRow key={status}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{status}</TableCell>
                    <TableCell align="right">{stats.paymentsByStatus[status] || 0}</TableCell>
                    <TableCell align="right">{stats.amountByStatus[status] || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 320px', minWidth: 320 }}>
              <Typography variant="subtitle1" gutterBottom>
                Revenue By Method
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Transactions</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.revenueByMethod.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" color="text.secondary">
                            No data
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.revenueByMethod.map((row) => (
                        <TableRow key={row.paymentMethod}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {row.paymentMethod.replace('_', ' ')}
                          </TableCell>
                          <TableCell align="right">{row.transactionCount}</TableCell>
                          <TableCell align="right">{row.totalRevenue}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ flex: '1 1 320px', minWidth: 320 }}>
              <Typography variant="subtitle1" gutterBottom>
                Revenue By Currency
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Currency</TableCell>
                      <TableCell align="right">Transactions</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.revenueByCurrency.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" color="text.secondary">
                            No data
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.revenueByCurrency.map((row) => (
                        <TableRow key={row.currency}>
                          <TableCell>{row.currency}</TableCell>
                          <TableCell align="right">{row.transactionCount}</TableCell>
                          <TableCell align="right">{row.totalRevenue}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PaymentStatistics;
