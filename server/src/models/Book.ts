import mongoose, { Schema, Document } from 'mongoose';

export interface IBookDocument extends Document {
  title: string;
  author: string;
  bookId: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  createdAt: Date;
  updatedAt: Date;
  readonly status: 'Available' | 'Issued';
}

const BookSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    bookId: {
      type: String,
      required: [true, 'Book ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies count is required'],
      min: [0, 'Total copies cannot be negative'],
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies count is required'],
      min: [0, 'Available copies cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Dynamically compute availability status as required by specification:
// If availableCopies > 0: "Available", if availableCopies === 0: "Issued"
BookSchema.virtual('status').get(function (this: IBookDocument) {
  return this.availableCopies > 0 ? 'Available' : 'Issued';
});

// Ensure indexes are declared
BookSchema.index({ bookId: 1 }, { unique: true });
BookSchema.index({ isbn: 1 });
BookSchema.index({ category: 1 });
BookSchema.index({ title: 'text', author: 'text', bookId: 'text' });

export const BookModel: mongoose.Model<any> =
  (mongoose.models.Book as mongoose.Model<any>) ||
  mongoose.model<IBookDocument>('Book', BookSchema);
export default BookModel;
