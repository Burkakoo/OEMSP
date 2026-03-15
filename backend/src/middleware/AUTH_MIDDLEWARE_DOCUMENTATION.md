# Authentication Middleware Documentation

## Overview

The Authentication Middleware provides comprehensive JWT-based authentication, role-based access control (RBAC), and resource ownership verification for the MERN Education Platform. It integrates seamlessly with the Authentication Service to protect routes and verify user permissions.

## Features

- **JWT Verification**: Extract and verify JWT tokens from Authorization headers or cookies
- **Role-Based Access Control (RBAC)**: Restrict access based on user roles (student, instructor, admin)
- **Resource Ownership Verification**: Ensure users can only modify their own resources
- **Flexible Token Extraction**: Support for Bearer tokens and cookie-based authentication
- **Optional Authentication**: Allow endpoints to work with or without authentication
- **Comprehensive Error Handling**: Return appropriate HTTP status codes (401, 403, 404, 500)

## Architecture

```
┌─────────────────┐
│  HTTP Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Token   │ ← Authorization header or cookies
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Token    │ ← authService.verifyToken()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Attach User     │ ← req.user = TokenPayload
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Role      │ ← requireRole middleware
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Owner    │ ← requireOwnership middleware
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Route Handler   │
└─────────────────┘
```

## Middleware Functions

### 1. authenticate

Authenticates user by verifying JWT token and attaching user information to the request.

**Usage:**
```typescript
import { authenticate } from './middleware/auth.middleware';

router.get('/protected', authenticate, handler);
```

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header or `token` cookie
- Verifies token using `authService.verifyToken()`
- Attaches `TokenPayload` to `req.user`
- Returns 401 if token is missing, expired, invalid, or revoked

**Response Codes:**
- `401 Unauthorized`: No token, expired token, invalid token, or revoked token
- Calls `next()` on success

**Example:**
```typescript
// Protected route requiring authentication
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const user = await User.findById(userId);
  res.json({ user });
});
```

### 2. requireRole

Middleware factory that restricts access to specific user roles.

**Usage:**
```typescript
import { requireRole } from './middleware/auth.middleware';
import { UserRole } from './models/User';

// Single role
router.post('/courses', authenticate, requireRole(UserRole.INSTRUCTOR), handler);

// Multiple roles
router.get('/admin', authenticate, requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), handler);
```

**Parameters:**
- `roles`: `UserRole | UserRole[]` - Single role or array of allowed roles

**Behavior:**
- Must be used after `authenticate` middleware
- Checks if `req.user.role` matches one of the allowed roles
- Returns 403 if user doesn't have required role
- Returns 401 if user is not authenticated

**Response Codes:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User doesn't have required role
- Calls `next()` on success

**Example:**
```typescript
// Only instructors can create courses
router.post('/courses', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR), 
  createCourseHandler
);

// Admins and instructors can view analytics
router.get('/analytics', 
  authenticate, 
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), 
  analyticsHandler
);
```

### 3. requireOwnership

Middleware factory that verifies user owns the requested resource.

**Usage:**
```typescript
import { requireOwnership } from './middleware/auth.middleware';
import Course from './models/Course';

router.put('/courses/:id', 
  authenticate, 
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId' 
  }), 
  updateCourseHandler
);
```

**Parameters:**
```typescript
interface OwnershipOptions {
  paramName?: string;      // Parameter name containing resource ID (default: 'id')
  ownerField?: string;     // Field in resource containing owner ID (default: 'instructorId')
  model: any;              // Mongoose model to query
  allowAdmin?: boolean;    // Whether admins bypass check (default: true)
}
```

**Behavior:**
- Must be used after `authenticate` middleware
- Queries database for resource using `model.findById()`
- Compares resource's `ownerField` with `req.user.userId`
- Admins bypass ownership check by default (configurable)
- Returns 403 if user doesn't own the resource
- Returns 404 if resource not found

**Response Codes:**
- `400 Bad Request`: Missing resource ID parameter
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User doesn't own the resource
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Database error or missing ownership field
- Calls `next()` on success

**Examples:**
```typescript
// Verify course ownership (instructors only modify their courses)
router.put('/courses/:id', 
  authenticate, 
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId' 
  }), 
  updateCourseHandler
);

// Custom parameter name
router.delete('/courses/:courseId', 
  authenticate, 
  requireOwnership({ 
    model: Course, 
    paramName: 'courseId',
    ownerField: 'instructorId' 
  }), 
  deleteCourseHandler
);

// Enforce ownership even for admins
router.put('/quizzes/:id', 
  authenticate, 
  requireOwnership({ 
    model: Quiz, 
    ownerField: 'createdBy',
    allowAdmin: false 
  }), 
  updateQuizHandler
);
```

