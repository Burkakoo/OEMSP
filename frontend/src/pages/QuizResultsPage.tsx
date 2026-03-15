/**
 * QuizResultsPage - Page to display quiz results
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchQuizResults, clearCurrentResult } from '../store/slices/quizSlice';
import QuizResults from '../components/quiz/QuizResults';
import { quizService } from '../services/quiz.service';

const QuizResultsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [courseId, setCourseId] = React.useState<string | null>(null);
  
  const { currentResult, isLoading, error } = useSelector(
    (state: RootState) => state.quiz
  );

  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuizResults(quizId));
      // Fetch quiz metadata for navigation (courseId)
      quizService
        .getQuiz(quizId)
        .then((resp) => {
          const cId = (resp.data.courseId as any)?._id || resp.data.courseId;
          setCourseId(typeof cId === 'string' ? cId : null);
        })
        .catch(() => {
          // Ignore - we can still navigate back to dashboard
        });
    }

    return () => {
      dispatch(clearCurrentResult());
    };
  }, [quizId, dispatch]);

  const handleRetakeQuiz = () => {
    if (quizId) {
      navigate(`/quiz/${quizId}`);
    }
  };

  const handleBackToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`);
      return;
    }

    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentResult) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">No results found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Quiz Results
        </Typography>

        <QuizResults result={currentResult} />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button variant="outlined" onClick={handleBackToCourse}>
            Back to Course
          </Button>
          
          {typeof currentResult.quizId === 'object' &&
           currentResult.quizId.maxAttempts &&
           currentResult.attemptNumber < currentResult.quizId.maxAttempts && (
            <Button variant="contained" onClick={handleRetakeQuiz}>
              Retake Quiz
            </Button>
          )}
          
          {typeof currentResult.quizId !== 'object' && (
            <Button variant="contained" onClick={handleRetakeQuiz}>
              Retake Quiz
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizResultsPage;
