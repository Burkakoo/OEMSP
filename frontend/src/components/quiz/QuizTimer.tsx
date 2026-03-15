/**
 * Quiz timer component
 */

import React, { useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { decrementTimer } from '../../store/slices/quizSlice';

interface QuizTimerProps {
  onTimeUp?: () => void;
}

const QuizTimer: React.FC<QuizTimerProps> = ({ onTimeUp }) => {
  const dispatch = useAppDispatch();
  const { timeRemaining, isTimerActive } = useAppSelector((state) => state.quiz);

  useEffect(() => {
    if (!isTimerActive || timeRemaining === null) return;

    const interval = setInterval(() => {
      dispatch(decrementTimer());
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, dispatch]);

  useEffect(() => {
    if (timeRemaining === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  if (timeRemaining === null) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining < 300; // Less than 5 minutes

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: isLowTime ? 'error.light' : 'background.paper',
        color: isLowTime ? 'error.contrastText' : 'text.primary',
      }}
    >
      <AccessTimeIcon />
      <Box>
        <Typography variant="caption" display="block">
          Time Remaining
        </Typography>
        <Typography variant="h6">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </Typography>
      </Box>
    </Paper>
  );
};

export default QuizTimer;