### 4. requireSelf

Middleware factory that verifies user is accessing their own profile.

**Usage:**
```typescript
import { requireSelf } from './middleware/auth.middleware';

// Default parameter name 'id'
router.put('/users/:id', authenticate, requireSelf(), updateProfileHandler);

// Custom parameter name
router.get('/users/:userId/profile', authenticate, requireSelf('userId'), getProfileHandler);
```

**Parameters:**
- `paramName`: `string` - Parameter name containing user ID (default: 'id')

**Behavior:**
- Must be used after `authenticate` middleware
- Compares `req.params[paramName]` with `req.user.userId`
- Admins can access any user profile
- Returns 403 if user tries to access another user's profile

**Response Codes:**
- `400 Bad Request`: Missing user ID parameter
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User trying to access another user's profile
- Calls `next()` on success

**Example:**
```typescript
// Users can only update their own profile
router.put('/users/:id', 
  authenticate, 
  requireSelf(), 
  async (req: AuthRequest, res) => {
    const userId = req.params.id;
    const updates = req.body;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    res.json({ user });
  }
);

// Admins can access any user
router.get('/users/:id', 
  authenticate, 
  requireSelf(), // Admin bypasses this check
  getUserHandler
);
```

### 5. optionalAuth

Attempts authentication but doesn't fail if no token is provided.

**Usage:**
```typescript
import { optionalAuth } from './middleware/auth.middleware';

router.get('/courses', optionalAuth, listCoursesHandler);
```

**Behavior:**
- Extracts token if present
- Verifies token and attaches user to request
- Continues without user if token is missing or invalid
- Never returns error responses
- Useful for endpoints with different behavior for authenticated vs anonymous users

**Example:**
```typescript
// Show different content for authenticated users
router.get('/courses', optionalAuth, async (req: AuthRequest, res) => {
  const courses = await Course.find({ isPublished: true });
  
  if (req.user) {
    // Authenticated user - include enrollment status
    const enrollments = await Enrollment.find({ studentId: req.user.userId });
    const coursesWithStatus = courses.map(course => ({
      ...course.toObject(),
      isEnrolled: enrollments.some(e => e.courseId.equals(course._id))
    }));
    return res.json({ courses: coursesWithStatus });
  }
  
  // Anonymous user - basic course list
  res.json({ courses });
});
```

## Extended Request Type

The middleware extends Express Request with user information:

```typescript
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;  // Issued at timestamp
  exp: number;  // Expiration timestamp
}
```

**Usage in Route Handlers:**
```typescript
import { AuthRequest } from './middleware/auth.middleware';

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  // TypeScript knows req.user exists after authenticate middleware
  const userId = req.user!.userId;
  const role = req.user!.role;
  
  const user = await User.findById(userId);
  res.json({ user });
});
```

## Error Handling

The middleware provides consistent error responses:

### Authentication Errors (401)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

```json
{
  "success": false,
  "error": "Token has expired"
}
```

```json
{
  "success": false,
  "error": "Invalid or revoked token"
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

```json
{
  "success": false,
  "error": "You do not have permission to access this resource"
}
```

```json
{
  "success": false,
  "error": "You can only access your own profile"
}
```

### Resource Errors (404)
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Missing id parameter"
}
```

## Common Usage Patterns

### Pattern 1: Public Endpoint
```typescript
// No authentication required
router.get('/courses', listCoursesHandler);
```

### Pattern 2: Authenticated Endpoint
```typescript
// Any authenticated user
router.get('/profile', authenticate, getProfileHandler);
```

### Pattern 3: Role-Based Endpoint
```typescript
// Only specific roles
router.post('/courses', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR), 
  createCourseHandler
);
```

### Pattern 4: Resource Ownership
```typescript
// User must own the resource
router.put('/courses/:id', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  requireOwnership({ model: Course, ownerField: 'instructorId' }), 
  updateCourseHandler
);
```

### Pattern 5: Self-Access Only
```typescript
// User can only access their own data
router.put('/users/:id', 
  authenticate, 
  requireSelf(), 
  updateUserHandler
);
```

