/**
 * Quiz results component
 */

import React from 'react';
import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { QuizResult } from '../../types/quiz.types';

interface QuizResultsProps {
  result: QuizResult;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result }) => {
  const quizMeta = typeof result.quizId === 'object' ? result.quizId : undefined;

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
        <Box sx={{ mb: 2 }}>
          {result.passed ? (
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
          ) : (
            <CancelIcon sx={{ fontSize: 80, color: 'error.main' }} />
          )}
        </Box>
        <Typography variant="h4" gutterBottom>
          {result.passed ? 'Congratulations!' : 'Keep Trying!'}
        </Typography>
        {quizMeta?.title && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {quizMeta.title}
          </Typography>
        )}
        <Typography variant="body1" color="text.secondary" paragraph>
          {result.passed
            ? 'You have passed the quiz!'
            : 'You did not pass this time. Review the material and try again.'}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h2" color="primary" gutterBottom>
            {result.percentage}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Score: {result.score} points
          </Typography>
        </Box>

        <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
          <LinearProgress
            variant="determinate"
            value={result.percentage}
            sx={{ height: 10, borderRadius: 5 }}
            color={result.passed ? 'success' : 'error'}
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Chip
            label={`Attempt ${result.attemptNumber}`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quiz Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Submitted: {new Date(result.submittedAt).toLocaleString()}
        </Typography>
        {quizMeta?.passingScore !== undefined && (
          <Typography variant="body2" color="text.secondary">
            Passing Score: {quizMeta.passingScore}%
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default QuizResults;
