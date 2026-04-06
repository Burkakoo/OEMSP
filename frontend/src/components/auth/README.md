# Authentication Popup Components

This directory contains popup versions of the login and register forms for the e-learning platform.

## Components

### LoginPopup
A modal dialog version of the login form with the following features:
- Email and password validation
- Error handling and display
- Loading states
- Links to register and forgot password
- Close button in the header

### RegisterPopup
A modal dialog version of the register form with the following features:
- Multi-step registration (form + email verification)
- First name, last name, email, role, and password fields
- Password confirmation validation
- Email verification with OTP code
- Error handling and success messages
- Loading states
- Links to login

## Usage

```tsx
import React, { useState } from 'react';
import { LoginPopup, RegisterPopup } from './components/auth';

const MyComponent: React.FC = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const handleLoginSuccess = () => {
    console.log('User logged in successfully');
    // Handle successful login
  };

  const handleRegisterSuccess = () => {
    console.log('User registered successfully');
    // Handle successful registration
  };

  return (
    <>
      <button onClick={() => setLoginOpen(true)}>Login</button>
      <button onClick={() => setRegisterOpen(true)}>Register</button>

      <LoginPopup
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onRegisterClick={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
        onForgotPasswordClick={() => {
          // Handle forgot password
        }}
      />

      <RegisterPopup
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
        onLoginClick={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </>
  );
};
```

## Props

### LoginPopup Props
- `open`: boolean - Controls dialog visibility
- `onClose`: () => void - Called when dialog should close
- `onSuccess`: () => void - Called after successful login
- `onRegisterClick`: () => void - Called when user clicks register link
- `onForgotPasswordClick`: () => void - Called when user clicks forgot password link

### RegisterPopup Props
- `open`: boolean - Controls dialog visibility
- `onClose`: () => void - Called when dialog should close
- `onSuccess`: () => void - Called after successful registration and verification
- `onLoginClick`: () => void - Called when user clicks login link

## Features

- **Responsive Design**: Works on desktop and mobile
- **Material-UI Integration**: Uses MUI Dialog, TextField, Button components
- **Redux Integration**: Connects to auth slice for state management
- **Form Validation**: Client-side validation with error messages
- **Loading States**: Shows loading indicators during API calls
- **Error Handling**: Displays API errors and validation errors
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Styling

The popups use Material-UI's Dialog component with custom styling:
- Rounded corners (`borderRadius: 2`)
- Proper spacing and padding
- Responsive max width (`maxWidth="sm"`)
- Centered actions with column layout

## Dependencies

- React
- Material-UI (@mui/material, @mui/icons-material)
- Redux Toolkit (for state management)
- Existing auth types and services