import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionDocument extends Document {
  bookId: string;
  borrowerName: string;
  borrowerId: string;
  issueTimestamp: Date;
  dueDate: Date;
  returnTimestamp: Date | null;
  status: 'ISSUED' | 'RETURNED';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    bookId: {
      type: String,
      required: [true, 'Book ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    borrowerName: {
      type: String,
      required: [true, 'Borrower name is required'],
      trim: true,
    },
    borrowerId: {
      type: String,
      required: [true, 'Borrower ID is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    issueTimestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnTimestamp: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED'],
      default: 'ISSUED',
      index: true,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TransactionSchema.index({ bookId: 1, status: 1 });
TransactionSchema.index({ borrowerId: 1 });
TransactionSchema.index({ dueDate: 1 });

export const TransactionModel: mongoose.Model<any> =
  (mongoose.models.Transaction as mongoose.Model<any>) ||
  mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
export default TransactionModel;
