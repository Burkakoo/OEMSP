/**
 * PendingInstructorApprovals component - Manages pending instructor approvals
 */

import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface PendingInstructor {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  profile?: {
    bio?: string;
  };
}

interface PendingInstructorApprovalsProps {
  instructors: PendingInstructor[];
  onApprove: (instructorId: string) => void;
  onReject: (instructorId: string) => void;
}

const PendingInstructorApprovals: React.FC<PendingInstructorApprovalsProps> = ({
  instructors,
  onApprove,
  onReject,
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Pending Instructor Approvals</Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve or reject instructor applications
        </Typography>
      </Box>

      {instructors.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No pending instructor approvals
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Bio</TableCell>
                <TableCell>Applied</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instructors.map((instructor) => (
                <TableRow key={instructor._id}>
                  <TableCell>
                    {instructor.firstName} {instructor.lastName}
                  </TableCell>
                  <TableCell>{instructor.email}</TableCell>
                  <TableCell>
                    {instructor.profile?.bio ? (
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {instructor.profile.bio}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No bio provided
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(instructor.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip label="Pending" color="warning" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => onApprove(instructor._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => onReject(instructor._id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default PendingInstructorApprovals;
