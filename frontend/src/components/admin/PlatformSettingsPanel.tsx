import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { PlatformSettings } from '@/services/platformSettings.service';

interface PlatformSettingsPanelProps {
  settings: PlatformSettings | null;
  isSaving?: boolean;
  error?: string | null;
  onSave: (settings: Partial<PlatformSettings>) => Promise<void>;
}

const PlatformSettingsPanel: React.FC<PlatformSettingsPanelProps> = ({
  settings,
  isSaving = false,
  error,
  onSave,
}) => {
  const [draft, setDraft] = useState<PlatformSettings | null>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  if (!draft) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">No platform settings available.</Typography>
      </Paper>
    );
  }

  const handleSubmit = async () => {
    await onSave(draft);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Platform Settings
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" gutterBottom>
            Payment
          </Typography>
          <TextField
            fullWidth
            label="Enabled Methods"
            value={draft.payment.enabledMethods.join(', ')}
            onChange={(event) =>
              setDraft({
                ...draft,
                payment: {
                  ...draft.payment,
                  enabledMethods: event.target.value
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                },
              })
            }
            helperText="Comma-separated payment method keys"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.payment.allowSubscriptions}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    payment: {
                      ...draft.payment,
                      allowSubscriptions: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Enable subscriptions"
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.payment.allowBundles}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    payment: {
                      ...draft.payment,
                      allowBundles: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Enable course bundles"
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.payment.allowRefunds}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    payment: {
                      ...draft.payment,
                      allowRefunds: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Enable refunds"
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.payment.allowAffiliates}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    payment: {
                      ...draft.payment,
                      allowAffiliates: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Enable affiliates"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" gutterBottom>
            Moderation & Notifications
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={draft.moderation.requireCourseReviewBeforePublish}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    moderation: {
                      ...draft.moderation,
                      requireCourseReviewBeforePublish: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Require course review before publish"
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.certificates.includeSkills}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    certificates: {
                      ...draft.certificates,
                      includeSkills: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Include skills on certificates"
          />
          <TextField
            fullWidth
            type="number"
            label="Reminder Hours Before Deadline"
            value={draft.notifications.missedDeadlineReminderHours}
            onChange={(event) =>
              setDraft({
                ...draft,
                notifications: {
                  ...draft.notifications,
                  missedDeadlineReminderHours: Number(event.target.value || 24),
                },
              })
            }
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Public Verification Base URL"
            value={draft.certificates.publicVerificationBaseUrl || ''}
            onChange={(event) =>
              setDraft({
                ...draft,
                certificates: {
                  ...draft.certificates,
                  publicVerificationBaseUrl: event.target.value,
                },
              })
            }
          />
        </Grid>
      </Grid>
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </Paper>
  );
};

export default PlatformSettingsPanel;
