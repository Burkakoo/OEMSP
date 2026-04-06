import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  useLocalization,
} from '@/context/LocalizationContext';

const LocalizationControls: React.FC = () => {
  const theme = useTheme();
  const { t, language, currency, timezone, timeZoneOptions, setLanguage, setCurrency, setTimezone } =
    useLocalization();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        onClick={(event) => setAnchorEl(event.currentTarget)}
        color="inherit"
        variant="text"
        startIcon={<TranslateRoundedIcon fontSize="small" />}
        sx={{
          borderRadius: 999,
          color: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.2),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.24),
          },
        }}
      >
        {LANGUAGE_OPTIONS.find((option) => option.value === language)?.label || language}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2.25, width: 320 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">{t('localization')}</Typography>

            <FormControl size="small" fullWidth>
              <InputLabel>{t('language')}</InputLabel>
              <Select
                value={language}
                label={t('language')}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>{t('currency')}</InputLabel>
              <Select
                value={currency}
                label={t('currency')}
                onChange={(event) => setCurrency(event.target.value as typeof currency)}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>{t('timezone')}</InputLabel>
              <Select
                value={timezone}
                label={t('timezone')}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {timeZoneOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

export default LocalizationControls;
