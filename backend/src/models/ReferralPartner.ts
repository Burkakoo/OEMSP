import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReferralPartner extends Document {
  partnerName: string;
  code: string;
  contactEmail?: string;
  commissionRate: number;
  isActive: boolean;
  notes?: string;
  userId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferralPartnerModel extends Model<IReferralPartner> {}

const ReferralPartnerSchema = new Schema<IReferralPartner>(
  {
    partnerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9_-]{4,30}$/, 'Referral code must be 4-30 uppercase characters, numbers, underscores, or hyphens'],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

ReferralPartnerSchema.index({ code: 1 }, { unique: true });
ReferralPartnerSchema.index({ isActive: 1, createdAt: -1 });

const ReferralPartner = mongoose.model<IReferralPartner, IReferralPartnerModel>(
  'ReferralPartner',
  ReferralPartnerSchema
);

export default ReferralPartner;