### Pattern 6: Optional Authentication
```typescript
// Different behavior for authenticated users
router.get('/courses', 
  optionalAuth, 
  listCoursesWithEnrollmentStatus
);
```

### Pattern 7: Multiple Roles
```typescript
// Multiple roles allowed
router.get('/analytics', 
  authenticate, 
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]), 
  analyticsHandler
);
```

### Pattern 8: Admin Override
```typescript
// Admins can access any resource
router.delete('/courses/:id', 
  authenticate, 
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId',
    allowAdmin: true  // Admins bypass ownership check
  }), 
  deleteCourseHandler
);
```

## Complete Route Example

```typescript
import express from 'express';
import { 
  authenticate, 
  requireRole, 
  requireOwnership,
  requireSelf,
  optionalAuth,
  AuthRequest 
} from './middleware/auth.middleware';
import { UserRole } from './models/User';
import Course from './models/Course';

const router = express.Router();

// Public endpoint - no authentication
router.get('/courses', optionalAuth, async (req: AuthRequest, res) => {
  const courses = await Course.find({ isPublished: true });
  res.json({ courses });
});

// Authenticated endpoint - any user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.userId);
  res.json({ user });
});

// Role-based endpoint - instructors only
router.post('/courses', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR), 
  async (req: AuthRequest, res) => {
    const courseData = req.body;
    const course = await Course.create({
      ...courseData,
      instructorId: req.user!.userId
    });
    res.status(201).json({ course });
  }
);

// Resource ownership - instructor can only update their own courses
router.put('/courses/:id', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  requireOwnership({ model: Course, ownerField: 'instructorId' }), 
  async (req: AuthRequest, res) => {
    const courseId = req.params.id;
    const updates = req.body;
    const course = await Course.findByIdAndUpdate(courseId, updates, { new: true });
    res.json({ course });
  }
);

// Self-access - users can only update their own profile
router.put('/users/:id', 
  authenticate, 
  requireSelf(), 
  async (req: AuthRequest, res) => {
    const userId = req.params.id;
    const updates = req.body;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    res.json({ user });
  }
);

// Admin endpoint - admins only
router.get('/admin/users', 
  authenticate, 
  requireRole(UserRole.ADMIN), 
  async (req: AuthRequest, res) => {
    const users = await User.find();
    res.json({ users });
  }
);

export default router;
```

## Testing

The middleware includes comprehensive unit tests with 95%+ coverage:

```bash
npm test -- auth.middleware.test.ts
```

**Test Coverage:**
- ✅ Token extraction from headers and cookies
- ✅ Token verification (valid, expired, invalid, revoked)
- ✅ Role-based access control (single and multiple roles)
- ✅ Resource ownership verification
- ✅ Admin bypass functionality
- ✅ Self-access verification
- ✅ Optional authentication
- ✅ Error handling for all scenarios
- ✅ Edge cases (missing parameters, database errors)

## Security Considerations

### Token Security
- Tokens extracted from Authorization header or HTTP-only cookies
- Tokens verified using `authService.verifyToken()`
- Expired and revoked tokens rejected
- Token blacklisting supported via Redis

### Authorization
- Role-based access control prevents privilege escalation
- Resource ownership verification prevents unauthorized modifications
- Admin bypass is configurable per endpoint

### Error Messages
- Generic error messages prevent information disclosure
- Consistent error format across all middleware
- Appropriate HTTP status codes (401, 403, 404, 500)

### Best Practices
- Always use `authenticate` before role or ownership checks
- Use `requireRole` to restrict by user role
- Use `requireOwnership` to verify resource ownership
- Use `requireSelf` for user profile endpoints
- Use `optionalAuth` for public endpoints with authenticated features

## Integration with Auth Service

The middleware integrates with the Authentication Service:

```typescript
import authService from './services/auth.service';

// Middleware uses authService.verifyToken()
const payload = await authService.verifyToken(token);

// Payload structure
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
```

## Environment Variables

No additional environment variables required. The middleware uses the Auth Service configuration:

```env
JWT_SECRET=your-256-bit-secret-key
REFRESH_TOKEN_SECRET=your-256-bit-refresh-secret
REDIS_URL=redis://localhost:6379
```

## Related Documentation

- [Authentication Service Documentation](../services/AUTH_SERVICE_DOCUMENTATION.md)
- [User Model Documentation](../models/User.ts)
- [Redis Configuration](../config/REDIS_CONFIG.md)

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
