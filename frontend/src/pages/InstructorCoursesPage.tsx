import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchInstructorCourses, deleteCourse } from '@store/slices/courseSlice';
import { getCourseDisplayPrice } from '@/utils/coursePricing';
import DashboardLayout from '@components/layout/DashboardLayout';
import { useLocalization } from '@/context/LocalizationContext';

const InstructorCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { courses, isLoading, error } = useAppSelector((state) => state.courses);
  const { locale, t } = useLocalization();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchInstructorCourses());
  }, [dispatch]);

  const handleEdit = (courseId: string) => {
    navigate(`/instructor/courses/${courseId}/edit`);
  };

  const handleManageStudents = (courseId: string) => {
    navigate(`/instructor/courses/${courseId}/students`);
  };

  const handleDelete = (courseId: string) => {
    setCourseToDelete(courseId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await dispatch(deleteCourse(courseToDelete)).unwrap();
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (submissionError) {
      setDeleteError(
        typeof submissionError === 'string'
          ? submissionError
          : (submissionError as Error)?.message || 'Failed to delete course'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCourse = () => {
    navigate('/instructor/courses/create');
  };

  const handleReviewAssignments = () => {
    navigate('/instructor/assignments');
  };

  const publishedCourses = courses.filter((course) => course.isPublished).length;
  const totalStudents = courses.reduce((sum, course) => sum + course.enrollmentCount, 0);

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 5 }}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            mb: 3.5,
            borderRadius: 7,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.12
            )} 100%)`,
          })}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="overline" color="primary.main">
                Teaching workspace
              </Typography>
              <Typography variant="h3" sx={{ mb: 1 }}>
                {t('myCourses')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                Organize your courses, review enrollments, and jump into editing without leaving the instructor shell.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={handleReviewAssignments}>
                {t('assignments')}
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateCourse}>
                {t('createCourse')}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 5 }}>
                <Typography variant="h5">{courses.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total courses
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 5 }}>
                <Typography variant="h5">{publishedCourses}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Published courses
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 5 }}>
                <Typography variant="h5">{totalStudents}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Student enrollments
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {isLoading ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 7 }}>
            <CircularProgress />
          </Paper>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : courses.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 7 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
              No courses yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create your first course to start building your teaching library.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateCourse}>
              Create Your First Course
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course) => {
              const priceDisplay = getCourseDisplayPrice(course, { locale });

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}
                      >
                        <Box>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {course.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                            <Chip label={course.category} size="small" />
                            <Chip label={course.level} size="small" />
                            {course.isFree && <Chip label={t('free')} size="small" color="success" />}
                            {course.isPublished && <Chip label={t('published')} size="small" color="primary" />}
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: 'right', minWidth: 'fit-content' }}>
                          <Typography variant="h6" color="primary">
                            {course.isFree ? t('free') : priceDisplay.currentPriceLabel}
                          </Typography>
                          {priceDisplay.hasDiscount && !course.isFree && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ textDecoration: 'line-through' }}
                            >
                              {priceDisplay.originalPriceLabel}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {course.description.length > 120
                          ? `${course.description.substring(0, 120)}...`
                          : course.description}
                      </Typography>

                      <Paper
                        elevation={0}
                        sx={(theme) => ({
                          p: 2,
                          borderRadius: 5,
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        })}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {course.enrollmentCount} enrolled students
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manage learners, update content, or review performance.
                        </Typography>
                      </Paper>
                    </CardContent>

                    <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<GroupIcon />}
                        onClick={() => handleManageStudents(course._id)}
                      >
                        Students
                      </Button>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(course._id)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(course._id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{courses.find((course) => course._id === courseToDelete)?.title}"?
              This action cannot be undone and will remove all course data, including modules, lessons, and student enrollments.
            </Typography>
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" disabled={isDeleting} variant="contained">
              {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default InstructorCoursesPage;
