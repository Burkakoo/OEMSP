/**
 * QuizTakingPage - Page for students to take a quiz
 */

import React, { useEffect, useState } from 'react';
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
import { fetchQuiz, submitQuiz, clearCurrentQuiz } from '../store/slices/quizSlice';
import QuizQuestion from '../components/quiz/QuizQuestion';
import QuizTimer from '../components/quiz/QuizTimer';
import { QuizAnswer } from '../types/quiz.types';

const QuizTakingPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { currentQuiz, isLoading, error, timeRemaining, isTimerActive } = useSelector(
    (state: RootState) => state.quiz
  );
  
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuiz(quizId));
    }

    return () => {
      dispatch(clearCurrentQuiz());
    };
  }, [quizId, dispatch]);

  useEffect(() => {
    if (currentQuiz) {
      setStartTime(new Date().toISOString());
      setAnswers(
        currentQuiz.questions.map((q) => ({
          questionId: q._id,
          answer: q.type === 'multi_select' ? [] : '',
        }))
      );
    }
  }, [currentQuiz]);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a))
    );
  };

  const handleNext = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizId) return;

    const result = await dispatch(
      submitQuiz({
        quizId,
        submission: {
          answers,
          startTime: startTime || undefined,
        },
      })
    );

    if (submitQuiz.fulfilled.match(result)) {
      navigate(`/quiz/${quizId}/results`);
    }
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

  if (!currentQuiz) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Quiz not found</Alert>
      </Container>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion._id);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">{currentQuiz.title}</Typography>
          {isTimerActive && timeRemaining !== null && (
            <QuizTimer onTimeUp={handleSubmit} />
          )}
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {currentQuiz.description}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
        </Typography>

        <QuizQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          answer={currentAnswer?.answer ?? ''}
          onAnswerChange={(questionId, answer) => handleAnswerChange(questionId, answer)}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="contained" color="success" onClick={handleSubmit}>
                Submit Quiz
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizTakingPage;
