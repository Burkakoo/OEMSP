import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { certificateService } from '@/services/certificate.service';
import { Certificate } from '@/types/certificate.types';

const CertificateVerificationPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificate = async () => {
      if (!certificateId) {
        setError('Certificate ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await certificateService.getPublicCertificate(certificateId);
        setCertificate(response.data);
      } catch (err) {
        setError((err as Error).message || 'Certificate could not be verified');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCertificate();
  }, [certificateId]);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : certificate ? (
          <>
            <Typography variant="h4" gutterBottom>
              Certificate Verified
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {certificate.studentName} successfully completed {certificate.courseTitle}.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Instructor: {certificate.instructorName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Completion Date: {new Date(certificate.completionDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Certificate ID: {certificate.certificateId}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(certificate.skillsAwarded || []).map((skill) => (
                <Chip key={skill} label={skill} />
              ))}
            </Box>
          </>
        ) : (
          <Alert severity="warning">Certificate not found.</Alert>
        )}
      </Paper>
    </Container>
  );
};

export default CertificateVerificationPage;
