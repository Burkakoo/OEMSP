import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLogModel extends Model<IAuditLog> {}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    resourceId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    method: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    statusCode: {
      type: Number,
      required: true,
      min: 100,
      max: 599,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
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

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, createdAt: -1 });
AuditLogSchema.index({ method: 1, createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);

export default AuditLog;
