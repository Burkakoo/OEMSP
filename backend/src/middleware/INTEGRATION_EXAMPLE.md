# Authentication Middleware Integration Example

## Overview

This document demonstrates how to integrate the authentication middleware into your Express routes for the MERN Education Platform.

## Basic Setup

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
import User from './models/User';

const router = express.Router();
```

## Example 1: Public Endpoint (No Authentication)

```typescript
// Anyone can view published courses
router.get('/courses', async (req, res) => {
  const courses = await Course.find({ isPublished: true });
  res.json({ success: true, courses });
});
```

## Example 2: Authenticated Endpoint (Any User)

```typescript
// Any authenticated user can view their profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch profile' 
    });
  }
});
```

## Example 3: Role-Based Endpoint (Instructors Only)

```typescript
// Only instructors can create courses
router.post('/courses', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR), 
  async (req: AuthRequest, res) => {
    try {
      const courseData = req.body;
      const instructorId = req.user!.userId;
      
      const course = await Course.create({
        ...courseData,
        instructorId,
        isPublished: false,
        enrollmentCount: 0,
        rating: 0,
        reviewCount: 0,
      });
      
      res.status(201).json({ success: true, course });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create course' 
      });
    }
  }
);
```

## Example 4: Multiple Roles

```typescript
// Instructors and admins can view analytics
router.get('/analytics', 
  authenticate, 
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]), 
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      
      let analytics;
      if (role === UserRole.ADMIN) {
        // Admin sees platform-wide analytics
        analytics = await getAdminAnalytics();
      } else {
        // Instructor sees their own analytics
        analytics = await getInstructorAnalytics(userId);
      }
      
      res.json({ success: true, analytics });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch analytics' 
      });
    }
  }
);
```

## Example 5: Resource Ownership (Instructors Can Only Modify Their Courses)

```typescript
// Instructor can only update their own courses
router.put('/courses/:id', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId' 
  }), 
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;
      const updates = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updates.instructorId;
      delete updates.enrollmentCount;
      delete updates.rating;
      delete updates.reviewCount;
      
      const course = await Course.findByIdAndUpdate(
        courseId, 
        updates, 
        { new: true, runValidators: true }
      );
      
      res.json({ success: true, course });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update course' 
      });
    }
  }
);
```

## Example 6: Admin Override (Admins Can Delete Any Course)

```typescript
// Instructors can delete their own courses, admins can delete any course
router.delete('/courses/:id', 
  authenticate, 
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId',
    allowAdmin: true  // Admins bypass ownership check
  }), 
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;
      
      // Check if course has active enrollments
      const enrollmentCount = await Enrollment.countDocuments({ 
        courseId, 
        isCompleted: false 
      });
      
      if (enrollmentCount > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete course with active enrollments' 
        });
      }
      
      await Course.findByIdAndDelete(courseId);
      
      res.json({ 
        success: true, 
        message: 'Course deleted successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete course' 
      });
    }
  }
);
```

## Example 7: Self-Access (Users Can Only Update Their Own Profile)

```typescript
// Users can only update their own profile
router.put('/users/:id', 
  authenticate, 
  requireSelf(), 
  async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updates.role;
      delete updates.isActive;
      delete updates.isApproved;
      delete updates.passwordHash;
      
      const user = await User.findByIdAndUpdate(
        userId, 
        { profile: updates }, 
        { new: true, runValidators: true }
      ).select('-passwordHash');
      
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update profile' 
      });
    }
  }
);
```

## Example 8: Optional Authentication (Different Behavior for Authenticated Users)

```typescript
// Show enrollment status for authenticated users
router.get('/courses', 
  optionalAuth, 
  async (req: AuthRequest, res) => {
    try {
      const courses = await Course.find({ isPublished: true })
        .populate('instructorId', 'firstName lastName')
        .sort({ rating: -1 });
      
      if (req.user) {
        // Authenticated user - include enrollment status
        const enrollments = await Enrollment.find({ 
          studentId: req.user.userId 
        });
        
        const coursesWithStatus = courses.map(course => ({
          ...course.toObject(),
          isEnrolled: enrollments.some(e => 
            e.courseId.toString() === course._id.toString()
          ),
        }));
        
        return res.json({ success: true, courses: coursesWithStatus });
      }
      
      // Anonymous user - basic course list
      res.json({ success: true, courses });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch courses' 
      });
    }
  }
);
```

## Example 9: Admin-Only Endpoint

```typescript
// Only admins can view all users
router.get('/admin/users', 
  authenticate, 
  requireRole(UserRole.ADMIN), 
  async (req: AuthRequest, res) => {
    try {
      const { page = 1, limit = 20, role } = req.query;
      
      const filter: any = {};
      if (role) {
        filter.role = role;
      }
      
      const users = await User.find(filter)
        .select('-passwordHash')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });
      
      const total = await User.countDocuments(filter);
      
      res.json({ 
        success: true, 
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch users' 
      });
    }
  }
);
```

## Example 10: Complex Ownership (Quiz Belongs to Course)

```typescript
// Instructor can only update quizzes for their own courses
router.put('/quizzes/:id', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  async (req: AuthRequest, res) => {
    try {
      const quizId = req.params.id;
      const instructorId = req.user!.userId;
      
      // Find quiz and populate course
      const quiz = await Quiz.findById(quizId).populate('courseId');
      
      if (!quiz) {
        return res.status(404).json({ 
          success: false, 
          error: 'Quiz not found' 
        });
      }
      
      // Check if instructor owns the course
      const course = quiz.courseId as any;
      if (course.instructorId.toString() !== instructorId) {
        return res.status(403).json({ 
          success: false, 
          error: 'You do not have permission to modify this quiz' 
        });
      }
      
      // Update quiz
      const updates = req.body;
      Object.assign(quiz, updates);
      await quiz.save();
      
      res.json({ success: true, quiz });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update quiz' 
      });
    }
  }
);
```

## Example 11: Enrollment Verification

```typescript
// Students can only view their own enrollments
router.get('/enrollments', 
  authenticate, 
  requireRole(UserRole.STUDENT), 
  async (req: AuthRequest, res) => {
    try {
      const studentId = req.user!.userId;
      
      const enrollments = await Enrollment.find({ studentId })
        .populate('courseId', 'title description thumbnail')
        .sort({ enrolledAt: -1 });
      
      res.json({ success: true, enrollments });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch enrollments' 
      });
    }
  }
);

