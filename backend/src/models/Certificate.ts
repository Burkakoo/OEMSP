import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Interfaces
export interface ICertificate extends Document {
  enrollmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  certificateId: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  verificationCode: string;
  certificateUrl: string;
  publicVerificationUrl?: string;
  templateId?: mongoose.Types.ObjectId;
  templateName?: string;
  skillsAwarded: string[];
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Certificate model with static methods
export interface ICertificateModel extends Model<ICertificate> {
  generateVerificationCode(): string;
  generateCertificateId(): string;
}

// Main Certificate Schema
const CertificateSchema = new Schema<ICertificate>(
  {
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment ID is required'],
      unique: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    certificateId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^CERT-[A-Z0-9]{10}$/, 'Certificate ID must match CERT-XXXXXXXXXX'],
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Student name must be at least 2 characters'],
      maxlength: [200, 'Student name cannot exceed 200 characters'],
    },
    courseTitle: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [5, 'Course title must be at least 5 characters'],
      maxlength: [200, 'Course title cannot exceed 200 characters'],
    },
    instructorName: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
      minlength: [2, 'Instructor name must be at least 2 characters'],
      maxlength: [200, 'Instructor name cannot exceed 200 characters'],
    },
    completionDate: {
      type: Date,
      required: [true, 'Completion date is required'],
    },
    verificationCode: {
      type: String,
      unique: true,
      length: [16, 'Verification code must be exactly 16 characters'],
      match: [/^[A-Z0-9]{16}$/, 'Verification code must be 16 uppercase alphanumeric characters'],
    },
    certificateUrl: {
      type: String,
      required: [true, 'Certificate URL is required'],
      trim: true,
      match: [/^https:\/\/.+/, 'Certificate URL must be a valid HTTPS URL'],
    },
    publicVerificationUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Public verification URL must be a valid URL'],
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'CertificateTemplate',
    },
    templateName: {
      type: String,
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    skillsAwarded: {
      type: [String],
      default: [],
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Issued at timestamp is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
// Unique index on enrollmentId to ensure one certificate per enrollment
CertificateSchema.index({ enrollmentId: 1 }, { unique: true });

// Non-unique index on studentId for querying user certificates
CertificateSchema.index({ studentId: 1 });

// Unique index on verificationCode for certificate verification
CertificateSchema.index({ verificationCode: 1 }, { unique: true });
CertificateSchema.index({ certificateId: 1 }, { unique: true });

// Static method to generate unique 16-character alphanumeric verification code
CertificateSchema.statics.generateVerificationCode = function (): string {
  // Generate a random 16-character uppercase alphanumeric code
  // Using crypto for cryptographically secure random generation
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate 16 random bytes and convert to alphanumeric characters
  const randomBytes = crypto.randomBytes(16);
  
  for (let i = 0; i < 16; i++) {
    // Use modulo to map byte value to character index
    const byteValue = randomBytes[i];
    if (byteValue !== undefined) {
      code += characters[byteValue % characters.length];
    }
  }
  
  return code;
};

CertificateSchema.statics.generateCertificateId = function (): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  const randomBytes = crypto.randomBytes(10);

  for (let i = 0; i < 10; i++) {
    const byteValue = randomBytes[i];
    if (byteValue !== undefined) {
      suffix += characters[byteValue % characters.length];
    }
  }

  return `CERT-${suffix}`;
};

// Pre-save hook to generate verification code if not provided
CertificateSchema.pre<ICertificate>('save', async function () {
  // Only generate verification code if it's not already set
  if (!this.verificationCode) {
    const Certificate = this.constructor as ICertificateModel;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Try to generate a unique verification code
    while (!isUnique && attempts < maxAttempts) {
      const code = Certificate.generateVerificationCode();
      
      // Check if code already exists
      const existing = await Certificate.findOne({ verificationCode: code });
      
      if (!existing) {
        this.verificationCode = code;
        isUnique = true;
      }
      
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Failed to generate unique verification code after multiple attempts');
    }
  }

  if (!this.certificateId) {
    const Certificate = this.constructor as ICertificateModel;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const certificateId = Certificate.generateCertificateId();
      const existing = await Certificate.findOne({ certificateId });

      if (!existing) {
        this.certificateId = certificateId;
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique certificate ID after multiple attempts');
    }
  }
  
  // Validate that verification code is set
  if (!this.verificationCode) {
    throw new Error('Verification code is required');
  }
  if (!this.certificateId) {
    throw new Error('Certificate ID is required');
  }
});

// Create and export the model
const Certificate = mongoose.model<ICertificate, ICertificateModel>(
  'Certificate',
  CertificateSchema
);

export default Certificate;
