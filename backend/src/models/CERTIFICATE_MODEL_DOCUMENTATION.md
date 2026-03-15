# Certificate Model Documentation

## Overview

The Certificate model represents course completion certificates issued to students. It stores certificate details including student information, course information, completion date, verification code, and certificate URL. The model enforces unique constraints on enrollmentId and verificationCode to ensure one certificate per enrollment and unique verification codes across all certificates.

## Schema Structure

### Main Fields

- **enrollmentId** (ObjectId, required, unique): Reference to the Enrollment model
- **studentId** (ObjectId, required): Reference to the User model (student)
- **courseId** (ObjectId, required): Reference to the Course model
- **studentName** (String, required, 2-200 characters): Full name of the student
- **courseTitle** (String, required, 5-200 characters): Title of the completed course
- **instructorName** (String, required, 2-200 characters): Full name of the course instructor
- **completionDate** (Date, required): Date when the course was completed
- **verificationCode** (String, unique, 16 characters): Unique alphanumeric verification code
- **certificateUrl** (String, required, HTTPS): URL to the certificate PDF in cloud storage
- **issuedAt** (Date, required, default: Date.now): Timestamp when certificate was issued
- **createdAt** (Date, auto-generated): Timestamp when document was created
- **updatedAt** (Date, auto-generated): Timestamp when document was last updated

## Validation Rules

### Required Fields
- enrollmentId, studentId, courseId, studentName, courseTitle, instructorName, completionDate, certificateUrl, and issuedAt are all required

### String Validation
- **studentName**: 2-200 characters, trimmed
- **courseTitle**: 5-200 characters, trimmed
- **instructorName**: 2-200 characters, trimmed
- **verificationCode**: Exactly 16 uppercase alphanumeric characters (A-Z, 0-9)
- **certificateUrl**: Must be a valid HTTPS URL, trimmed

### Unique Constraints
- **enrollmentId**: Must be unique (one certificate per enrollment)
- **verificationCode**: Must be unique across all certificates

## Indexes

The model has the following indexes for query optimization:

1. **enrollmentId** (unique): Ensures one certificate per enrollment
2. **studentId** (non-unique): For querying certificates by student
3. **verificationCode** (unique): For certificate verification lookups

## Static Methods

### generateVerificationCode()

Generates a cryptographically secure 16-character uppercase alphanumeric verification code.

```typescript
const code = Certificate.generateVerificationCode();
// Returns: "ABCD1234EFGH5678" (example)
```

**Implementation Details:**
- Uses Node.js crypto module for secure random generation
- Generates 16 random bytes and maps them to alphanumeric characters
- Character set: A-Z, 0-9 (36 possible characters)
- Returns uppercase string of exactly 16 characters

## Pre-Save Hooks

### Verification Code Auto-Generation

The model includes a pre-save hook that automatically generates a unique verification code if one is not provided:

```typescript
CertificateSchema.pre<ICertificate>('save', async function () {
  if (!this.verificationCode) {
    // Generate unique verification code
    // Attempts up to 10 times to ensure uniqueness
    // Throws error if unable to generate unique code
  }
});
```

**Behavior:**
- Only runs if verificationCode is not already set
- Attempts to generate a unique code up to 10 times
- Checks database for existing codes to ensure uniqueness
- Throws error if unable to generate unique code after 10 attempts
- Validates that verification code is set before saving

## Usage Examples

### Creating a Certificate

```typescript
import Certificate from './models/Certificate';

// Create certificate with explicit verification code
const certificate = await Certificate.create({
  enrollmentId: enrollmentId,
  studentId: studentId,
  courseId: courseId,
  studentName: 'John Doe',
  courseTitle: 'Introduction to TypeScript',
  instructorName: 'Jane Smith',
  completionDate: new Date(),
  verificationCode: 'ABCD1234EFGH5678',
  certificateUrl: 'https://cdn.example.com/certificates/cert123.pdf',
});

// Create certificate with auto-generated verification code
const certificate = await Certificate.create({
  enrollmentId: enrollmentId,
  studentId: studentId,
  courseId: courseId,
  studentName: 'John Doe',
  courseTitle: 'Introduction to TypeScript',
  instructorName: 'Jane Smith',
  completionDate: new Date(),
  certificateUrl: 'https://cdn.example.com/certificates/cert123.pdf',
  // verificationCode will be auto-generated
});
```

### Querying Certificates

```typescript
// Find certificate by ID
const certificate = await Certificate.findById(certificateId);

// Find certificates by student
const studentCertificates = await Certificate.find({ studentId: studentId });

// Find certificate by enrollment
const certificate = await Certificate.findOne({ enrollmentId: enrollmentId });

// Verify certificate
const certificate = await Certificate.findOne({
  _id: certificateId,
  verificationCode: verificationCode,
});

if (certificate) {
  console.log('Certificate is valid');
} else {
  console.log('Invalid certificate or verification code');
}
```

### Generating Verification Code

```typescript
// Generate a verification code
const code = Certificate.generateVerificationCode();
console.log(code); // Example: "XYZ789ABC123DEF4"
```

## Relationships

