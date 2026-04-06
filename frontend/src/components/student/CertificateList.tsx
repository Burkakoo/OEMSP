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
  Link,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useLocalization } from '@/context/LocalizationContext';

interface Certificate {
  _id: string;
  certificateId: string;
  courseTitle: string;
  issuedAt: string;
  verificationCode: string;
  publicVerificationUrl?: string;
  skillsAwarded?: string[];
}

interface CertificateListProps {
  certificates: Certificate[];
  onDownload: (certificateId: string) => void;
}

const CertificateList: React.FC<CertificateListProps> = ({ certificates, onDownload }) => {
  const { formatDate, t } = useLocalization();

  if (certificates.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('noCertificates')}
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
                  {t('issued')}: {formatDate(certificate.issuedAt)}
                </Typography>
                <br />
                <Chip
                  label={`Code: ${certificate.verificationCode}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
                {certificate.certificateId && (
                  <Chip
                    label={`ID: ${certificate.certificateId}`}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5, ml: 1 }}
                  />
                )}
                {certificate.publicVerificationUrl && (
                  <>
                    <br />
                    <Link
                      href={certificate.publicVerificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      underline="hover"
                    >
                      {t('publicVerificationLink')}
                    </Link>
                  </>
                )}
                {certificate.skillsAwarded && certificate.skillsAwarded.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    {certificate.skillsAwarded.map((skill) => (
                      <Chip key={skill} label={skill} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default CertificateList;
