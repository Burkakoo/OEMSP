import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICertificateTemplate extends Document {
  name: string;
  slug: string;
  organizationName: string;
  accentColor: string;
  backgroundColor: string;
  signatureName?: string;
  signatureTitle?: string;
  footerText?: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificateTemplateModel extends Model<ICertificateTemplate> {}

const CertificateTemplateSchema = new Schema<ICertificateTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Template slug can only contain lowercase letters, numbers, and hyphens'],
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    accentColor: {
      type: String,
      required: true,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Accent color must be a valid hex color'],
    },
    backgroundColor: {
      type: String,
      required: true,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Background color must be a valid hex color'],
    },
    signatureName: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    signatureTitle: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    footerText: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

CertificateTemplateSchema.index({ slug: 1 }, { unique: true });
CertificateTemplateSchema.index({ isDefault: 1 });

const CertificateTemplate = mongoose.model<ICertificateTemplate, ICertificateTemplateModel>(
  'CertificateTemplate',
  CertificateTemplateSchema
);

export default CertificateTemplate;
