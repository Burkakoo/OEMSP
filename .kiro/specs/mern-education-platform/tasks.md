# Tasks: MERN Education Platform

## 1. Project Setup and Infrastructure

- [ ] 1.1 Initialize project structure
  - [x] 1.1.1 Create monorepo structure with backend and frontend directories
  - [x] 1.1.2 Initialize Node.js project with TypeScript configuration
  - [x] 1.1.3 Configure ESLint and Prettier for code quality
  - [x] 1.1.4 Set up Git repository with .gitignore

- [ ] 1.2 Configure backend environment
  - [x] 1.2.1 Install Express.js and core dependencies
  - [x] 1.2.2 Configure TypeScript for Node.js backend
  - [x] 1.2.3 Set up environment variable management with dotenv
  - [x] 1.2.4 Create environment variable template file
  - [ ] 1.2.5 Add admin account seeding and disable admin self-registration

- [ ] 1.3 Configure frontend environment
  - [x] 1.3.1 Initialize React project with TypeScript
  - [x] 1.3.2 Install Redux Toolkit and React Router
  - [x] 1.3.3 Configure build tools and bundler
  - [x] 1.3.4 Set up Material-UI component library

- [ ] 1.4 Set up database connection
  - [x] 1.4.1 Create MongoDB Atlas cluster
  - [x] 1.4.2 Configure Mongoose connection with retry logic
  - [x] 1.4.3 Implement connection pooling configuration
  - [x] 1.4.4 Create database connection health check

- [ ] 1.5 Configure Redis for caching
  - [x] 1.5.1 Set up Redis instance
  - [x] 1.5.2 Configure ioredis client
  - [x] 1.5.3 Implement cache utility functions
  - [x] 1.5.4 Set up session storage in Redis

## 2. Database Schema and Models

- [ ] 2.1 Create User model
  - [x] 2.1.1 Define User schema with all fields
  - [x] 2.1.2 Create indexes (email unique, role, createdAt)
  - [x] 2.1.3 Implement password hashing pre-save hook
  - [x] 2.1.4 Add validation rules for all fields
  - [x] 2.1.5 Add isApproved field for instructor approval workflow
  - [x] 2.1.6 Add approvedBy and approvedAt fields for tracking


- [ ] 2.2 Create Course model
  - [x] 2.2.1 Define Course schema with modules and lessons
  - [x] 2.2.2 Create indexes (instructorId, category, compound index)
  - [x] 2.2.3 Add validation rules for course fields
  - [x] 2.2.4 Implement module and lesson subdocument schemas
  - [x] 2.2.5 Add attachments subdocument schema for file uploads
  - [x] 2.2.6 Add validation for file types and sizes

- [x] 2.3 Create Enrollment model
  - [x] 2.3.1 Define Enrollment schema with progress tracking
  - [x] 2.3.2 Create compound unique index (studentId, courseId)
  - [x] 2.3.3 Add validation rules and default values
  - [x] 2.3.4 Implement lesson progress subdocument schema

- [x] 2.4 Create Quiz model
  - [x] 2.4.1 Define Quiz schema with questions array
  - [x] 2.4.2 Create indexes (courseId, moduleId)
  - [x] 2.4.3 Implement Question subdocument schema
  - [x] 2.4.4 Add validation for question types and options

- [x] 2.5 Create QuizResult model
  - [x] 2.5.1 Define QuizResult schema
  - [x] 2.5.2 Create indexes (studentId, quizId)
  - [x] 2.5.3 Add validation rules
  - [x] 2.5.4 Implement answer subdocument schema

- [ ] 2.6 Create Payment model
  - [x] 2.6.1 Define Payment schema with all fields
  - [x] 2.6.2 Create indexes (userId, courseId, transactionId unique)
  - [x] 2.6.3 Add validation rules for payment fields
  - [x] 2.6.4 Implement payment metadata subdocument
  - [x] 2.6.5 Add support for Ethiopian Birr (ETB) currency
  - [x] 2.6.6 Add Ethiopian payment methods (Telebirr, CBE Birr, CBE, Awash Bank, Siinqee Bank)
  - [x] 2.6.7 Add phoneNumber field for mobile payment methods

- [ ] 2.7 Create Certificate model
  - [x] 2.7.1 Define Certificate schema
  - [x] 2.7.2 Create indexes (enrollmentId unique, verificationCode unique)
  - [x] 2.7.3 Add validation rules
  - [x] 2.7.4 Implement verification code generation

