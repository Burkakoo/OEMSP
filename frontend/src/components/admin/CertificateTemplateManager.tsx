import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CertificateTemplate } from '@/services/certificateTemplate.service';

interface CertificateTemplateManagerProps {
  templates: CertificateTemplate[];
  error?: string | null;
  onCreate: (payload: Omit<CertificateTemplate, '_id'>) => Promise<void>;
  onUpdate: (
    templateId: string,
    payload: Partial<Omit<CertificateTemplate, '_id'>>
  ) => Promise<void>;
}

const CertificateTemplateManager: React.FC<CertificateTemplateManagerProps> = ({
  templates,
  error,
  onCreate,
  onUpdate,
}) => {
  const [form, setForm] = useState<Omit<CertificateTemplate, '_id'>>({
    name: '',
    slug: '',
    organizationName: '',
    accentColor: '#A66A00',
    backgroundColor: '#FFF8EA',
    signatureName: '',
    signatureTitle: '',
    footerText: '',
    isDefault: false,
    isActive: true,
  });

  const handleCreate = async () => {
    await onCreate(form);
    setForm({
      name: '',
      slug: '',
      organizationName: '',
      accentColor: '#A66A00',
      backgroundColor: '#FFF8EA',
      signatureName: '',
      signatureTitle: '',
      footerText: '',
      isDefault: false,
      isActive: true,
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Certificate Templates
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Template Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <TextField
          label="Slug"
          value={form.slug}
          onChange={(event) => setForm({ ...form, slug: event.target.value })}
        />
        <TextField
          label="Organization Name"
          value={form.organizationName}
          onChange={(event) =>
            setForm({ ...form, organizationName: event.target.value })
          }
        />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Accent Color"
            value={form.accentColor}
            onChange={(event) => setForm({ ...form, accentColor: event.target.value })}
          />
          <TextField
            label="Background Color"
            value={form.backgroundColor}
            onChange={(event) =>
              setForm({ ...form, backgroundColor: event.target.value })
            }
          />
        </Box>
        <TextField
          label="Footer Text"
          value={form.footerText || ''}
          onChange={(event) => setForm({ ...form, footerText: event.target.value })}
        />
        <Button variant="contained" onClick={handleCreate}>
          Create Template
        </Button>
      </Stack>

      <Stack spacing={2}>
        {templates.map((template) => (
          <Paper key={template._id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle1">{template.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {template.organizationName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {template.isDefault && <Chip label="Default" size="small" color="success" />}
                  <Chip
                    label={template.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={template.isActive ? 'primary' : 'default'}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!template.isDefault && (
                  <Button
                    size="small"
                    onClick={() => onUpdate(template._id, { isDefault: true })}
                  >
                    Make Default
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() =>
                    onUpdate(template._id, { isActive: !template.isActive })
                  }
                >
                  {template.isActive ? 'Disable' : 'Enable'}
                </Button>
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
};

export default CertificateTemplateManager;
