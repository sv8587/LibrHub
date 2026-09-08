import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password?: string;
  name: string;
  role: 'librarian' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['librarian', 'admin'],
      default: 'librarian',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

export const UserModel: mongoose.Model<any> =
  (mongoose.models.User as mongoose.Model<any>) ||
  mongoose.model<IUserDocument>('User', UserSchema);
export default UserModel;