- [ ] 2.8 Create Notification model
  - [x] 2.8.1 Define Notification schema
  - [x] 2.8.2 Create compound index (userId, isRead, createdAt)
  - [x] 2.8.3 Add validation rules
  - [x] 2.8.4 Implement notification type enum

## 3. Authentication and Authorization

- [x] 3.1 Implement authentication service
  - [x] 3.1.1 Create user registration function with validation
  - [x] 3.1.2 Implement login function with bcrypt verification
  - [x] 3.1.3 Create JWT token generation function
  - [x] 3.1.4 Implement token verification function
  - [x] 3.1.5 Create refresh token mechanism
  - [x] 3.1.6 Implement logout with token blacklisting
  - [x] 3.1.7 Add instructor approval check in login function
  - [x] 3.1.8 Implement instructor approval function (admin only)
  - [x] 3.1.9 Implement instructor rejection function (admin only)
  - [x] 3.1.10 Create get pending instructors function (admin only)

- [x] 3.2 Create authentication middleware
  - [x] 3.2.1 Implement JWT verification middleware
  - [x] 3.2.2 Create role-based access control middleware
  - [x] 3.2.3 Implement resource ownership verification
  - [x] 3.2.4 Add error handling for authentication failures

- [x] 3.3 Implement password management
  - [x] 3.3.1 Create password reset request function
  - [x] 3.3.2 Implement password reset token generation
  - [x] 3.3.3 Create password change function
  - [x] 3.3.4 Add password strength validation

- [x] 3.4 Create authentication controllers
  - [x] 3.4.1 Implement register endpoint handler
  - [x] 3.4.2 Implement login endpoint handler
  - [x] 3.4.3 Implement logout endpoint handler
  - [x] 3.4.4 Implement token refresh endpoint handler
  - [x] 3.4.5 Implement password reset endpoints
  - [x] 3.4.6 Implement approve instructor endpoint handler (admin only)
  - [x] 3.4.7 Implement reject instructor endpoint handler (admin only)
  - [x] 3.4.8 Implement get pending instructors endpoint handler (admin only)

- [x] 3.5 Create authentication routes
  - [x] 3.5.1 Define POST /api/v1/auth/register route
  - [x] 3.5.2 Define POST /api/v1/auth/login route
  - [x] 3.5.3 Define POST /api/v1/auth/logout route
  - [x] 3.5.4 Define POST /api/v1/auth/refresh route
  - [x] 3.5.5 Define password reset routes
  - [x] 3.5.6 Define POST /api/v1/auth/instructors/:id/approve route (admin only)
  - [x] 3.5.7 Define POST /api/v1/auth/instructors/:id/reject route (admin only)
  - [x] 3.5.8 Define GET /api/v1/auth/instructors/pending route (admin only)

## 4. User Management

- [x] 4.1 Implement user service
  - [x] 4.1.1 Create get user profile function
  - [x] 4.1.2 Implement update user profile function
  - [x] 4.1.3 Create delete user account function
  - [x] 4.1.4 Implement user search and listing

- [x] 4.2 Create user controllers
  - [x] 4.2.1 Implement get user endpoint handler
  - [x] 4.2.2 Implement update user endpoint handler
  - [x] 4.2.3 Implement delete user endpoint handler
  - [x] 4.2.4 Add input validation for user operations

- [x] 4.3 Create user routes
  - [x] 4.3.1 Define GET /api/v1/users/:id route
  - [x] 4.3.2 Define PUT /api/v1/users/:id route
  - [x] 4.3.3 Define DELETE /api/v1/users/:id route
  - [x] 4.3.4 Apply authentication and authorization middleware

## 5. Course Management

- [x] 5.1 Implement course service
  - [x] 5.1.1 Create course creation function with validation
  - [x] 5.1.2 Implement course update function
  - [x] 5.1.3 Create course deletion function
  - [x] 5.1.4 Implement get course function with population
  - [x] 5.1.5 Create course listing with filters and pagination
  - [x] 5.1.6 Implement course search functionality
  - [ ] 5.1.7 Convert course deletion to soft delete (preserve enrollment history)
  - [ ] 5.1.8 Exclude soft-deleted courses from listing/search by default

- [x] 5.2 Implement module management
  - [x] 5.2.1 Create add module function
  - [x] 5.2.2 Implement update module function
  - [x] 5.2.3 Create delete module function
  - [x] 5.2.4 Implement module reordering

