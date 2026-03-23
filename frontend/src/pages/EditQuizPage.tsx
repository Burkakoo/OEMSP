/**
 * EditQuizPage - Page for instructors to edit an existing quiz
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Divider,
} from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchQuiz, clearCurrentQuiz } from '../store/slices/quizSlice';
import { quizService } from '../services/quiz.service';
import QuizForm from '../components/quiz/QuizForm';
import { Quiz } from '../types/quiz.types';
import QuizStatisticsCard from '../components/quiz/QuizStatisticsCard';

const EditQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = React.useState<string | null>(null);

  const { currentQuiz, isLoading, error: fetchError } = useSelector(
    (state: RootState) => state.quiz
  );

  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuiz(quizId));
    }

    return () => {
      dispatch(clearCurrentQuiz());
    };
  }, [quizId, dispatch]);

  const handleSubmit = async (quizData: Partial<Quiz>) => {
    if (!quizId) {
      setError('Quiz ID is required');
      return;
    }

    try {
      // Avoid sending moduleId updates (backend does not support changing module for existing quizzes)
      const { moduleId, ...updates } = quizData as any;
      await quizService.updateQuiz(quizId, updates);

      const cId = (currentQuiz?.courseId as any)?._id || currentQuiz?.courseId;
      if (typeof cId === 'string' && cId) {
        navigate(`/instructor/courses/${cId}/edit`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to update quiz');
    }
  };

  const handleCancel = () => {
    const cId = (currentQuiz?.courseId as any)?._id || currentQuiz?.courseId;
    if (typeof cId === 'string' && cId) {
      navigate(`/instructor/courses/${cId}/edit`);
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (fetchError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{fetchError}</Alert>
      </Container>
    );
  }

  if (!currentQuiz) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Quiz not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Edit Quiz
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <QuizForm
          initialData={currentQuiz}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Quiz Statistics
        </Typography>

        <QuizStatisticsCard quizId={quizId || ''} />
      </Paper>
    </Container>
  );
};

export default EditQuizPage;