// Instructors can view enrollments for their courses
router.get('/courses/:id/enrollments', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId' 
  }), 
  async (req: AuthRequest, res) => {
    try {
      const courseId = req.params.id;
      
      const enrollments = await Enrollment.find({ courseId })
        .populate('studentId', 'firstName lastName email')
        .sort({ enrolledAt: -1 });
      
      res.json({ success: true, enrollments });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch enrollments' 
      });
    }
  }
);
```

## Example 12: Custom Parameter Name

```typescript
// Using custom parameter name
router.get('/users/:userId/profile', 
  authenticate, 
  requireSelf('userId'), 
  async (req: AuthRequest, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId).select('-passwordHash');
      
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch profile' 
      });
    }
  }
);
```

## Complete Route File Example

```typescript
// routes/courses.routes.ts
import express from 'express';
import { 
  authenticate, 
  requireRole, 
  requireOwnership,
  optionalAuth,
  AuthRequest 
} from '../middleware/auth.middleware';
import { UserRole } from '../models/User';
import Course from '../models/Course';

const router = express.Router();

// Public: List all published courses
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  // Implementation
});

// Public: Get course details
router.get('/:id', async (req, res) => {
  // Implementation
});

// Instructor: Create course
router.post('/', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR), 
  async (req: AuthRequest, res) => {
    // Implementation
  }
);

// Instructor: Update own course
router.put('/:id', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  requireOwnership({ model: Course, ownerField: 'instructorId' }), 
  async (req: AuthRequest, res) => {
    // Implementation
  }
);

// Instructor/Admin: Delete course
router.delete('/:id', 
  authenticate, 
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  requireOwnership({ 
    model: Course, 
    ownerField: 'instructorId',
    allowAdmin: true 
  }), 
  async (req: AuthRequest, res) => {
    // Implementation
  }
);

// Instructor: Publish course
router.post('/:id/publish', 
  authenticate, 
  requireRole(UserRole.INSTRUCTOR),
  requireOwnership({ model: Course, ownerField: 'instructorId' }), 
  async (req: AuthRequest, res) => {
    // Implementation
  }
);

export default router;
```

## Error Handling Best Practices

```typescript
// Wrap async route handlers with error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Use with routes
router.get('/courses', 
  authenticate, 
  asyncHandler(async (req: AuthRequest, res) => {
    const courses = await Course.find();
    res.json({ success: true, courses });
  })
);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});
```

## Testing Routes with Authentication

```typescript
import request from 'supertest';
import app from '../app';
import authService from '../services/auth.service';

describe('Course Routes', () => {
  let instructorToken: string;
  let studentToken: string;
  
  beforeAll(async () => {
    // Create test users and get tokens
    const instructor = await authService.register({
      email: 'instructor@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'Instructor',
      role: UserRole.INSTRUCTOR,
    });
    instructorToken = instructor.token!;
    
    const student = await authService.register({
      email: 'student@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'Student',
      role: UserRole.STUDENT,
    });
    studentToken = student.token!;
  });
  
  it('should allow instructor to create course', async () => {
    const response = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Test Course',
        description: 'Test description',
        // ... other fields
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
  
  it('should deny student from creating course', async () => {
    const response = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Test Course',
        description: 'Test description',
      });
    
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
```

## Summary

The authentication middleware provides a flexible and secure way to protect routes in your Express application. Use the appropriate combination of middleware functions based on your endpoint requirements:

1. **Public endpoints**: No middleware
2. **Authenticated endpoints**: `authenticate`
3. **Role-based endpoints**: `authenticate` + `requireRole`
4. **Resource ownership**: `authenticate` + `requireRole` + `requireOwnership`
5. **Self-access**: `authenticate` + `requireSelf`
6. **Optional auth**: `optionalAuth`

Always use TypeScript's `AuthRequest` type for type-safe access to `req.user` in your route handlers.