- [x] 5.3 Implement lesson management
  - [x] 5.3.1 Create add lesson function
  - [x] 5.3.2 Implement update lesson function
  - [x] 5.3.3 Create delete lesson function
  - [x] 5.3.4 Implement lesson reordering
  - [x] 5.3.5 Implement file upload function for lesson attachments
  - [x] 5.3.6 Add file type validation (PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, TXT)
  - [x] 5.3.7 Add file size validation (max 50MB)
  - [x] 5.3.8 Implement upload to cloud storage
  - [x] 5.3.9 Create delete attachment function
  - [x] 5.3.10 Implement download attachment function with enrollment verification
  - [ ] 5.3.11 Generate signed, time-limited attachment download URLs
  - [ ] 5.3.12 Increase attachment max size to 100MB (validation + docs)

- [x] 5.4 Implement course publishing
  - [x] 5.4.1 Create publish course function with validation
  - [x] 5.4.2 Implement unpublish course function
  - [x] 5.4.3 Add validation for minimum content requirements

- [x] 5.5 Create course controllers
  - [x] 5.5.1 Implement list courses endpoint handler
  - [x] 5.5.2 Implement get course endpoint handler
  - [x] 5.5.3 Implement create course endpoint handler
  - [x] 5.5.4 Implement update course endpoint handler
  - [x] 5.5.5 Implement delete course endpoint handler
  - [x] 5.5.6 Implement publish/unpublish endpoint handlers

- [x] 5.6 Create module and lesson controllers
  - [x] 5.6.1 Implement add module endpoint handler
  - [x] 5.6.2 Implement update module endpoint handler
  - [x] 5.6.3 Implement delete module endpoint handler
  - [x] 5.6.4 Implement add lesson endpoint handler
  - [x] 5.6.5 Implement update lesson endpoint handler
  - [x] 5.6.6 Implement delete lesson endpoint handler
  - [x] 5.6.7 Implement upload attachment endpoint handler (instructor only)
  - [x] 5.6.8 Implement delete attachment endpoint handler (instructor only)
  - [x] 5.6.9 Implement download attachment endpoint handler (enrolled students only)

- [x] 5.7 Create course routes
  - [x] 5.7.1 Define GET /api/v1/courses route with filters
  - [x] 5.7.2 Define GET /api/v1/courses/:id route
  - [x] 5.7.3 Define POST /api/v1/courses route (instructor only)
  - [x] 5.7.4 Define PUT /api/v1/courses/:id route (instructor only)
  - [x] 5.7.5 Define DELETE /api/v1/courses/:id route (instructor only)
  - [x] 5.7.6 Define publish/unpublish routes

- [x] 5.8 Create module and lesson routes
  - [x] 5.8.1 Define POST /api/v1/courses/:courseId/modules route
  - [x] 5.8.2 Define PUT /api/v1/modules/:id route
  - [x] 5.8.3 Define DELETE /api/v1/modules/:id route
  - [x] 5.8.4 Define POST /api/v1/modules/:moduleId/lessons route
  - [x] 5.8.5 Define PUT /api/v1/lessons/:id route
  - [x] 5.8.6 Define DELETE /api/v1/lessons/:id route
  - [x] 5.8.7 Define POST /api/v1/lessons/:id/attachments route (instructor only)
  - [x] 5.8.8 Define DELETE /api/v1/attachments/:id route (instructor only)
  - [x] 5.8.9 Define GET /api/v1/attachments/:id/download route (enrolled students only)

## 6. Enrollment Management

- [ ] 6.1 Implement enrollment service
  - [x] 6.1.1 Create enroll student function with validation
  - [x] 6.1.2 Implement get enrollment function
  - [x] 6.1.3 Create list enrollments function
  - [x] 6.1.4 Implement update progress function
  - [x] 6.1.5 Create calculate progress function
  - [x] 6.1.6 Implement check completion function
  - [ ] 6.1.7 Implement unenroll function (student/admin) preserving enrollment history
  - [ ] 6.1.8 Persist video playback progress (>= every 10 seconds) via progress updates
  - [ ] 6.1.9 Implement admin reset progress function

- [ ] 6.2 Create enrollment controllers
  - [x] 6.2.1 Implement list enrollments endpoint handler
  - [x] 6.2.2 Implement get enrollment endpoint handler
  - [x] 6.2.3 Implement create enrollment endpoint handler
  - [x] 6.2.4 Implement update progress endpoint handler
  - [x] 6.2.5 Implement get course enrollments handler (instructor)
  - [ ] 6.2.6 Implement unenroll endpoint handler (student/admin)
  - [ ] 6.2.7 Implement admin reset progress endpoint handler

