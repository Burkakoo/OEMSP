/**
 * CreateQuizPage - Page for instructors to create a new quiz
 */

import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Typography, Alert, CircularProgress, Box } from '@mui/material';
import { quizService } from '../services/quiz.service';
import { courseService } from '../services/course.service';
import QuizForm from '../components/quiz/QuizForm';
import { Quiz } from '../types/quiz.types';
import { Module } from '../types/course.types';

const CreateQuizPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [isLoadingCourse, setIsLoadingCourse] = React.useState(false);

  React.useEffect(() => {
    if (!courseId) return;

    setIsLoadingCourse(true);
    courseService
      .getCourse(courseId)
      .then((resp) => {
        setModules(resp.data.modules || []);
      })
      .catch((err) => {
        setError((err as Error).message || 'Failed to load course modules');
      })
      .finally(() => {
        setIsLoadingCourse(false);
      });
  }, [courseId]);

  const defaultModuleId = searchParams.get('moduleId') || undefined;

  const handleSubmit = async (quizData: Partial<Quiz>) => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    try {
      await quizService.createQuiz(courseId, quizData);
      navigate(`/instructor/courses/${courseId}/edit`);
    } catch (err) {
      setError((err as Error).message || 'Failed to create quiz');
    }
  };

  const handleCancel = () => {
    if (courseId) {
      navigate(`/instructor/courses/${courseId}/edit`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Quiz
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isLoadingCourse ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <QuizForm
            courseId={courseId}
            modules={modules}
            defaultModuleId={defaultModuleId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </Paper>
    </Container>
  );
};

export default CreateQuizPage;
