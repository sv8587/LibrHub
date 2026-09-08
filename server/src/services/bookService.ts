import mongoose from 'mongoose';
import BookModel, { IBookDocument } from '../models/Book';
import { IBook } from '../types';
import { isDbConnected, getInMemoryBooks } from './store';
import TransactionModel from '../models/Transaction';
import { getInMemoryTransactions } from './store';

export interface BookQueryParams {
  search?: string;
  category?: string;
  availability?: 'available' | 'issued' | 'all';
  author?: string;
  sortBy?: 'title' | 'author' | 'createdAt' | 'totalCopies' | 'availableCopies';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class BookService {
  async getAllBooks(params: BookQueryParams = {}) {
    const {
      search = '',
      category = '',
      availability = 'all',
      author = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = params;

    if (isDbConnected()) {
      const filter: any = {};

      if (search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [{ title: regex }, { author: regex }, { bookId: regex }, { isbn: regex }];
      }

      if (category && category !== 'All') {
        filter.category = category;
      }

      if (author) {
        filter.author = new RegExp(author, 'i');
      }

      if (availability === 'available') {
        filter.availableCopies = { $gt: 0 };
      } else if (availability === 'issued') {
        filter.availableCopies = 0;
      }

      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const skip = (Number(page) - 1) * Number(limit);
      const total = await BookModel.countDocuments(filter);
      const books = await BookModel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const formattedBooks = books.map((b: any) => ({
        ...b,
        id: b._id.toString(),
        status: b.availableCopies > 0 ? 'Available' : 'Issued',
      }));

      return {
        books: formattedBooks,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)) || 1,
        },
      };
    }