- [ ] 6.3 Create enrollment routes
  - [x] 6.3.1 Define GET /api/v1/enrollments route
  - [x] 6.3.2 Define GET /api/v1/enrollments/:id route
  - [x] 6.3.3 Define POST /api/v1/enrollments route
  - [x] 6.3.4 Define PUT /api/v1/enrollments/:id/progress route
  - [x] 6.3.5 Define GET /api/v1/courses/:id/enrollments route
  - [ ] 6.3.6 Define DELETE /api/v1/enrollments/:id route (student/admin)
  - [ ] 6.3.7 Define POST /api/v1/enrollments/:id/progress/reset route (admin)

## 7. Quiz and Assessment System

- [ ] 7.1 Implement quiz service
  - [x] 7.1.1 Create quiz creation function with validation
  - [x] 7.1.2 Implement quiz update function
  - [x] 7.1.3 Create quiz deletion function
  - [x] 7.1.4 Implement get quiz function
  - [x] 7.1.5 Create add question function
  - [x] 7.1.6 Implement question validation for all types
  - [x] 7.1.7 Add instructor ownership verification for quiz operations
  - [x] 7.1.8 Prevent instructors from creating quizzes for other instructors' courses

- [ ] 7.2 Implement quiz grading service
  - [x] 7.2.1 Create submit quiz function
  - [x] 7.2.2 Implement grade quiz function with scoring logic
  - [x] 7.2.3 Create get quiz results function
  - [x] 7.2.4 Implement quiz statistics function
  - [x] 7.2.5 Add attempt limit enforcement
  - [x] 7.2.6 Add time limit validation

- [ ] 7.3 Create quiz controllers
  - [x] 7.3.1 Implement get quiz endpoint handler
  - [x] 7.3.2 Implement create quiz endpoint handler (instructor)
  - [x] 7.3.3 Implement update quiz endpoint handler (instructor)
  - [x] 7.3.4 Implement delete quiz endpoint handler (instructor)
  - [x] 7.3.5 Implement submit quiz endpoint handler
  - [x] 7.3.6 Implement get results endpoint handler
  - [ ] 7.3.7 Implement add question endpoint handler (instructor)
  - [ ] 7.3.8 Implement update question endpoint handler (instructor)
  - [ ] 7.3.9 Implement delete question endpoint handler (instructor)
  - [ ] 7.3.10 Implement quiz statistics endpoint handler (instructor)

- [ ] 7.4 Create quiz routes
  - [x] 7.4.1 Define GET /api/v1/quizzes/:id route
  - [x] 7.4.2 Define POST /api/v1/courses/:courseId/quizzes route
  - [x] 7.4.3 Define PUT /api/v1/quizzes/:id route
  - [x] 7.4.4 Define DELETE /api/v1/quizzes/:id route
  - [x] 7.4.5 Define POST /api/v1/quizzes/:id/submit route
  - [x] 7.4.6 Define GET /api/v1/quizzes/:id/results route
  - [ ] 7.4.7 Define POST /api/v1/quizzes/:id/questions route (instructor only)
  - [ ] 7.4.8 Define PUT /api/v1/questions/:id route (instructor only)
  - [ ] 7.4.9 Define DELETE /api/v1/questions/:id route (instructor only)
  - [ ] 7.4.10 Define GET /api/v1/quizzes/:id/statistics route (instructor only)

## 8. Payment Processing

- [ ] 8.1 Implement payment service
  - [x] 8.1.1 Create Stripe integration setup
  - [x] 8.1.2 Implement process payment function
  - [x] 8.1.3 Create verify payment function
  - [x] 8.1.4 Implement get payment function
  - [x] 8.1.5 Create list payments function
  - [x] 8.1.6 Implement refund function
  - [x] 8.1.7 Add Ethiopian Birr (ETB) currency support
  - [x] 8.1.8 Integrate Telebirr payment gateway
  - [x] 8.1.9 Integrate CBE Birr payment gateway
  - [x] 8.1.10 Integrate CBE payment gateway
  - [x] 8.1.11 Integrate Awash Bank payment gateway
  - [x] 8.1.12 Integrate Siinqee Bank payment gateway
  - [x] 8.1.13 Add phone number validation for Ethiopian mobile payments
  - [x] 8.1.14 Implement payment method routing logic
  - [ ] 8.1.15 Store payment gateway response metadata in Payment records
  - [ ] 8.1.16 Enforce payment token idempotency (reject duplicate tokens)
  - [ ] 8.1.17 Encrypt payment tokens before storage

