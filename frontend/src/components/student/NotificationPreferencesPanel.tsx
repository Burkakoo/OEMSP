import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { NotificationPreferences } from '@/services/notificationPreference.service';

interface NotificationPreferencesPanelProps {
  preferences: NotificationPreferences | null;
  error?: string | null;
  isSaving?: boolean;
  onSave: (preferences: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({
  preferences,
  error,
  isSaving = false,
  onSave,
}) => {
  const [draft, setDraft] = useState<NotificationPreferences | null>(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  if (!draft) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Loading notification preferences...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Typography variant="subtitle1" gutterBottom>
        Channels
      </Typography>
      <Stack>
        <FormControlLabel
          control={
            <Switch
              checked={draft.channels.inApp}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  channels: { ...draft.channels, inApp: event.target.checked },
                })
              }
            />
          }
          label="In-app notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={draft.channels.email}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  channels: { ...draft.channels, email: event.target.checked },
                })
              }
            />
          }
          label="Email notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={draft.channels.sms}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  channels: { ...draft.channels, sms: event.target.checked },
                })
              }
            />
          }
          label="SMS notifications"
        />
        <FormControlLabel
          control={
            <Switch
              checked={draft.channels.push}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  channels: { ...draft.channels, push: event.target.checked },
                })
              }
            />
          }
          label="Push notifications"
        />
      </Stack>

      <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
        Event Triggers
      </Typography>
      <Stack>
        {Object.entries(draft.triggers).map(([key, value]) => (
          <FormControlLabel
            key={key}
            control={
              <Switch
                checked={value}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    triggers: {
                      ...draft.triggers,
                      [key]: event.target.checked,
                    },
                  })
                }
              />
            }
            label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}
          />
        ))}
      </Stack>

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => onSave(draft)}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </Paper>
  );
};

export default NotificationPreferencesPanel;