    // In-Memory Fallback
    let books = [...getInMemoryBooks()];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      books = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.bookId.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category && category !== 'All') {
      books = books.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }

    // Author filter
    if (author) {
      books = books.filter((b) => b.author.toLowerCase().includes(author.toLowerCase()));
    }

    // Availability filter
    if (availability === 'available') {
      books = books.filter((b) => b.availableCopies > 0);
    } else if (availability === 'issued') {
      books = books.filter((b) => b.availableCopies === 0);
    }

    // Sort
    books.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = books.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = books.slice(skip, skip + Number(limit)).map((b) => ({
      ...b,
      status: b.availableCopies > 0 ? 'Available' : 'Issued',
    }));

    return {
      books: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  async getBookById(idOrBookId: string) {
    const cleanId = idOrBookId.trim().toUpperCase();

    if (isDbConnected()) {
      let book: any = await BookModel.findOne({
        $or: [
          { bookId: cleanId },
          ...(mongoose.Types.ObjectId.isValid(idOrBookId) ? [{ _id: idOrBookId }] : []),
        ],
      }).lean();

      if (!book) return null;
      return {
        ...book,
        id: book._id.toString(),
        status: book.availableCopies > 0 ? 'Available' : 'Issued',
      };
    }

    const book = getInMemoryBooks().find(
      (b) =>
        b.bookId.toUpperCase() === cleanId ||
        b.id === idOrBookId ||
        (b._id && b._id.toString() === idOrBookId)
    );

    if (!book) return null;
    return {
      ...book,
      status: book.availableCopies > 0 ? 'Available' : 'Issued',
    };
  }

  async createBook(data: Partial<IBook>) {
    if (!data.title?.trim()) throw new Error('Title is required');
    if (!data.author?.trim()) throw new Error('Author is required');
    if (!data.bookId?.trim()) throw new Error('Book ID is required');
    if (!data.isbn?.trim()) throw new Error('ISBN is required');
    if (!data.category?.trim()) throw new Error('Category is required');

    const totalCopies = Number(data.totalCopies ?? 1);
    if (isNaN(totalCopies) || totalCopies < 0) {
      throw new Error('Total copies must be a non-negative number');
    }

    const availableCopies =
      data.availableCopies !== undefined ? Number(data.availableCopies) : totalCopies;
    if (isNaN(availableCopies) || availableCopies < 0) {
      throw new Error('Available copies must be a non-negative number');
    }
    if (availableCopies > totalCopies) {
      throw new Error('Available copies cannot exceed total copies');
    }

    const cleanBookId = data.bookId.trim().toUpperCase();

    // Check duplicate
    const existing = await this.getBookById(cleanBookId);
    if (existing) {
      throw new Error(`A book with Book ID "${cleanBookId}" already exists`);
    }

    const newBookData: IBook = {
      title: data.title.trim(),
      author: data.author.trim(),
      bookId: cleanBookId,
      isbn: data.isbn.trim(),
      category: data.category.trim(),
      totalCopies,
      availableCopies,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      const doc = await BookModel.create(newBookData);
      return {
        ...doc.toObject(),
        id: doc._id.toString(),
        status: doc.availableCopies > 0 ? 'Available' : 'Issued',
      };
    }

    const created: IBook = {
      ...newBookData,
      id: 'BK-' + Date.now().toString(36).toUpperCase(),
    };
    getInMemoryBooks().unshift(created);
    return {
      ...created,
      status: created.availableCopies > 0 ? 'Available' : 'Issued',
    };
  }

  async updateBook(idOrBookId: string, data: Partial<IBook>) {
    const existing = await this.getBookById(idOrBookId);
    if (!existing) {
      throw new Error(`Book "${idOrBookId}" not found`);
    }

    if (data.totalCopies !== undefined && Number(data.totalCopies) < 0) {
      throw new Error('Total copies cannot be negative');
    }
    if (data.availableCopies !== undefined && Number(data.availableCopies) < 0) {
      throw new Error('Available copies cannot be negative');
    }
    if (
      data.totalCopies !== undefined &&
      data.availableCopies !== undefined &&
      Number(data.availableCopies) > Number(data.totalCopies)
    ) {
      throw new Error('Available copies cannot exceed total copies');
    }

    if (isDbConnected()) {
      const updatePayload: any = { ...data, updatedAt: new Date() };
      if (updatePayload.bookId) updatePayload.bookId = updatePayload.bookId.toUpperCase().trim();

      const updated = await BookModel.findOneAndUpdate(
        {
          $or: [
            { bookId: existing.bookId },
            ...(existing.id && mongoose.Types.ObjectId.isValid(existing.id)
              ? [{ _id: existing.id }]
              : []),
          ],
        },
        updatePayload,
        { new: true }
      ).lean();

      return {
        ...updated,
        id: updated._id.toString(),
        status: updated.availableCopies > 0 ? 'Available' : 'Issued',
      };
    }

    const books = getInMemoryBooks();
    const index = books.findIndex((b) => b.bookId === existing.bookId);
    if (index === -1) throw new Error('Book not found in memory store');

    books[index] = {
      ...books[index],
      ...data,
      bookId: data.bookId ? data.bookId.trim().toUpperCase() : books[index].bookId,
      updatedAt: new Date(),
    };

    return {
      ...books[index],
      status: books[index].availableCopies > 0 ? 'Available' : 'Issued',
    };
  }

  async deleteBook(idOrBookId: string) {
    const existing = await this.getBookById(idOrBookId);
    if (!existing) {
      throw new Error(`Book "${idOrBookId}" not found`);
    }

    // Safety check: Cannot delete book if active issued transactions exist!
    let activeIssues = 0;
    if (isDbConnected()) {
      activeIssues = await TransactionModel.countDocuments({
        bookId: existing.bookId,
        status: 'ISSUED',
      });
    } else {
      activeIssues = getInMemoryTransactions().filter(
        (t) => t.bookId === existing.bookId && t.status === 'ISSUED'
      ).length;
    }

    if (activeIssues > 0) {
      throw new Error(
        `Cannot delete book "${existing.bookId}" because it currently has ${activeIssues} issued copy(ies). Please return all issued copies first.`
      );
    }

    if (isDbConnected()) {
      await BookModel.deleteOne({ bookId: existing.bookId });
      return { success: true, deletedBookId: existing.bookId };
    }

    const books = getInMemoryBooks();
    const idx = books.findIndex((b) => b.bookId === existing.bookId);
    if (idx !== -1) {
      books.splice(idx, 1);
    }
    return { success: true, deletedBookId: existing.bookId };
  }

  async getAllCategories(): Promise<string[]> {
    if (isDbConnected()) {
      const categories = await BookModel.distinct('category');
      return categories.sort();
    }
    const categories = Array.from(new Set(getInMemoryBooks().map((b) => b.category)));
    return categories.sort();
  }
}

export const bookService = new BookService();
export default bookService;