- [ ] 8.2 Create payment controllers
  - [x] 8.2.1 Implement process payment endpoint handler
  - [x] 8.2.2 Implement get payment endpoint handler
  - [x] 8.2.3 Implement list payments endpoint handler
  - [x] 8.2.4 Implement refund endpoint handler (admin)
  - [x] 8.2.5 Add payment validation and error handling
  - [x] 8.2.6 Add Ethiopian payment method validation
  - [x] 8.2.7 Add phone number validation for mobile payments
  - [ ] 8.2.8 Implement payment statistics endpoint handler (admin)

- [ ] 8.3 Create payment routes
  - [x] 8.3.1 Define POST /api/v1/payments/process route
  - [x] 8.3.2 Define GET /api/v1/payments/:id route
  - [x] 8.3.3 Define GET /api/v1/payments route
  - [x] 8.3.4 Define POST /api/v1/payments/:id/refund route (admin)
  - [ ] 8.3.5 Define GET /api/v1/payments/statistics route (admin)

- [ ] 8.4 Implement payment webhooks
  - [ ] 8.4.1 Create Stripe webhook handler
  - [ ] 8.4.2 Implement webhook signature verification
  - [ ] 8.4.3 Handle payment success events
  - [ ] 8.4.4 Handle payment failure events
  - [ ] 8.4.5 Create Telebirr webhook handler
  - [ ] 8.4.6 Create CBE Birr webhook handler
  - [ ] 8.4.7 Create webhook handlers for other Ethiopian payment methods

## 9. Certificate Management

- [ ] 9.1 Implement certificate service
  - [x] 9.1.1 Create generate certificate function
  - [x] 9.1.2 Implement PDF generation with PDFKit
  - [x] 9.1.3 Create upload to cloud storage function
  - [x] 9.1.4 Implement get certificate function
  - [x] 9.1.5 Create verify certificate function
  - [x] 9.1.6 Implement list certificates function

- [ ] 9.2 Create certificate controllers
  - [x] 9.2.1 Implement get certificate endpoint handler
  - [x] 9.2.2 Implement list certificates endpoint handler
  - [x] 9.2.3 Implement verify certificate endpoint handler
  - [x] 9.2.4 Implement regenerate certificate handler

- [ ] 9.3 Create certificate routes
  - [x] 9.3.1 Define GET /api/v1/certificates/:id route
  - [x] 9.3.2 Define GET /api/v1/certificates route
  - [x] 9.3.3 Define POST /api/v1/certificates/verify route
  - [x] 9.3.4 Define POST /api/v1/certificates/:id/regenerate route

- [ ] 9.4 Implement certificate generation queue
  - [ ] 9.4.1 Set up Bull queue for async certificate generation
  - [ ] 9.4.2 Create certificate generation job processor
  - [ ] 9.4.3 Implement retry logic for failed generations
  - [ ] 9.4.4 Add job status tracking

## 10. Notification System

- [ ] 10.1 Implement notification service
  - [x] 10.1.1 Create notification creation function
  - [x] 10.1.2 Implement get notifications function
  - [x] 10.1.3 Create mark as read function
  - [x] 10.1.4 Implement mark all as read function
  - [x] 10.1.5 Create delete notification function
  - [x] 10.1.6 Implement notification cleanup job

- [ ] 10.2 Implement email service
  - [x] 10.2.1 Set up email service integration (AWS SES/SendGrid)
  - [x] 10.2.2 Create email templates for notifications
  - [x] 10.2.3 Implement send email function
  - [x] 10.2.4 Add email queue for async sending

- [ ] 10.3 Create notification controllers
  - [x] 10.3.1 Implement list notifications endpoint handler
  - [x] 10.3.2 Implement mark as read endpoint handler
  - [x] 10.3.3 Implement mark all as read endpoint handler
  - [x] 10.3.4 Implement delete notification endpoint handler

- [ ] 10.4 Create notification routes
  - [x] 10.4.1 Define GET /api/v1/notifications route
  - [x] 10.4.2 Define PUT /api/v1/notifications/:id/read route
  - [x] 10.4.3 Define PUT /api/v1/notifications/read-all route
  - [x] 10.4.4 Define DELETE /api/v1/notifications/:id route

- [ ] 10.5 Implement real-time in-app notifications
  - [ ] 10.5.1 Choose transport (WebSocket/SSE) with polling fallback
  - [ ] 10.5.2 Broadcast enrollment/payment/quiz/certificate events
  - [ ] 10.5.3 Update frontend to subscribe and update unread counts

## 11. Analytics and Reporting

- [ ] 11.1 Implement analytics service
  - [x] 11.1.1 Create student dashboard analytics function
  - [x] 11.1.2 Implement instructor dashboard analytics function
  - [x] 11.1.3 Create admin dashboard analytics function
  - [x] 11.1.4 Implement enrollment statistics function
  - [x] 11.1.5 Create revenue statistics function
  - [x] 11.1.6 Implement quiz performance analytics

