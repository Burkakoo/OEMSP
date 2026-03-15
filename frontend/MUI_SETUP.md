# Material-UI Setup Documentation

## Overview

Material-UI (MUI) has been successfully configured for the MERN Education Platform frontend. This document provides information about the setup and usage.

## Installed Packages

The following packages have been installed:

- `@mui/material` - Core Material-UI components
- `@mui/icons-material` - Material Design icons
- `@emotion/react` - Required peer dependency for MUI styling
- `@emotion/styled` - Required peer dependency for MUI styling

## Configuration

### Theme Configuration

A custom theme has been created in `src/theme.ts` with:

- **Primary Color**: Blue (#1976d2)
- **Secondary Color**: Purple (#9c27b0)
- **Custom Typography**: System font stack for optimal performance
- **Component Overrides**: Button text transform disabled for better UX

### Integration

The MUI theme is integrated in `src/main.tsx` using:

- `ThemeProvider` - Provides theme to all components
- `CssBaseline` - Normalizes CSS across browsers and provides baseline styles

## Usage Examples

### Importing Components

```typescript
import { Button, Typography, Box, TextField } from '@mui/material';
import { Home, Settings, Person } from '@mui/icons-material';
```

### Using Components

```typescript
<Button variant="contained" color="primary">
  Click Me
</Button>

<Typography variant="h4" gutterBottom>
  Heading Text
</Typography>

<Box sx={{ p: 2, bgcolor: 'primary.main' }}>
  Content
</Box>
```

### Using Icons

```typescript
import { Home as HomeIcon } from '@mui/icons-material';

<Button startIcon={<HomeIcon />}>
  Home
</Button>
```

## Common Components for LMS

The following MUI components will be particularly useful for the education platform:

### Layout
- `Container` - Responsive container
- `Grid` - Responsive grid system
- `Box` - Flexible box component
- `Stack` - One-dimensional layout
- `AppBar` - Top navigation bar
- `Drawer` - Side navigation drawer

### Navigation
- `Tabs` - Tab navigation
- `Breadcrumbs` - Breadcrumb navigation
- `Pagination` - Page navigation
- `BottomNavigation` - Mobile bottom navigation

### Forms
- `TextField` - Text input
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `Radio` - Radio button
- `Switch` - Toggle switch
- `Slider` - Range slider
- `Autocomplete` - Autocomplete input

### Data Display
- `Card` - Content card
- `List` - List component
- `Table` - Data table
- `Chip` - Compact element
- `Avatar` - User avatar
- `Badge` - Notification badge
- `Tooltip` - Hover tooltip

### Feedback
- `Alert` - Alert messages
- `Snackbar` - Toast notifications
- `Dialog` - Modal dialogs
- `Progress` - Progress indicators
- `Skeleton` - Loading placeholders

### Course-Specific Components
- `Stepper` - Course progress stepper
- `LinearProgress` - Course completion progress
- `Rating` - Course ratings
- `Accordion` - Expandable course modules

## Styling Approaches

MUI supports multiple styling approaches:

### 1. sx Prop (Recommended)
```typescript
<Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 1 }}>
  Content
</Box>
```

### 2. styled() API
```typescript
import { styled } from '@mui/material/styles';

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
}));
```

### 3. makeStyles (Legacy)
Not recommended for new projects. Use sx prop or styled() instead.

## Responsive Design

MUI provides responsive utilities:

```typescript
// Responsive spacing
<Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

// Responsive display
<Box sx={{ display: { xs: 'none', md: 'block' } }}>

// Responsive grid
<Grid container spacing={{ xs: 2, md: 3 }}>
```

## Theme Customization

To customize the theme, edit `src/theme.ts`:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#your-color',
    },
  },
  typography: {
    fontFamily: 'Your Font',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Your overrides
        },
      },
    },
  },
});
```

## Resources

- [Material-UI Documentation](https://mui.com/material-ui/getting-started/)
- [Component API Reference](https://mui.com/material-ui/api/button/)
- [Icons Gallery](https://mui.com/material-ui/material-icons/)
- [Theme Configuration](https://mui.com/material-ui/customization/theming/)
- [sx Prop Documentation](https://mui.com/system/getting-started/the-sx-prop/)

## Next Steps

1. Create reusable component library in `src/components/`
2. Implement authentication forms using MUI components
3. Build course card and list components
4. Create dashboard layouts with MUI Grid
5. Implement responsive navigation with AppBar and Drawer

## Example Component

See `src/components/MuiExample.tsx` for a basic example of MUI usage. This component can be removed once actual components are implemented.
