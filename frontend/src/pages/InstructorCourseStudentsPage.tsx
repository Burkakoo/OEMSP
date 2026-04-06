import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardLayout from '@components/layout/DashboardLayout';
import { courseService } from '@services/course.service';
import { enrollmentService } from '@services/enrollment.service';
import { Enrollment } from '@/types/enrollment.types';
import { Course } from '@/types/course.types';

const InstructorCourseStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      if (!courseId) {
        if (active) {
          setPageError('Course ID is required');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setPageError(null);

      try {
        const [courseResponse, enrollmentResponse] = await Promise.all([
          courseService.getCourse(courseId),
          enrollmentService.getEnrollments({ courseId, page: 1, limit: 200 }),
        ]);

        if (!active) return;
        setCourse(courseResponse.data);
        setEnrollments(enrollmentResponse.data.enrollments);
      } catch (error) {
        if (!active) return;
        setPageError((error as Error).message || 'Failed to load enrolled students');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [courseId]);

  const completionSummary = useMemo(() => {
    const completed = enrollments.filter((enrollment) => enrollment.isCompleted).length;
    return `${completed}/${enrollments.length}`;
  }, [enrollments]);

  const handlePromptRemove = (enrollment: Enrollment) => {
    setRemoveTarget(enrollment);
    setRemoveError(null);
  };

  const handleCloseRemoveDialog = () => {
    if (isRemoving) return;
    setRemoveTarget(null);
    setRemoveError(null);
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;

    setIsRemoving(true);
    setRemoveError(null);

    try {
      await enrollmentService.deleteEnrollment(removeTarget._id);
      setEnrollments((current) =>
        current.filter((enrollment) => enrollment._id !== removeTarget._id)
      );
      setRemoveTarget(null);
    } catch (error) {
      setRemoveError((error as Error).message || 'Failed to remove student');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/instructor/courses')} sx={{ mb: 2 }}>
          Back to My Courses
        </Button>

        <Typography variant="h4" gutterBottom>
          {course ? `${course.title} Students` : 'Course Students'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Track enrollment progress and remove students from this course when needed.
        </Typography>

        {pageError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {pageError}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1">Enrollment Summary</Typography>
              <Typography variant="body2" color="text.secondary">
                Total students: {enrollments.length} • Completed: {completionSummary}
              </Typography>
            </Paper>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Enrolled</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">No students enrolled in this course yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment._id}>
                        <TableCell>
                          {enrollment.student
                            ? `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim()
                            : enrollment.studentId}
                        </TableCell>
                        <TableCell>{enrollment.student?.email || 'No email available'}</TableCell>
                        <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                        <TableCell>{enrollment.completionPercentage}%</TableCell>
                        <TableCell>{enrollment.isCompleted ? 'Completed' : 'In progress'}</TableCell>
                        <TableCell align="right">
                          <Button
                            color="error"
                            size="small"
                            onClick={() => handlePromptRemove(enrollment)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Dialog open={Boolean(removeTarget)} onClose={handleCloseRemoveDialog}>
          <DialogTitle>Remove Student From Course</DialogTitle>
          <DialogContent>
            <Typography>
              Remove{' '}
              <strong>
                {removeTarget?.student
                  ? `${removeTarget.student.firstName} ${removeTarget.student.lastName}`.trim()
                  : 'this student'}
              </strong>{' '}
              from {course?.title || 'this course'}?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will delete the enrollment record and any certificate tied to it.
            </Typography>
            {removeError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {removeError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRemoveDialog} disabled={isRemoving}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemove}
              color="error"
              variant="contained"
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove Student'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default InstructorCourseStudentsPage;
