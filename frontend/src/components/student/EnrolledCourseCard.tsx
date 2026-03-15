/**
 * Enrolled course card component
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  CardActions,
  LinearProgress,
} from '@mui/material';
import { Enrollment } from '../../types/enrollment.types';

interface EnrolledCourseCardProps {
  enrollment: Enrollment;
  onContinue?: (enrollmentId: string) => void;
  onViewCertificate?: (enrollmentId: string) => void;
}

const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({
  enrollment,
  onContinue,
  onViewCertificate,
}) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="160"
        image={enrollment.course?.thumbnail || 'https://via.placeholder.com/400x160?text=Course'}
        alt={enrollment.course?.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {enrollment.course?.title}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {enrollment.completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={enrollment.completionPercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        {enrollment.isCompleted && (
          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
            ✓ Completed on {new Date(enrollment.completedAt!).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        {enrollment.isCompleted ? (
          <Button size="small" onClick={() => onViewCertificate?.(enrollment._id)}>
            View Certificate
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={() => onContinue?.(enrollment._id)}
          >
            Continue Learning
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default EnrolledCourseCard;
