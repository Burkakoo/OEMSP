import React from 'react';
import {
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

interface AuthPageShellProps {
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  stats: Array<{
    label: string;
    value: string;
  }>;
  children: React.ReactNode;
}

const AuthPageShell: React.FC<AuthPageShellProps> = ({
  badge,
  title,
  description,
  highlights,
  stats,
  children,
}) => {
  return (
    <Box
      sx={(theme) => ({
        py: { xs: 4, md: 6 },
        minHeight: { md: 'calc(100vh - 190px)' },
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `radial-gradient(700px 340px at 0% 10%, ${alpha(
          theme.palette.primary.main,
          0.14
        )} 0%, rgba(0,0,0,0) 70%), radial-gradient(600px 320px at 100% 0%, ${alpha(
          theme.palette.secondary.main,
          0.14
        )} 0%, rgba(0,0,0,0) 65%)`,
      })}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3.5} alignItems="stretch">
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              sx={(theme) => ({
                height: '100%',
                p: { xs: 3, md: 4 },
                borderRadius: 8,
                backgroundImage: `linear-gradient(145deg, ${alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'light' ? 0.12 : 0.18
                )} 0%, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.08 : 0.16)} 100%)`,
              })}
            >
              <Stack spacing={3} sx={{ height: '100%', justifyContent: 'space-between' }}>
                <Stack spacing={2.25}>
                  <Chip label={badge} color="primary" sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="h2">{title}</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460 }}>
                    {description}
                  </Typography>

                  <Stack spacing={1.25}>
                    {highlights.map((highlight) => (
                      <Stack key={highlight} direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={(theme) => ({
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                          })}
                        >
                          <CheckCircleRoundedIcon fontSize="small" />
                        </Box>
                        <Typography variant="body2">{highlight}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>

                <Grid container spacing={1.5}>
                  {stats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 4, md: 12 }} key={stat.label}>
                      <Paper
                        elevation={0}
                        sx={(theme) => ({
                          p: 2,
                          borderRadius: 5,
                          bgcolor:
                            theme.palette.mode === 'light'
                              ? alpha(theme.palette.background.paper, 0.8)
                              : alpha(theme.palette.common.black, 0.16),
                        })}
                      >
                        <Typography variant="h5">{stat.value}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              elevation={0}
              sx={(theme) => ({
                p: { xs: 3, md: 4 },
                borderRadius: 8,
                backgroundColor: alpha(theme.palette.background.paper, 0.92),
                backdropFilter: 'blur(20px)',
              })}
            >
              {children}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthPageShell;
