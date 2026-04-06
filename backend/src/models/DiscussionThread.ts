import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDiscussionReply {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussionThread extends Document {
  courseId: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  replies: IDiscussionReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussionThreadModel extends Model<IDiscussionThread> {}

const DiscussionReplySchema = new Schema<IDiscussionReply>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reply author is required'],
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      minlength: [2, 'Reply must be at least 2 characters'],
      maxlength: [2000, 'Reply cannot exceed 2000 characters'],
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const DiscussionThreadSchema = new Schema<IDiscussionThread>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Thread title is required'],
      trim: true,
      minlength: [3, 'Thread title must be at least 3 characters'],
      maxlength: [200, 'Thread title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Thread content is required'],
      trim: true,
      minlength: [5, 'Thread content must be at least 5 characters'],
      maxlength: [5000, 'Thread content cannot exceed 5000 characters'],
    },
    replies: {
      type: [DiscussionReplySchema],
      default: [],
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

DiscussionThreadSchema.index({ courseId: 1, lessonId: 1, createdAt: -1 });
DiscussionThreadSchema.index({ authorId: 1, createdAt: -1 });

const DiscussionThread = mongoose.model<IDiscussionThread, IDiscussionThreadModel>(
  'DiscussionThread',
  DiscussionThreadSchema
);

export default DiscussionThread;