- [ ] 11.2 Create analytics controllers
  - [x] 11.2.1 Implement student dashboard endpoint handler
  - [x] 11.2.2 Implement instructor dashboard endpoint handler
  - [x] 11.2.3 Implement admin dashboard endpoint handler (admin only)

- [ ] 11.3 Create analytics routes
  - [x] 11.3.1 Define GET /api/v1/analytics/student route
  - [x] 11.3.2 Define GET /api/v1/analytics/instructor route
  - [x] 11.3.3 Define GET /api/v1/analytics/admin route (admin only)

## 12. Security Implementation

- [ ] 12.1 Implement security middleware
  - [x] 12.1.1 Configure Helmet.js for security headers
  - [x] 12.1.2 Implement CORS with whitelist configuration
  - [x] 12.1.3 Create rate limiting middleware
  - [x] 12.1.4 Implement request size limits
  - [x] 12.1.5 Add input sanitization middleware
  - [ ] 12.1.6 Add gzip compression middleware for API responses
  - [ ] 12.1.7 Configure CORS methods/credentials and preflight caching
  - [ ] 12.1.8 Back rate limiting by Redis store and add payment-specific limiter
  - [ ] 12.1.9 Return Retry-After header on rate-limited responses

- [ ] 12.2 Implement validation
  - [x] 12.2.1 Create validation schemas with express-validator
  - [x] 12.2.2 Implement input validation for all endpoints
  - [x] 12.2.3 Add file upload validation
  - [x] 12.2.4 Create custom validation rules

- [ ] 12.3 Implement logging and monitoring
  - [x] 12.3.1 Set up Winston logger
  - [x] 12.3.2 Implement request logging middleware
  - [x] 12.3.3 Create error logging
  - [x] 12.3.4 Add audit logging for sensitive operations
  - [x] 12.3.5 Implement log rotation

## 13. Frontend - Authentication

- [x] 13.1 Create authentication Redux slice
  - [x] 13.1.1 Define authentication state structure
  - [x] 13.1.2 Create login async thunk
  - [x] 13.1.3 Create register async thunk
  - [x] 13.1.4 Create logout async thunk
  - [x] 13.1.5 Implement token refresh logic

- [x] 13.2 Create authentication components
  - [x] 13.2.1 Create Login form component
  - [x] 13.2.2 Create Register form component
  - [x] 13.2.3 Create Password reset form component
  - [x] 13.2.4 Create Protected route component
  - [x] 13.2.5 Add form validation with react-hook-form
  - [x] 13.2.6 Add instructor approval status message display
  - [x] 13.2.7 Create pending approval notification component

- [x] 13.3 Create authentication pages
  - [x] 13.3.1 Create Login page
  - [x] 13.3.2 Create Register page
  - [x] 13.3.3 Create Password reset page
  - [x] 13.3.4 Create Email verification page

## 14. Frontend - Course Management

- [x] 14.1 Create course Redux slice
  - [x] 14.1.1 Define course state structure
  - [x] 14.1.2 Create fetch courses async thunk
  - [x] 14.1.3 Create fetch course details async thunk
  - [x] 14.1.4 Create create course async thunk (instructor)
  - [x] 14.1.5 Create update course async thunk (instructor)
  - [x] 14.1.6 Implement course filtering and search

- [x] 14.2 Create course components
  - [x] 14.2.1 Create CourseCard component
  - [x] 14.2.2 Create CourseList component
  - [x] 14.2.3 Create CourseDetails component
  - [x] 14.2.4 Create CourseForm component (instructor)
  - [x] 14.2.5 Create ModuleList component
  - [x] 14.2.6 Create LessonList component
  - [x] 14.2.7 Create FileUpload component for attachments (instructor)
  - [x] 14.2.8 Create AttachmentList component with download links (students)
  - [x] 14.2.9 Add file type icons for different document types

- [x] 14.3 Create course pages
  - [x] 14.3.1 Create Course catalog page
  - [x] 14.3.2 Create Course details page
  - [x] 14.3.3 Create Course player page
  - [x] 14.3.4 Create Create course page (instructor)
  - [x] 14.3.5 Create Edit course page (instructor)

## 15. Frontend - Student Dashboard

- [x] 15.1 Create enrollment Redux slice
  - [x] 15.1.1 Define enrollment state structure
  - [x] 15.1.2 Create fetch enrollments async thunk
  - [x] 15.1.3 Create update progress async thunk
  - [x] 15.1.4 Implement progress tracking

