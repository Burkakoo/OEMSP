# Authentication Service Documentation

## Overview

The Authentication Service provides comprehensive user authentication, authorization, and session management for the MERN Education Platform. It implements JWT-based authentication with refresh token rotation, Redis-backed token blacklisting, password management, and instructor approval workflows.

## Features

- **User Registration**: Email/password registration with role-based account creation
- **User Authentication**: Secure login with bcrypt password verification
- **JWT Token Management**: Access tokens (24h) and refresh tokens (7d) with rotation
- **Token Blacklisting**: Redis-based token revocation on logout
- **Password Management**: Password reset and change functionality
- **Instructor Approval**: Admin workflow for approving/rejecting instructor accounts
- **Security**: Protection against user enumeration, rate limiting support, secure token storage

## Architecture

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auth Service   │
├─────────────────┤
│ - register()    │
│ - login()       │
│ - logout()      │
│ - verifyToken() │
│ - refreshToken()│
│ - resetPassword│
│ - changePassword│
│ - approveInstr. │
│ - rejectInstr.  │
│ - getPending()  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│MongoDB │ │ Redis  │
│  User  │ │Tokens  │
└────────┘ └────────┘
```

## API Reference

### Registration

```typescript
async register(userData: RegisterDTO): Promise<AuthResponse>
```

Registers a new user with email, password, and role.

**Parameters:**
- `userData.email` (string): Valid email address
- `userData.password` (string): Password meeting strength requirements
- `userData.firstName` (string): User's first name
- `userData.lastName` (string): User's last name
- `userData.role` (UserRole): STUDENT, INSTRUCTOR, or ADMIN

**Returns:**
```typescript
{
  success: boolean;
  token?: string;           // JWT access token
  refreshToken?: string;    // JWT refresh token
  user?: UserProfile;       // User profile data
  error?: string;           // Error message if failed
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Behavior:**
- Students and admins are auto-approved (`isApproved: true`)
- Instructors require admin approval (`isApproved: false`)
- Passwords are hashed with bcrypt (12 salt rounds)
- Refresh token stored in Redis with 7-day TTL

**Example:**
```typescript
const result = await authService.register({
  email: 'student@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.STUDENT
});

if (result.success) {
  // Store tokens securely
  console.log('Access Token:', result.token);
  console.log('Refresh Token:', result.refreshToken);
}
```

### Login

```typescript
async login(credentials: LoginDTO): Promise<AuthResponse>
```

Authenticates user and generates JWT tokens.

**Parameters:**
- `credentials.email` (string): User's email
- `credentials.password` (string): User's password

**Returns:** Same as `register()`

**Security Features:**
- Generic error messages prevent user enumeration
- Checks account active status
- Verifies instructor approval status
- Updates `lastLoginAt` timestamp

**Example:**
```typescript
const result = await authService.login({
  email: 'student@example.com',
  password: 'SecurePass123!'
});

if (result.success) {
  // User authenticated successfully
  console.log('User:', result.user);
} else {
  console.error('Login failed:', result.error);
}
```

### Logout

```typescript
async logout(userId: string, token: string): Promise<void>
```

Logs out user by blacklisting their access token and removing refresh token.

**Parameters:**
- `userId` (string): User's ID
- `token` (string): JWT access token to blacklist

**Behavior:**
- Adds token to Redis blacklist with TTL matching token expiration
- Removes refresh token from Redis
- Throws error if operation fails

**Example:**
```typescript
try {
  await authService.logout(userId, accessToken);
  console.log('Logged out successfully');
} catch (error) {
  console.error('Logout failed:', error);
}
```

### Verify Token

```typescript
async verifyToken(token: string): Promise<TokenPayload>
```

Verifies JWT token validity and checks blacklist status.

**Parameters:**
- `token` (string): JWT access token

**Returns:**
```typescript
{
  userId: string;
  email: string;
  role: UserRole;
  iat: number;    // Issued at timestamp
  exp: number;    // Expiration timestamp
}
```

**Throws:**
- `"Token has been revoked"` - Token is blacklisted
- `"Token has expired"` - Token past expiration
- `"Invalid token"` - Malformed or invalid signature

**Example:**
```typescript
try {
  const payload = await authService.verifyToken(token);
  console.log('User ID:', payload.userId);
  console.log('Role:', payload.role);
} catch (error) {
  console.error('Token invalid:', error.message);
}
```

### Refresh Token

```typescript
async refreshToken(refreshToken: string): Promise<AuthResponse>
```

Generates new access and refresh tokens (token rotation).

**Parameters:**
- `refreshToken` (string): Current refresh token

**Returns:** Same as `register()`

**Behavior:**
- Verifies refresh token signature
- Checks token exists in Redis
- Validates user is active and approved (for instructors)
- Generates new token pair
- Stores new refresh token in Redis

**Example:**
```typescript
const result = await authService.refreshToken(oldRefreshToken);

if (result.success) {
  // Update stored tokens
  console.log('New Access Token:', result.token);
  console.log('New Refresh Token:', result.refreshToken);
}
```

### Reset Password

```typescript
async resetPassword(email: string): Promise<void>
```

Initiates password reset process by generating reset token.

**Parameters:**
- `email` (string): User's email address

**Behavior:**
- Generates JWT reset token (1 hour expiration)
- Stores token in Redis with key `password:reset:{userId}`
- Does not reveal if email exists (security)
- TODO: Send reset email with token

**Example:**
```typescript
await authService.resetPassword('user@example.com');
// Reset email sent (if user exists)
```

### Change Password

```typescript
async changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void>
```

Changes user's password after verifying current password.

**Parameters:**
- `userId` (string): User's ID
- `oldPassword` (string): Current password
- `newPassword` (string): New password

**Behavior:**
- Verifies old password is correct
- Validates new password strength
- Updates password (hashed by User model)
- Invalidates all refresh tokens (forces re-login)

**Throws:**
- `"User not found"` - Invalid user ID
- `"Current password is incorrect"` - Wrong old password
- Password validation errors - Weak new password

**Example:**
```typescript
try {
  await authService.changePassword(
    userId,
    'OldPassword123!',
    'NewPassword456!'
  );
  console.log('Password changed successfully');
} catch (error) {
  console.error('Password change failed:', error.message);
}
```

### Approve Instructor

```typescript
async approveInstructor(
  instructorId: string,
  adminId: string
): Promise<IUser>
```

Approves instructor account (admin only).

**Parameters:**
- `instructorId` (string): Instructor's user ID
- `adminId` (string): Admin's user ID

**Returns:** Updated user document

**Behavior:**
- Sets `isApproved: true`
- Records `approvedBy` and `approvedAt`
- TODO: Send approval notification email

**Throws:**
- `"Instructor not found"` - Invalid instructor ID
- `"User is not an instructor"` - Wrong role
- `"Instructor is already approved"` - Already approved

**Example:**
```typescript
try {
  const instructor = await authService.approveInstructor(
    instructorId,
    adminId
  );
  console.log('Instructor approved:', instructor.email);
} catch (error) {
  console.error('Approval failed:', error.message);
}
```

### Reject Instructor

```typescript
async rejectInstructor(
  instructorId: string,
  adminId: string,
  reason: string
): Promise<void>
```

Rejects instructor account by deactivating it (admin only).

**Parameters:**
- `instructorId` (string): Instructor's user ID
- `adminId` (string): Admin's user ID
- `reason` (string): Rejection reason

**Behavior:**
- Sets `isActive: false`
- TODO: Send rejection notification email with reason

**Throws:**
- `"Instructor not found"` - Invalid instructor ID
- `"User is not an instructor"` - Wrong role

**Example:**
```typescript
try {
  await authService.rejectInstructor(
    instructorId,
    adminId,
    'Insufficient qualifications'
  );
  console.log('Instructor rejected');
} catch (error) {
  console.error('Rejection failed:', error.message);
}
```

### Get Pending Instructors

```typescript
async getPendingInstructors(): Promise<IUser[]>
```

Retrieves list of instructors awaiting approval (admin only).

**Returns:** Array of user documents

**Behavior:**
- Filters: `role === INSTRUCTOR`, `isApproved === false`, `isActive === true`
- Sorted by `createdAt` descending (newest first)

**Example:**
```typescript
const pending = await authService.getPendingInstructors();
console.log(`${pending.length} instructors pending approval`);

pending.forEach(instructor => {
  console.log(`- ${instructor.email} (${instructor.firstName} ${instructor.lastName})`);
});
```

## Data Types

### RegisterDTO
```typescript
interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
```

### LoginDTO
```typescript
interface LoginDTO {
  email: string;
  password: string;
}
```

### AuthResponse
```typescript
interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: UserProfile;
  error?: string;
}
```

### UserProfile
```typescript
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isApproved: boolean;
}
```

### TokenPayload
```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
```

## Redis Keys

The service uses the following Redis key patterns:

- **Token Blacklist**: `blacklist:token:{token}` - TTL matches token expiration
- **Refresh Tokens**: `refresh:token:{userId}` - TTL: 7 days
- **Password Reset**: `password:reset:{userId}` - TTL: 1 hour

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (12 salt rounds)
- Password strength validation enforced
- Never logged or exposed in responses

### Token Security
- JWT tokens signed with 256-bit secrets
- Access tokens: 24-hour expiration
- Refresh tokens: 7-day expiration with rotation
- Tokens stored in HTTP-only cookies (recommended)
- Blacklisting prevents token reuse after logout

### User Enumeration Prevention
- Generic error messages for failed authentication
- Same response time for existing/non-existing users
- Password reset doesn't reveal user existence

### Instructor Approval
- Instructors cannot login until approved
- Admin tracking for accountability
- Rejection deactivates account

## Error Handling

All methods handle errors gracefully:

```typescript
try {
  const result = await authService.login(credentials);
  if (!result.success) {
    // Handle authentication failure
    console.error(result.error);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

## Testing

The service includes comprehensive unit tests covering:

- ✅ User registration (students, instructors, admins)
- ✅ Login validation and authentication
- ✅ Token generation and verification
- ✅ Token blacklisting and refresh
- ✅ Password management
- ✅ Instructor approval workflow
- ✅ Error handling and edge cases

Run tests:
```bash
npm test -- auth.service.test.ts
```

## Integration Example

```typescript
import authService from './services/auth.service';
import { UserRole } from './models/User';

// Registration
const registerResult = await authService.register({
  email: 'instructor@example.com',
  password: 'SecurePass123!',
  firstName: 'Jane',
  lastName: 'Smith',
  role: UserRole.INSTRUCTOR
});

// Login (will fail for unapproved instructor)
const loginResult = await authService.login({
  email: 'instructor@example.com',
  password: 'SecurePass123!'
});
// Error: "Account pending admin approval"

// Admin approves instructor
const instructor = await authService.approveInstructor(
  instructorId,
  adminId
);

// Now login succeeds
const successLogin = await authService.login({
  email: 'instructor@example.com',
  password: 'SecurePass123!'
});

// Verify token in middleware
const payload = await authService.verifyToken(successLogin.token!);

// Refresh token before expiration
const refreshed = await authService.refreshToken(successLogin.refreshToken!);

// Logout
await authService.logout(payload.userId, successLogin.token!);
```

## Environment Variables

Required environment variables:

```env
JWT_SECRET=your-256-bit-secret-key-here
REFRESH_TOKEN_SECRET=your-256-bit-refresh-secret-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

## Future Enhancements

- [ ] Email verification on registration
- [ ] Email notifications for password reset
- [ ] Email notifications for instructor approval/rejection
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Rate limiting per user
- [ ] Login attempt tracking and account lockout
- [ ] Password history to prevent reuse
- [ ] Session management dashboard

## Related Documentation

- [User Model Documentation](../models/User.ts)
- [Redis Configuration](../config/REDIS_CONFIG.md)
- [Environment Configuration](../config/README.md)

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
