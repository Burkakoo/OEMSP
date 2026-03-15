/**
 * Student dashboard page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Button,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchEnrollments } from '../store/slices/enrollmentSlice';
import EnrolledCourseCard from '../components/student/EnrolledCourseCard';
import StudentStats from '../components/student/StudentStats';
import CertificateList from '../components/student/CertificateList';
import DashboardLayout from '../components/layout/DashboardLayout';

const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enrollments, isLoading } = useAppSelector((state) => state.enrollments);
  const { user } = useAppSelector((state) => state.auth);

  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchEnrollments());
  }, [dispatch]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleContinueLearning = (enrollmentId: string) => {
    const enrollment = enrollments.find((e) => e._id === enrollmentId);
    if (enrollment) {
      navigate(`/courses/${enrollment.courseId}/learn`);
    }
  };

  const handleViewCertificate = (enrollmentId: string) => {
    navigate(`/certificates/${enrollmentId}`);
  };

  const handleDownloadCertificate = (certificateId: string) => {
    // Placeholder for certificate download
    console.log('Download certificate:', certificateId);
  };

  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.isCompleted).length;
  const averageProgress =
    enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.completionPercentage, 0) / enrollments.length
      : 0;

  // Mock certificates (would come from API in real implementation)
  const certificates = enrollments
    .filter((e) => e.isCompleted)
    .map((e) => ({
      _id: e._id,
      courseName: e.course?.title || 'Course',
      issuedAt: e.completedAt || new Date().toISOString(),
      verificationCode: `CERT-${e._id.substring(0, 8).toUpperCase()}`,
    }));

  if (isLoading && enrollments.length === 0) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track your learning progress and achievements
        </Typography>

        <Box sx={{ mb: 4 }}>
          <StudentStats
            totalEnrollments={totalEnrollments}
            completedCourses={completedCourses}
            averageProgress={averageProgress}
            totalCertificates={certificates.length}
          />
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="My Courses" />
            <Tab label="Certificates" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Enrolled Courses
            </Typography>
            {enrollments.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  You haven't enrolled in any courses yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Browse our course catalog to get started with your learning journey!
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {enrollments.map((enrollment) => (
                  <Box key={enrollment._id} sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '280px' }}>
                    <EnrolledCourseCard
                      enrollment={enrollment}
                      onContinue={handleContinueLearning}
                      onViewCertificate={handleViewCertificate}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              My Certificates
            </Typography>
            <CertificateList
              certificates={certificates}
              onDownload={handleDownloadCertificate}
            />
          </Box>
        )}
      </Box>
    </Container>
    </DashboardLayout>
  );
};

export default StudentDashboardPage;