- [x] 15.2 Create student dashboard components
  - [x] 15.2.1 Create EnrolledCourseCard component
  - [x] 15.2.2 Create ProgressBar component
  - [x] 15.2.3 Create CertificateList component
  - [x] 15.2.4 Create StudentStats component

- [x] 15.3 Create student dashboard page
  - [x] 15.3.1 Create Student dashboard layout
  - [x] 15.3.2 Implement enrolled courses section
  - [x] 15.3.3 Implement progress tracking section
  - [x] 15.3.4 Implement certificates section

## 16. Frontend - Quiz System

- [x] 16.1 Create quiz Redux slice
  - [x] 16.1.1 Define quiz state structure
  - [x] 16.1.2 Create fetch quiz async thunk
  - [x] 16.1.3 Create submit quiz async thunk
  - [x] 16.1.4 Create fetch results async thunk
  - [x] 16.1.5 Implement quiz timer logic

- [x] 16.2 Create quiz components
  - [x] 16.2.1 Create QuizQuestion component
  - [x] 16.2.2 Create QuizTimer component
  - [x] 16.2.3 Create QuizResults component
  - [x] 16.2.4 Create QuizForm component (instructor)

- [x] 16.3 Create quiz pages
  - [x] 16.3.1 Create Quiz taking page
  - [x] 16.3.2 Create Quiz results page
  - [x] 16.3.3 Create Create quiz page (instructor)
  - [x] 16.3.4 Create Edit quiz page (instructor)

## 17. Frontend - Payment Integration

- [x] 17.1 Create payment Redux slice
  - [x] 17.1.1 Define payment state structure
  - [x] 17.1.2 Create process payment async thunk
  - [x] 17.1.3 Create fetch payment history async thunk

- [x] 17.2 Create payment components
  - [x] 17.2.1 Integrate Stripe Elements
  - [x] 17.2.2 Create PaymentForm component
  - [x] 17.2.3 Create PaymentHistory component
  - [x] 17.2.4 Create PaymentSuccess component
  - [x] 17.2.5 Create Ethiopian payment method selector
  - [x] 17.2.6 Create Telebirr payment component
  - [x] 17.2.7 Create CBE Birr payment component
  - [x] 17.2.8 Create bank payment components (CBE, Awash, Siinqee)
  - [x] 17.2.9 Add phone number input for mobile payments
  - [x] 17.2.10 Add Ethiopian Birr currency display

- [x] 17.3 Create payment pages
  - [x] 17.3.1 Create Checkout page
  - [x] 17.3.2 Create Payment success page
  - [x] 17.3.3 Create Payment failure page

## 18. Frontend - Instructor Dashboard

- [x] 18.1 Create instructor dashboard components
  - [x] 18.1.1 Create InstructorStats component
  - [x] 18.1.2 Create CourseAnalytics component
  - [x] 18.1.3 Create EnrollmentChart component
  - [x] 18.1.4 Create RevenueChart component

- [x] 18.2 Create instructor dashboard page
  - [x] 18.2.1 Create Instructor dashboard layout
  - [x] 18.2.2 Implement course management section
  - [x] 18.2.3 Implement analytics section
  - [x] 18.2.4 Implement student progress section

## 19. Frontend - Admin Dashboard

- [x] 19.1 Create admin dashboard components
  - [x] 19.1.1 Create PlatformStats component
  - [x] 19.1.2 Create UserManagement component
  - [x] 19.1.3 Create CourseManagement component
  - [x] 19.1.4 Create RevenueReports component

- [x] 19.2 Create admin dashboard page
  - [x] 19.2.1 Create Admin dashboard layout
  - [x] 19.2.2 Implement platform statistics section
  - [x] 19.2.3 Implement user management section
  - [x] 19.2.4 Implement course management section
  - [x] 19.2.5 Create pending instructor approvals section
  - [x] 19.2.6 Implement approve/reject instructor actions
  - [x] 19.2.7 Add instructor approval notification system

## 20. Testing

- [ ] 20.1 Write unit tests for backend
  - [x] 20.1.1 Test authentication service functions
  - [ ] 20.1.2 Test course service functions
  - [ ] 20.1.3 Test enrollment service functions
  - [ ] 20.1.4 Test quiz service functions
  - [ ] 20.1.5 Test payment service functions
  - [ ] 20.1.6 Test certificate service functions

- [ ] 20.2 Write property-based tests
  - [ ] 20.2.1 Test progress calculation properties
  - [ ] 20.2.2 Test quiz grading properties
  - [ ] 20.2.3 Test authentication properties
  - [ ] 20.2.4 Test enrollment properties
  - [ ] 20.2.5 Test payment properties

