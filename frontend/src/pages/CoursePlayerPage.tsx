/**
 * Course player page for enrolled students
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppDispatch, useAppSelector } from '@hooks/useAppDispatch';
import { fetchCourse, clearCurrentCourse } from '@store/slices/courseSlice';
import ModuleList from '@components/courses/ModuleList';
import LessonList from '@components/courses/LessonList';
import AttachmentList from '@components/courses/AttachmentList';
import { courseService } from '@services/course.service';

const CoursePlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, isLoading } = useAppSelector((state) => state.courses);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourse(id));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (currentCourse && currentCourse.modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(currentCourse.modules[0]._id);
    }
  }, [currentCourse, selectedModuleId]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleDownloadAttachment = async (attachmentId: string, fileName: string) => {
    try {
      const blob = await courseService.downloadAttachment(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!currentCourse) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography>Course not found</Typography>
          <Button onClick={handleBack}>Back to Dashboard</Button>
        </Box>
      </Container>
    );
  }

  const selectedModule = currentCourse.modules.find((m: any) => m._id === selectedModuleId);
  const selectedLesson = selectedModule?.lessons.find((l: any) => l._id === selectedLessonId);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        <Typography variant="h4" gutterBottom>
          {currentCourse.title}
        </Typography>

        <Grid container spacing={3}>
          <Grid>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Course Content
              </Typography>
              <ModuleList
                modules={currentCourse.modules}
                onSelectModule={setSelectedModuleId}
              />
            </Paper>
          </Grid>

          <Grid>
            {selectedModule && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedModule.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedModule.description}
                </Typography>
                <LessonList
                  lessons={selectedModule.lessons}
                  onPlay={setSelectedLessonId}
                />
              </Paper>
            )}

            {selectedLesson && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {selectedLesson.title}
                </Typography>
                {selectedLesson.videoUrl && (
                  <Box sx={{ mb: 3, aspectRatio: '16/9', bgcolor: 'black' }}>
                    <Typography color="white" sx={{ p: 2 }}>
                      Video Player Placeholder: {selectedLesson.videoUrl}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body1" paragraph>
                  {selectedLesson.content}
                </Typography>
                {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Attachments
                    </Typography>
                    <AttachmentList
                      attachments={selectedLesson.attachments}
                      onDownload={handleDownloadAttachment}
                    />
                  </Box>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CoursePlayerPage;
