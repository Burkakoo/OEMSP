import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AttachmentList from '@components/courses/AttachmentList';
import DashboardLayout from '@components/layout/DashboardLayout';
import { assignmentService } from '@services/assignment.service';
import { courseService } from '@services/course.service';
import { useAppSelector } from '@hooks/useAppDispatch';
import { AssignmentSubmission, AssignmentSubmissionStatus } from '@/types/assignment.types';
import { Course } from '@/types/course.types';

const getUserName = (value: AssignmentSubmission['studentId'] | AssignmentSubmission['gradedBy']) => {
  if (!value || typeof value === 'string') {
    return 'Unknown user';
  }

  return `${value.firstName} ${value.lastName}`.trim() || value.email || 'Unknown user';
};

const InstructorAssignmentsPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentSubmissionStatus>('all');
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AssignmentSubmission | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      if (!user?._id) {
        if (active) {
          setIsLoadingCourses(false);
        }
        return;
      }

      try {
        const response = await courseService.getCourses({ instructorId: user._id }, 1, 100);
        if (!active) return;
        setCourses(response.data.courses);
      } catch (error) {
        if (!active) return;
        setPageError((error as Error).message || 'Failed to load instructor courses');
      } finally {
        if (active) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, [user?._id]);

  useEffect(() => {
    let active = true;

    const loadSubmissions = async () => {
      setIsLoadingSubmissions(true);
      setPageError(null);

      try {
        const response = await assignmentService.getAssignments({
          courseId: selectedCourseId || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: 1,
          limit: 100,
        });

        if (!active) return;
        setSubmissions(response.data.submissions);
      } catch (error) {
        if (!active) return;
        setPageError((error as Error).message || 'Failed to load assignment submissions');
      } finally {
        if (active) {
          setIsLoadingSubmissions(false);
        }
      }
    };

    loadSubmissions();

    return () => {
      active = false;
    };
  }, [selectedCourseId, statusFilter]);

  const handleCourseChange = (event: SelectChangeEvent<string>) => {
    setSelectedCourseId(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value as 'all' | AssignmentSubmissionStatus);
  };

  const handleOpenReview = (submission: AssignmentSubmission) => {
    setReviewTarget(submission);
    setScoreInput(submission.score !== undefined ? String(submission.score) : '');
    setFeedbackInput(submission.feedback ?? '');
    setSaveError(null);
  };

  const handleCloseReview = () => {
    if (isSaving) return;
    setReviewTarget(null);
    setSaveError(null);
  };

  const handleDownloadAttachment = async (
    submissionId: string,
    attachmentId: string,
    fileName: string
  ) => {
    try {
      const blob = await assignmentService.downloadAttachment(submissionId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSaveError((error as Error).message || 'Failed to download attachment');
    }
  };

  const handleSaveGrade = async () => {
    if (!reviewTarget) return;

    const numericScore = Number(scoreInput);
    if (Number.isNaN(numericScore)) {
      setSaveError('Enter a valid score between 0 and 100');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await assignmentService.gradeAssignment(reviewTarget._id, {
        score: numericScore,
        feedback: feedbackInput,
      });

      setSubmissions((prev) =>
        prev.map((submission) =>
          submission._id === reviewTarget._id ? response.data : submission
        )
      );
      setReviewTarget(response.data);
    } catch (error) {
      setSaveError((error as Error).message || 'Failed to save grade');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingCourses || isLoadingSubmissions;

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Assignment Review
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review student submissions, leave feedback, and enter manual grades.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: 280 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="assignment-course-filter">Course</InputLabel>
              <Select
                labelId="assignment-course-filter"
                label="Course"
                value={selectedCourseId}
                onChange={handleCourseChange}
              >
                <MenuItem value="">All courses</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="assignment-status-filter">Status</InputLabel>
              <Select
                labelId="assignment-status-filter"
                label="Status"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="graded">Graded</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {pageError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {pageError}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : submissions.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AssignmentTurnedInIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              No assignment submissions yet
            </Typography>
            <Typography color="text.secondary">
              Student submissions will appear here as soon as they start turning in assignment work.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell>{getUserName(submission.studentId)}</TableCell>
                    <TableCell>{submission.courseTitle}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {submission.lessonTitle || 'Untitled assignment'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {submission.moduleTitle}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={submission.status === 'graded' ? 'Graded' : 'Submitted'}
                        color={submission.status === 'graded' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {submission.score !== undefined ? `${submission.score}%` : 'Not graded'}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => handleOpenReview(submission)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={Boolean(reviewTarget)} onClose={handleCloseReview} fullWidth maxWidth="md">
          <DialogTitle>Review Assignment</DialogTitle>
          <DialogContent dividers>
            {reviewTarget && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Student
                  </Typography>
                  <Typography>{getUserName(reviewTarget.studentId)}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assignment
                  </Typography>
                  <Typography>{reviewTarget.lessonTitle || 'Untitled assignment'}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Submission text
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
                    <Typography>
                      {reviewTarget.submissionText?.trim() || 'No written response provided.'}
                    </Typography>
                  </Paper>
                </Box>

                {reviewTarget.attachments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Submitted files
                    </Typography>
                    <AttachmentList
                      attachments={reviewTarget.attachments}
                      onDownload={(attachmentId, fileName) =>
                        handleDownloadAttachment(reviewTarget._id, attachmentId, fileName)
                      }
                    />
                  </Box>
                )}

                {saveError && <Alert severity="error">{saveError}</Alert>}

                <TextField
                  fullWidth
                  type="number"
                  label="Score (%)"
                  value={scoreInput}
                  onChange={(event) => setScoreInput(event.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                  disabled={isSaving}
                />

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Feedback"
                  value={feedbackInput}
                  onChange={(event) => setFeedbackInput(event.target.value)}
                  disabled={isSaving}
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReview} disabled={isSaving}>
              Close
            </Button>
            <Button variant="contained" onClick={handleSaveGrade} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default InstructorAssignmentsPage;