- [ ] 20.3 Write integration tests
  - [ ] 20.3.1 Test complete enrollment flow
  - [ ] 20.3.2 Test course completion flow
  - [ ] 20.3.3 Test quiz taking flow
  - [ ] 20.3.4 Test payment and refund flow
  - [ ] 20.3.5 Test authentication flow

- [ ] 20.4 Write frontend tests
  - [ ] 20.4.1 Test authentication components
  - [ ] 20.4.2 Test course components
  - [ ] 20.4.3 Test quiz components
  - [ ] 20.4.4 Test payment components
  - [ ] 20.4.5 Test dashboard components

## 21. Deployment and DevOps

- [ ] 21.1 Set up CI/CD pipeline
  - [ ] 21.1.1 Create GitHub Actions workflow
  - [ ] 21.1.2 Configure test automation
  - [ ] 21.1.3 Configure build automation
  - [ ] 21.1.4 Implement deployment automation

- [ ] 21.2 Configure production environment
  - [ ] 21.2.1 Set up MongoDB Atlas production cluster
  - [ ] 21.2.2 Configure Redis production instance
  - [ ] 21.2.3 Set up AWS S3 buckets
  - [ ] 21.2.4 Configure CDN
  - [ ] 21.2.5 Set up email service

- [ ] 21.3 Deploy backend
  - [ ] 21.3.1 Deploy to Render/AWS EC2
  - [ ] 21.3.2 Configure environment variables
  - [ ] 21.3.3 Set up SSL certificates
  - [ ] 21.3.4 Configure load balancer
  - [ ] 21.3.5 Set up PM2 process manager

- [ ] 21.4 Deploy frontend
  - [ ] 21.4.1 Deploy to Vercel
  - [ ] 21.4.2 Configure environment variables
  - [ ] 21.4.3 Set up custom domain
  - [ ] 21.4.4 Configure SSL certificates

- [ ] 21.5 Set up monitoring
  - [ ] 21.5.1 Configure Sentry for error tracking
  - [ ] 21.5.2 Set up application performance monitoring
  - [ ] 21.5.3 Configure log aggregation
  - [ ] 21.5.4 Set up uptime monitoring
  - [ ] 21.5.5 Create alert rules

## 22. Documentation

- [ ] 22.1 Create API documentation
  - [ ] 22.1.1 Set up Swagger/OpenAPI
  - [ ] 22.1.2 Document all endpoints
  - [ ] 22.1.3 Add request/response examples
  - [ ] 22.1.4 Document authentication

- [ ] 22.2 Create developer documentation
  - [ ] 22.2.1 Write README with setup instructions
  - [ ] 22.2.2 Document environment variables
  - [ ] 22.2.3 Create architecture documentation
  - [ ] 22.2.4 Document deployment procedures

- [ ] 22.3 Create user documentation
  - [ ] 22.3.1 Write user guide for students
  - [ ] 22.3.2 Write user guide for instructors
  - [ ] 22.3.3 Write admin guide
  - [ ] 22.3.4 Create FAQ section

## 23. Performance and Optimization

- [ ] 23.1 Backend performance improvements
  - [ ] 23.1.1 Add conditional GET support (ETag/If-None-Match) for cacheable GET endpoints
  - [ ] 23.1.2 Apply Redis caching with TTLs (courses: 5m, profiles: 10m, quizzes: until updated)
  - [ ] 23.1.3 Add cache invalidation on write operations (courses/quizzes/attachments)
  - [ ] 23.1.4 Implement cursor-based pagination for large list endpoints
  - [ ] 23.1.5 Lazy load course modules/lessons in dedicated endpoints

- [ ] 23.2 Frontend performance improvements
  - [ ] 23.2.1 Split routes with React.lazy() and Suspense
  - [ ] 23.2.2 Add dynamic imports for the admin dashboard
  - [ ] 23.2.3 Implement image lazy loading with Intersection Observer
  - [ ] 23.2.4 Support WebP images with fallback to JPG/PNG
  - [ ] 23.2.5 Add service worker for offline capability
  - [ ] 23.2.6 Add list virtualization for large lists (react-window)
  - [ ] 23.2.7 Migrate API caching to RTK Query (or equivalent) incrementally

- [ ] 23.3 Video delivery
  - [ ] 23.3.1 Implement HLS packaging and multiple quality renditions (360p/720p/1080p)
  - [ ] 23.3.2 Deliver videos via CDN with signed, expiring URLs
