import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachmentList from '@components/courses/AttachmentList';
import { AssignmentSubmission } from '@/types/assignment.types';

interface AssignmentSubmissionCardProps {
  submission: AssignmentSubmission | null;
  draftText: string;
  pendingFiles: File[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  onTextChange: (value: string) => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemovePendingFile: (index: number) => void;
  onSubmit: () => void;
  onDownloadAttachment: (attachmentId: string, fileName: string) => void;
}

const AssignmentSubmissionCard: React.FC<AssignmentSubmissionCardProps> = ({
  submission,
  draftText,
  pendingFiles,
  isLoading,
  isSubmitting,
  error,
  onTextChange,
  onFilesSelected,
  onRemovePendingFile,
  onSubmit,
  onDownloadAttachment,
}) => {
  const canSubmit =
    Boolean(draftText.trim()) ||
    pendingFiles.length > 0 ||
    Boolean(submission && submission.attachments.length > 0);

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Assignment Submission</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {submission && (
            <Chip
              label={submission.status === 'graded' ? 'Graded' : 'Submitted'}
              color={submission.status === 'graded' ? 'success' : 'warning'}
              size="small"
            />
          )}
          {submission?.score !== undefined && (
            <Chip label={`Score: ${submission.score}%`} color="primary" size="small" />
          )}
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Submit an essay response, supporting files, or both. You can resubmit to append more files
        and update your written response.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          {submission && (
            <Alert severity={submission.status === 'graded' ? 'success' : 'info'} sx={{ mb: 2 }}>
              Submitted {new Date(submission.submittedAt).toLocaleString()}
              {submission.gradedAt ? ` • Graded ${new Date(submission.gradedAt).toLocaleString()}` : ''}
            </Alert>
          )}

          {submission?.feedback && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Instructor feedback:</strong> {submission.feedback}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            minRows={6}
            label="Your submission"
            value={draftText}
            onChange={(event) => onTextChange(event.target.value)}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <input
            id="assignment-upload"
            type="file"
            multiple
            hidden
            onChange={(event) => onFilesSelected(event.target.files)}
          />
          <label htmlFor="assignment-upload">
            <Button
              component="span"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={isSubmitting}
              sx={{ mb: 1 }}
            >
              Add Files
            </Button>
          </label>

          <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
            Accepted file types: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, TXT
          </Typography>

          {pendingFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                New files to upload
              </Typography>
              <List dense>
                {pendingFiles.map((file, index) => (
                  <ListItem
                    key={`${file.name}-${index}`}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => onRemovePendingFile(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={`${Math.round((file.size / (1024 * 1024)) * 100) / 100} MB`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {submission?.attachments && submission.attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Submitted files
              </Typography>
              <AttachmentList
                attachments={submission.attachments}
                onDownload={onDownloadAttachment}
              />
            </Box>
          )}

          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting || isLoading}
          >
            {isSubmitting
              ? 'Submitting...'
              : submission
                ? 'Update Submission'
                : 'Submit Assignment'}
          </Button>
        </>
      )}
    </Paper>
  );
};

export default AssignmentSubmissionCard;
