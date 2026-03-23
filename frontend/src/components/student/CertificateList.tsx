/**
 * Certificate list component
 */

import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Paper,
  Box,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VerifiedIcon from '@mui/icons-material/Verified';

interface Certificate {
  _id: string;
  courseTitle: string;
  issuedAt: string;
  verificationCode: string;
}

interface CertificateListProps {
  certificates: Certificate[];
  onDownload: (certificateId: string) => void;
}

const CertificateList: React.FC<CertificateListProps> = ({ certificates, onDownload }) => {
  if (certificates.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No certificates earned yet. Complete courses to earn certificates!
        </Typography>
      </Paper>
    );
  }

  return (
    <List>
      {certificates.map((certificate) => (
        <ListItem
          key={certificate._id}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
          }}
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="download"
              onClick={() => onDownload(certificate._id)}
            >
              <DownloadIcon />
            </IconButton>
          }
        >
          <ListItemIcon>
            <VerifiedIcon color="success" />
          </ListItemIcon>
          <ListItemText
            primary={certificate.courseTitle}
            secondary={
              <Box>
                <Typography variant="caption" component="span" color="text.secondary">
                  Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
                </Typography>
                <br />
                <Chip
                  label={`Code: ${certificate.verificationCode}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default CertificateList;
