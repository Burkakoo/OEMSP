import React from 'react';
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AuditLogRecord } from '@/services/auditLog.service';
import { useLocalization } from '@/context/LocalizationContext';

interface AuditLogTableProps {
  logs: AuditLogRecord[];
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const { formatDateTime, t } = useLocalization();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('auditLogs')}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('time')}</TableCell>
              <TableCell>{t('actor')}</TableCell>
              <TableCell>{t('action')}</TableCell>
              <TableCell>{t('resource')}</TableCell>
              <TableCell>{t('status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {t('noAuditEntries')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>
                    {log.userId
                      ? `${log.userId.firstName} ${log.userId.lastName}`
                      : 'Anonymous'}
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    {log.resource}
                    {log.resourceId ? ` (${log.resourceId})` : ''}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${log.method} ${log.statusCode}`}
                      color={log.success ? 'success' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default AuditLogTable;
