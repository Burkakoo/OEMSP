# Models Documentation

This directory contains Mongoose models for the MERN Education Platform.

## User Model

The User model represents all users in the system (students, instructors, and admins).

### Features

- **Role-based Access**: Supports three roles - student, instructor, and admin
- **Password Security**: Automatic bcrypt hashing with 12 salt rounds
- **Email Validation**: Enforces valid email format and uniqueness
- **Instructor Approval**: Instructors require admin approval before accessing the system
- **Profile Management**: Supports avatar, bio, phone, address, and social links
- **Timestamps**: Automatic createdAt and updatedAt tracking
- **Last Login**: Tracks user's last login timestamp

### Schema Fields

#### Required Fields
- `email` (String): Unique, lowercase email address
- `passwordHash` (String): Bcrypt hashed password (auto-hashed on save)
- `firstName` (String): 2-50 characters, alphabetic
- `lastName` (String): 2-50 characters, alphabetic
- `role` (Enum): student | instructor | admin

#### Optional Fields
- `profile` (Object): User profile information
  - `avatar` (String): URL to profile image
  - `bio` (String): Max 500 characters
  - `phone` (String): International format
  - `dateOfBirth` (Date)
  - `address` (Object): street, city, state, country, postalCode
  - `socialLinks` (Object): linkedin, twitter, github, website
- `isActive` (Boolean): Account active status (default: true)
- `isEmailVerified` (Boolean): Email verification status (default: false)
- `isApproved` (Boolean): Instructor approval status (default: true for students/admins, false for instructors)
- `approvedBy` (ObjectId): Reference to admin who approved
- `approvedAt` (Date): Timestamp of approval
- `lastLoginAt` (Date): Last login timestamp

### Indexes

- `email`: Unique index for fast lookups and uniqueness enforcement
- `role`: Non-unique index for role-based queries
- `createdAt`: Descending index for sorting by registration date

### Instance Methods

#### `comparePassword(candidatePassword: string): Promise<boolean>`
Compares a plain text password with the hashed password.

```typescript
const user = await User.findOne({ email: 'user@example.com' });
const isValid = await user.comparePassword('Password123!');
```

### Static Methods

#### `validatePasswordStrength(password: string): { valid: boolean; errors: string[] }`
Validates password strength according to requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

```typescript
const result = User.validatePasswordStrength('Password123!');
if (!result.valid) {
  console.log('Password errors:', result.errors);
}
```

### Usage Examples

#### Creating a New User

```typescript
import User, { UserRole } from './models/User';

const user = await User.create({
  email: 'student@example.com',
  passwordHash: 'Password123!', // Will be auto-hashed
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.STUDENT,
});
```

#### Validating Password Before Creating User

```typescript
const password = 'userPassword';
const validation = User.validatePasswordStrength(password);

if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}

const user = await User.create({
  email: 'user@example.com',
  passwordHash: password,
  firstName: 'Jane',
  lastName: 'Smith',
  role: UserRole.STUDENT,
});
```

#### Authenticating a User

```typescript
const user = await User.findOne({ email: 'user@example.com' });

if (!user) {
  throw new Error('User not found');
}

if (!user.isActive) {
  throw new Error('Account is deactivated');
}

if (user.role === UserRole.INSTRUCTOR && !user.isApproved) {
  throw new Error('Account pending admin approval');
}

const isPasswordValid = await user.comparePassword(providedPassword);

if (!isPasswordValid) {
  throw new Error('Invalid credentials');
}

// Update last login
user.lastLoginAt = new Date();
await user.save();
```

#### Approving an Instructor

```typescript
const instructor = await User.findById(instructorId);
const admin = await User.findById(adminId);

instructor.isApproved = true;
instructor.approvedBy = admin._id;
instructor.approvedAt = new Date();
await instructor.save();
```

### Security Features

1. **Password Hashing**: Passwords are automatically hashed using bcrypt with 12 salt rounds before saving
2. **Sensitive Data Protection**: passwordHash is excluded from JSON and object serialization
3. **Email Uniqueness**: Enforced at database level with unique index
4. **Input Validation**: All fields have validation rules to prevent invalid data
5. **Instructor Approval**: Instructors cannot login until approved by admin

### Testing

Comprehensive unit tests are available in `__tests__/User.test.ts` covering:
- Schema validation
- Password hashing and comparison
- Profile field validation
- Instructor approval workflow
- Index verification
- JSON serialization
- Timestamps

Run tests with:
```bash
npm test -- User.test.ts
```
