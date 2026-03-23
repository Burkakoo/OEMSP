import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Enums
export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

// Interfaces
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ISocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

export interface IUserProfile {
  avatar?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: IAddress;
  socialLinks?: ISocialLinks;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profile: IUserProfile;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationCodeExpiresAt?: Date;
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for User model with static methods
export interface IUserModel extends Model<IUser> {
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  };
}

// Schema definitions
const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    linkedin: { 
      type: String, 
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Invalid LinkedIn URL']
    },
    twitter: { 
      type: String, 
      trim: true,
      match: [/^https?:\/\/(www\.)?(twitter|x)\.com\/.*$/, 'Invalid Twitter/X URL']
    },
    github: { 
      type: String, 
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.*$/, 'Invalid GitHub URL']
    },
    website: { 
      type: String, 
      trim: true,
      match: [/^https?:\/\/.*$/, 'Invalid website URL']
    },
  },
  { _id: false }
);

const UserProfileSchema = new Schema<IUserProfile>(
  {
    avatar: { 
      type: String, 
      trim: true,
      match: [/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i, 'Invalid avatar URL']
    },
    bio: { 
      type: String, 
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    phone: { 
      type: String, 
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format']
    },
    dateOfBirth: { type: Date },
    address: { type: AddressSchema },
    socialLinks: { type: SocialLinksSchema },
  },
  { _id: false }
);

// Main User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
      default: UserRole.STUDENT,
    },
    profile: {
      type: UserProfileSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      trim: true,
    },
    emailVerificationCodeExpiresAt: {
      type: Date,
    },
    isApproved: {
      type: Boolean,
      default: function (this: IUser) {
        // Instructors require approval, students and admins are auto-approved
        return this.role !== UserRole.INSTRUCTOR;
      },
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        // Remove sensitive fields from JSON output
        delete (ret as any).passwordHash;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      transform: function (_doc, ret) {
        // Remove sensitive fields from object output
        delete (ret as any).passwordHash;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save hook for password hashing
UserSchema.pre<IUser>('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return;
  }

  // Hash password with bcrypt using 12 salt rounds as per requirements
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    return false;
  }
};

// Static method to validate password strength
UserSchema.statics.validatePasswordStrength = function (
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Create and export the model
const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