### With Enrollment Model
- **enrollmentId** references Enrollment (one-to-one)
- Each certificate is associated with exactly one enrollment
- Unique constraint ensures one certificate per enrollment

### With User Model
- **studentId** references User (many-to-one)
- A student can have multiple certificates (one per completed course)

### With Course Model
- **courseId** references Course (many-to-one)
- A course can have multiple certificates (one per student completion)

## Error Handling

### Validation Errors

```typescript
// Missing required field
try {
  await Certificate.create({
    studentId: studentId,
    courseId: courseId,
    // Missing enrollmentId
  });
} catch (error) {
  // ValidationError: Certificate validation failed: enrollmentId: Enrollment ID is required
}

// Invalid verification code format
try {
  await Certificate.create({
    enrollmentId: enrollmentId,
    studentId: studentId,
    courseId: courseId,
    studentName: 'John Doe',
    courseTitle: 'Test Course',
    instructorName: 'Jane Smith',
    completionDate: new Date(),
    verificationCode: 'invalid-code', // Contains special characters
    certificateUrl: 'https://example.com/cert.pdf',
  });
} catch (error) {
  // ValidationError: Verification code must be 16 uppercase alphanumeric characters
}

// Invalid certificate URL (not HTTPS)
try {
  await Certificate.create({
    enrollmentId: enrollmentId,
    studentId: studentId,
    courseId: courseId,
    studentName: 'John Doe',
    courseTitle: 'Test Course',
    instructorName: 'Jane Smith',
    completionDate: new Date(),
    verificationCode: 'ABCD1234EFGH5678',
    certificateUrl: 'http://example.com/cert.pdf', // HTTP instead of HTTPS
  });
} catch (error) {
  // ValidationError: Certificate URL must be a valid HTTPS URL
}
```

### Duplicate Errors

```typescript
// Duplicate enrollmentId
try {
  await Certificate.create({
    enrollmentId: existingEnrollmentId, // Already has a certificate
    studentId: studentId,
    courseId: courseId,
    studentName: 'John Doe',
    courseTitle: 'Test Course',
    instructorName: 'Jane Smith',
    completionDate: new Date(),
    verificationCode: 'ABCD1234EFGH5678',
    certificateUrl: 'https://example.com/cert.pdf',
  });
} catch (error) {
  // MongoError: E11000 duplicate key error (enrollmentId)
}

// Duplicate verificationCode
try {
  await Certificate.create({
    enrollmentId: enrollmentId,
    studentId: studentId,
    courseId: courseId,
    studentName: 'John Doe',
    courseTitle: 'Test Course',
    instructorName: 'Jane Smith',
    completionDate: new Date(),
    verificationCode: 'EXISTINGCODE1234', // Already exists
    certificateUrl: 'https://example.com/cert.pdf',
  });
} catch (error) {
  // MongoError: E11000 duplicate key error (verificationCode)
}
```

## Best Practices

1. **Always use HTTPS URLs**: Certificate URLs must use HTTPS for security
2. **Let verification codes auto-generate**: Unless you have a specific reason, let the pre-save hook generate unique verification codes
3. **Validate enrollment completion**: Before creating a certificate, ensure the enrollment is marked as completed
4. **Store certificate metadata**: Include student name, course title, and instructor name for certificate display
5. **Use proper error handling**: Handle validation and duplicate key errors appropriately
6. **Verify certificates properly**: Always check both certificate ID and verification code for verification
7. **Index optimization**: The model has indexes on enrollmentId, studentId, and verificationCode for efficient queries

## Security Considerations

1. **Verification Code Uniqueness**: The 16-character alphanumeric code provides 36^16 possible combinations, making it extremely difficult to guess
2. **HTTPS Requirement**: Certificate URLs must use HTTPS to ensure secure transmission
3. **Cryptographic Random Generation**: Verification codes use Node.js crypto module for secure random generation
4. **One Certificate Per Enrollment**: Unique constraint on enrollmentId prevents duplicate certificates
5. **Immutable Verification Codes**: Once generated, verification codes should not be changed to maintain certificate integrity

## Performance Considerations

1. **Indexed Queries**: Use indexed fields (enrollmentId, studentId, verificationCode) for efficient queries
2. **Verification Code Generation**: The pre-save hook may perform multiple database queries to ensure uniqueness; consider generating codes in advance for bulk operations
3. **Population**: When querying certificates, consider whether you need to populate related documents (student, course, enrollment)

## Testing

The model includes comprehensive unit tests covering:
- Schema validation (9 tests)
- Field validation (11 tests)
- Verification code validation (4 tests)
- Unique constraints (2 tests)
- Verification code generation (4 tests)
- Timestamps (2 tests)
- Indexes (3 tests)
- JSON/Object transformations (2 tests)

Total: 37 tests, all passing

## TypeScript Interfaces

```typescript
export interface ICertificate extends Document {
  enrollmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  verificationCode: string;
  certificateUrl: string;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificateModel extends Model<ICertificate> {
  generateVerificationCode(): string;
}
```

## Migration Notes

When migrating existing data:
1. Ensure all enrollmentId values are unique
2. Generate verification codes for existing certificates
3. Validate all certificate URLs are HTTPS
4. Ensure all required fields are populated
5. Create indexes after data migration for better performance
