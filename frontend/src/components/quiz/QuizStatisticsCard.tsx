/**
 * QuizStatisticsCard - Displays quiz statistics for instructors/admins
 */

import React from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { quizService } from '../../services/quiz.service';
import { QuizStatistics } from '../../types/quiz.types';

interface QuizStatisticsCardProps {
  quizId: string;
}

const QuizStatisticsCard: React.FC<QuizStatisticsCardProps> = ({ quizId }) => {
  const [stats, setStats] = React.useState<QuizStatistics | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async () => {
    if (!quizId) return;

    try {
      setIsLoading(true);
      setError(null);
      const resp = await quizService.getQuizStatistics(quizId);
      setStats(resp.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load quiz statistics');
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  React.useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (!quizId) {
    return <Alert severity="info">Select a quiz to view statistics.</Alert>;
  }

  if (isLoading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Overview</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => void loadStats()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!stats ? (
        <Alert severity="info">No statistics available.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Total Attempts
            </Typography>
            <Typography variant="h6">{stats.totalAttempts}</Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Unique Students
            </Typography>
            <Typography variant="h6">{stats.uniqueStudents}</Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Pass Rate
            </Typography>
            <Typography variant="h6">{stats.passRate}%</Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Average Score
            </Typography>
            <Typography variant="h6">{stats.averageScore}</Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Average Percentage
            </Typography>
            <Typography variant="h6">{stats.averagePercentage}%</Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, flex: '1 1 200px', minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Score Range
            </Typography>
            <Typography variant="h6">
              {stats.lowestScore} - {stats.highestScore}
            </Typography>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default QuizStatisticsCard;
