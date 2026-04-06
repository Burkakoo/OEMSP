/**
 * Student dashboard page
 */

import React, { useEffect, useMemo, useState } from 'react';
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
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchEnrollments, deleteEnrollment as deleteEnrollmentAction } from '../store/slices/enrollmentSlice';
import { logout as logoutAction } from '../store/slices/authSlice';
import EnrolledCourseCard from '../components/student/EnrolledCourseCard';
import StudentStats from '../components/student/StudentStats';
import CertificateList from '../components/student/CertificateList';
import NotificationPreferencesPanel from '../components/student/NotificationPreferencesPanel';
import DashboardLayout from '../components/layout/DashboardLayout';
import { quizService } from '../services/quiz.service';
import { Quiz } from '../types/quiz.types';
import { Certificate } from '../types/certificate.types';
import { certificateService } from '../services/certificate.service';
import notificationPreferenceService, {
  NotificationPreferences,
} from '@/services/notificationPreference.service';
import { useLocalization } from '@/context/LocalizationContext';

const toCertificateFileName = (courseTitle: string): string =>
  `${courseTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'certificate'}-certificate.pdf`;

const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enrollments, isLoading } = useAppSelector((state) => state.enrollments);
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useLocalization();

  const [tabValue, setTabValue] = useState(0);
  const [quizzesByCourse, setQuizzesByCourse] = useState<Record<string, Quiz[]>>({});
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [unenrollTargetId, setUnenrollTargetId] = useState<string | null>(null);
  const [unenrollError, setUnenrollError] = useState<string | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences | null>(null);
  const [notificationPreferenceError, setNotificationPreferenceError] = useState<string | null>(
    null
  );
  const [isSavingNotificationPreferences, setIsSavingNotificationPreferences] = useState(false);

  const enrolledCourseIds = useMemo(
    () =>
      Array.from(
        new Set(
          enrollments
            .map((enrollment) => enrollment.courseId)
            .filter((courseId): courseId is string => Boolean(courseId))
        )
      ),
    [enrollments]
  );

  const courseTitlesById = useMemo(() => {
    const map = new Map<string, string>();
    enrollments.forEach((enrollment) => {
      if (enrollment.courseId) {
        map.set(enrollment.courseId, enrollment.course?.title || 'Course');
      }
    });
    return map;
  }, [enrollments]);

  const availableQuizzes = useMemo(
    () =>
      enrolledCourseIds.flatMap((courseId) =>
        (quizzesByCourse[courseId] || []).map((quiz) => ({
          quiz,
          courseId,
        }))
      ),
    [enrolledCourseIds, quizzesByCourse]
  );

  useEffect(() => {
    dispatch(fetchEnrollments());
  }, [dispatch]);

  useEffect(() => {
    const handleWindowFocus = () => {
      dispatch(fetchEnrollments());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        dispatch(fetchEnrollments());
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch]);

  useEffect(() => {
    let isCancelled = false;

    const loadCourseQuizzes = async () => {
      if (enrolledCourseIds.length === 0) {
        setQuizzesByCourse({});
        setQuizError(null);
        return;
      }

      setIsLoadingQuizzes(true);
      setQuizError(null);

      try {
        const responses = await Promise.all(
          enrolledCourseIds.map(async (courseId) => {
            const response = await quizService.getCourseQuizzes(courseId);
            return [courseId, response.data] as const;
          })
        );

        if (!isCancelled) {
          setQuizzesByCourse(Object.fromEntries(responses));
        }
      } catch (error) {
        if (!isCancelled) {
          setQuizError((error as Error).message || 'Failed to load quizzes');
          setQuizzesByCourse({});
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingQuizzes(false);
        }
      }
    };

    loadCourseQuizzes();

    return () => {
      isCancelled = true;
    };
  }, [enrolledCourseIds]);

  useEffect(() => {
    let isCancelled = false;

    const syncCertificates = async () => {
      if (isLoading && enrollments.length === 0) {
        return;
      }

      setIsLoadingCertificates(true);
      setCertificateError(null);

      try {
        let listResponse = await certificateService.getCertificates({ limit: 100 });
        let certificateRecords = listResponse.data.certificates;

        const completedEnrollmentIds = enrollments
          .filter((enrollment) => enrollment.isCompleted)
          .map((enrollment) => enrollment._id);

        const certificateEnrollmentIds = new Set(
          certificateRecords.map((certificate) => certificate.enrollmentId)
        );
        const missingEnrollmentIds = completedEnrollmentIds.filter(
          (enrollmentId) => !certificateEnrollmentIds.has(enrollmentId)
        );

        if (missingEnrollmentIds.length > 0) {
          const generationResults = await Promise.allSettled(
            missingEnrollmentIds.map((enrollmentId) =>
              certificateService.generateForEnrollment(enrollmentId)
            )
          );

          const failedGeneration = generationResults.some(
            (result) => result.status === 'rejected'
          );
          if (failedGeneration && !isCancelled) {
            setCertificateError(
              'Some certificates could not be generated automatically. You can try again from the certificate section.'
            );
          }

          listResponse = await certificateService.getCertificates({ limit: 100 });
          certificateRecords = listResponse.data.certificates;
        }

        if (!isCancelled) {
          setCertificates(certificateRecords);
        }
      } catch (error) {
        if (!isCancelled) {
          setCertificateError((error as Error).message || 'Failed to load certificates');
          setCertificates([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCertificates(false);
        }
      }
    };

    syncCertificates();

    return () => {
      isCancelled = true;
    };
  }, [enrollments, isLoading]);

  useEffect(() => {
    let isCancelled = false;

    const loadPreferences = async () => {
      try {
        const preferences = await notificationPreferenceService.getPreferences();
        if (!isCancelled) {
          setNotificationPreferences(preferences);
        }
      } catch (error) {
        if (!isCancelled) {
          setNotificationPreferenceError(
            (error as Error).message || 'Failed to load notification preferences'
          );
        }
      }
    };

    void loadPreferences();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleContinueLearning = (enrollmentId: string) => {
    const enrollment = enrollments.find((e) => e._id === enrollmentId);
    if (enrollment) {
      navigate(`/courses/${enrollment.courseId}/learn`);
    }
  };

  const handleViewCertificate = async (enrollmentId: string) => {
    setTabValue(1);
    setCertificateError(null);

    try {
      let targetCertificate = certificates.find(
        (certificate) => certificate.enrollmentId === enrollmentId
      );

      if (!targetCertificate) {
        const generated = await certificateService.generateForEnrollment(enrollmentId);
        const generatedCertificate = generated.data;
        targetCertificate = generatedCertificate;

        setCertificates((currentCertificates) => {
          const withoutDuplicate = currentCertificates.filter(
            (certificate) =>
              certificate.enrollmentId !== generatedCertificate.enrollmentId
          );
          return [generatedCertificate, ...withoutDuplicate];
        });
      }

      if (!targetCertificate) {
        throw new Error('Certificate was not found after generation');
      }

      await certificateService.downloadCertificate(
        targetCertificate._id,
        toCertificateFileName(targetCertificate.courseTitle)
      );
    } catch (error) {
      setCertificateError((error as Error).message || 'Failed to open certificate');
    }
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    setCertificateError(null);

    try {
      const certificate = certificates.find((item) => item._id === certificateId);
      await certificateService.downloadCertificate(
        certificateId,
        toCertificateFileName(certificate?.courseTitle || 'certificate')
      );
    } catch (error) {
      setCertificateError((error as Error).message || 'Failed to download certificate');
    }
  };

  const handleTakeQuiz = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
  };

  const handleLogout = async () => {
    await dispatch(logoutAction());
    navigate('/login');
  };

  const handleSaveNotificationPreferences = async (
    preferences: Partial<NotificationPreferences>
  ) => {
    setIsSavingNotificationPreferences(true);
    setNotificationPreferenceError(null);

    try {
      const updated = await notificationPreferenceService.updatePreferences(preferences);
      setNotificationPreferences(updated);
    } catch (error) {
      setNotificationPreferenceError(
        (error as Error).message || 'Failed to update notification preferences'
      );
    } finally {
      setIsSavingNotificationPreferences(false);
    }
  };

  const handlePromptUnenroll = (enrollmentId: string) => {
    setUnenrollTargetId(enrollmentId);
    setUnenrollError(null);
  };

  const handleCloseUnenrollDialog = () => {
    if (isUnenrolling) return;
    setUnenrollTargetId(null);
    setUnenrollError(null);
  };

  const handleConfirmUnenroll = async () => {
    if (!unenrollTargetId) return;

    setIsUnenrolling(true);
    setUnenrollError(null);

    try {
      await dispatch(deleteEnrollmentAction(unenrollTargetId)).unwrap();
      setUnenrollTargetId(null);
    } catch (error) {
      setUnenrollError((error as Error).message || 'Failed to unenroll');
    } finally {
      setIsUnenrolling(false);
    }
  };

  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.isCompleted).length;
  const averageProgress =
    enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.completionPercentage, 0) / enrollments.length
      : 0;

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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {t('studentWelcome', { name: user?.firstName || 'Student' })}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('studentSubtitle')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => void handleLogout()}
          >
            {t('logout')}
          </Button>
        </Stack>

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
            <Tab label={t('myCourses')} />
            <Tab label="Certificates" />
            <Tab label="Quizzes" />
            <Tab label="Notifications" />
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
                  {t('browseCourses')}
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
                      onUnenroll={handlePromptUnenroll}
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
            {certificateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {certificateError}
              </Alert>
            )}
            {isLoadingCertificates ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Paper>
            ) : (
              <CertificateList
                certificates={certificates}
                onDownload={handleDownloadCertificate}
              />
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Available Quizzes
            </Typography>

            {isLoadingQuizzes ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Paper>
            ) : quizError ? (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => dispatch(fetchEnrollments())}>
                    Retry
                  </Button>
                }
              >
                {quizError}
              </Alert>
            ) : availableQuizzes.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No quizzes available yet
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your instructor has not published quizzes for your enrolled courses yet.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {availableQuizzes.map(({ quiz, courseId }) => (
                  <Paper
                    key={quiz._id}
                    sx={{ p: 3, flex: '1 1 calc(50% - 16px)', minWidth: '280px' }}
                  >
                    <Typography variant="h6">{quiz.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {courseTitlesById.get(courseId) || 'Course'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {quiz.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Duration: {quiz.duration} minutes
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Passing Score: {quiz.passingScore}%
                    </Typography>
                    <Button variant="contained" onClick={() => handleTakeQuiz(quiz._id)}>
                      Take Quiz
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <NotificationPreferencesPanel
            preferences={notificationPreferences}
            error={notificationPreferenceError}
            isSaving={isSavingNotificationPreferences}
            onSave={handleSaveNotificationPreferences}
          />
        )}
      </Box>
      <Dialog open={Boolean(unenrollTargetId)} onClose={handleCloseUnenrollDialog}>
        <DialogTitle>Unenroll From Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this course from your dashboard? Your learning progress
            and certificate access for this enrollment will be removed.
          </Typography>
          {unenrollError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {unenrollError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnenrollDialog} disabled={isUnenrolling}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUnenroll}
            color="error"
            variant="contained"
            disabled={isUnenrolling}
          >
            {isUnenrolling ? 'Removing...' : 'Unenroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </DashboardLayout>
  );
};

export default StudentDashboardPage;
