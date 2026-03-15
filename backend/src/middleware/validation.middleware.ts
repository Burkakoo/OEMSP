import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation Middleware
 * Provides validation schemas and middleware for request validation
 */

/**
 * Validation result handler
 * Checks for validation errors and returns them in a consistent format
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  
  next();
};

/**
 * User Registration Validation
 */
export const validateUserRegistration: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('role')
    .optional()
    .isIn(['student', 'instructor'])
    .withMessage('Role must be either student or instructor'),
];

/**
 * User Login Validation
 */
export const validateUserLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Course Creation Validation
 */
export const validateCourseCreation: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'ETB'])
    .withMessage('Currency must be USD, EUR, or ETB'),
];

/**
 * MongoDB ObjectId Validation
 */
export const validateObjectId = (paramName: string): ValidationChain => {
  return param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`);
};

/**
 * Pagination Validation
 */
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Quiz Submission Validation
 */
export const validateQuizSubmission: ValidationChain[] = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('Invalid question ID'),
  body('answers.*.studentAnswer')
    .notEmpty()
    .withMessage('Student answer is required'),
];

/**
 * Payment Processing Validation
 */
export const validatePaymentProcessing: ValidationChain[] = [
  body('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .isIn(['USD', 'EUR', 'ETB'])
    .withMessage('Currency must be USD, EUR, or ETB'),
  body('paymentMethod')
    .isIn(['stripe', 'telebirr', 'cbe_birr', 'cbe', 'awash_bank', 'siinqee_bank'])
    .withMessage('Invalid payment method'),
  body('phoneNumber')
    .optional()
    .matches(/^\+251\d{9}$/)
    .withMessage('Phone number must be in format +251XXXXXXXXX'),
];

/**
 * File Upload Validation
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  const maxSize = 50 * 1024 * 1024; // 50MB

  // This is a placeholder - actual file validation would happen with multer
  // This middleware would be used after multer processes the file
  
  const file = (req as any).file;
  
  if (file) {
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed types: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, TXT',
      });
      return;
    }

    if (file.size > maxSize) {
      res.status(400).json({
        success: false,
        message: 'File size exceeds 50MB limit',
      });
      return;
    }
  }

  next();
};

/**
 * Email Validation
 */
export const validateEmail: ValidationChain = body('email')
  .isEmail()
  .withMessage('Valid email is required')
  .normalizeEmail();

/**
 * Password Strength Validation
 */
export const validatePasswordStrength: ValidationChain = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

/**
 * Custom validation rule: No SQL injection patterns
 */
export const validateNoSQLInjection = (value: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(--|;|\/\*|\*\/)/,
  ];

  return !sqlPatterns.some(pattern => pattern.test(value));
};

/**
 * Custom validation rule: No XSS patterns
 */
export const validateNoXSS = (value: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  return !xssPatterns.some(pattern => pattern.test(value));
};

/**
 * Sanitize and validate text input
 */
export const validateTextInput = (fieldName: string, minLength: number = 1, maxLength: number = 1000): ValidationChain[] => {
  return [
    body(fieldName)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
      .custom(validateNoSQLInjection)
      .withMessage(`${fieldName} contains invalid characters`)
      .custom(validateNoXSS)
      .withMessage(`${fieldName} contains potentially dangerous content`),
  ];
};
