/**
 * File upload component for lesson attachments
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
  uploadedFiles?: Array<{ _id: string; fileName: string; fileSize: number }>;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onDelete,
  uploadedFiles = [],
  maxSize = 50,
  allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      event.target.value = '';
    } catch (err) {
      setError((err as Error).message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!onDelete) return;

    try {
      await onDelete(fileId);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete file');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <input
          accept={allowedTypes.join(',')}
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={disabled || uploading}
          >
            Upload Attachment
          </Button>
        </label>
        <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
          Max size: {maxSize}MB. Allowed types: {allowedTypes.join(', ')}
        </Typography>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <List>
          {uploadedFiles.map((file) => (
            <ListItem
              key={file._id}
              secondaryAction={
                onDelete && (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(file._id)}
                    disabled={disabled}
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={file.fileName}
                secondary={formatFileSize(file.fileSize)}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;
