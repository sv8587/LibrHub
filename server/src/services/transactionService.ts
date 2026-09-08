import mongoose from 'mongoose';
import TransactionModel from '../models/Transaction';
import BookModel from '../models/Book';
import { ITransaction } from '../types';
import { isDbConnected, getInMemoryTransactions, getInMemoryBooks } from './store';
import { bookService } from './bookService';

export interface IssueBookDto {
  bookId: string;
  borrowerName: string;
  borrowerId: string;
  issueDate?: string | Date;
  dueDate: string | Date;
}

export interface ReturnBookDto {
  bookId: string;
  borrowerId?: string;
  transactionId?: string;
}

export interface TransactionQueryParams {
  search?: string;
  status?: 'ALL' | 'ISSUED' | 'RETURNED' | 'OVERDUE';
  category?: string;
  borrower?: string;
  book?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class TransactionService {
  /**
   * Helper to enrich transaction with book details and overdue computation
   */
  private enrichTransaction(txn: any, bookMap: Map<string, any>): ITransaction {
    const book = bookMap.get(txn.bookId);
    const dueDate = new Date(txn.dueDate);
    const now = new Date();
    const isReturned = txn.status === 'RETURNED' || !!txn.returnTimestamp;
    const isOverdue = !isReturned && now.getTime() > dueDate.getTime();
    const daysOverdue = isOverdue
      ? Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: txn._id ? txn._id.toString() : txn.id,
      _id: txn._id ? txn._id.toString() : txn.id,
      bookId: txn.bookId,
      bookTitle: book ? book.title : 'Unknown Title',
      bookAuthor: book ? book.author : 'Unknown Author',
      bookIsbn: book ? book.isbn : undefined,
      bookCategory: book ? book.category : 'General',
      borrowerName: txn.borrowerName,
      borrowerId: txn.borrowerId,
      issueTimestamp: txn.issueTimestamp,
      dueDate: txn.dueDate,
      returnTimestamp: txn.returnTimestamp,
      status: txn.status,
      isOverdue,
      daysOverdue,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    };
  }

  async issueBook(dto: IssueBookDto) {
    if (!dto.bookId?.trim()) {
      throw new Error('Book ID is required');
    }
    if (!dto.borrowerName?.trim()) {
      throw new Error('Borrower name cannot be empty');
    }
    if (!dto.borrowerId?.trim()) {
      throw new Error('Borrower ID cannot be empty');
    }
    if (!/^RA25\d{11}$/.test(dto.borrowerId.trim().toUpperCase())) {
      throw new Error('Student ID must follow the format RA25XXXXXXXXXXX');
    }
    if (!dto.dueDate) {
      throw new Error('Due date is required');
    }

    const cleanBookId = dto.bookId.trim().toUpperCase();
    const cleanBorrowerId = dto.borrowerId.trim().toUpperCase();
    const cleanBorrowerName = dto.borrowerName.trim();

    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const dueDate = new Date(dto.dueDate);

    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date format');
    }
    if (dueDate.getTime() <= issueDate.getTime()) {
      throw new Error('Due date must be after the issue date');
    }

    // 1. Verify book exists
    const book = await bookService.getBookById(cleanBookId);
    if (!book) {
      throw new Error(`Book with ID "${cleanBookId}" does not exist in library catalogue`);
    }

    // 2. Verify book has at least one available copy
    if (book.availableCopies <= 0) {
      throw new Error('Book is currently unavailable. All copies have been issued.');
    }

    // 3. Duplicate check: prevent same borrower from issuing duplicate copies of the same book while active
    const activeSameBorrower = await this.getActiveIssueForBorrowerAndBook(
      cleanBookId,
      cleanBorrowerId
    );
    if (activeSameBorrower) {
      throw new Error(
        `Borrower ${cleanBorrowerName} (${cleanBorrowerId}) already has an active issue for book ${cleanBookId}.`
      );
    }

    // 4. Create transaction & decrement availableCopies
    if (isDbConnected()) {
      // Use Mongoose transaction or atomic decrement
      const updatedBook = await BookModel.findOneAndUpdate(
        { bookId: cleanBookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
      );

      if (!updatedBook) {
        throw new Error('Book is currently unavailable. All copies have been issued.');
      }

      const txnDoc = await TransactionModel.create({
        bookId: cleanBookId,
        borrowerName: cleanBorrowerName,
        borrowerId: cleanBorrowerId,
        issueTimestamp: issueDate,
        dueDate: dueDate,
        returnTimestamp: null,
        status: 'ISSUED',
      });

      const bookMap = new Map<string, any>([[cleanBookId, updatedBook]]);
      return this.enrichTransaction(txnDoc.toObject(), bookMap);
    }

    // In-memory operation
    const memoryBooks = getInMemoryBooks();
    const bookIdx = memoryBooks.findIndex((b) => b.bookId === cleanBookId);
    if (bookIdx === -1 || memoryBooks[bookIdx].availableCopies <= 0) {
      throw new Error('Book is currently unavailable. All copies have been issued.');
    }

    memoryBooks[bookIdx].availableCopies -= 1;
    memoryBooks[bookIdx].updatedAt = new Date();

    const newTxn: ITransaction = {
      id: 'TXN-' + Date.now().toString(36).toUpperCase(),
      bookId: cleanBookId,
      borrowerName: cleanBorrowerName,
      borrowerId: cleanBorrowerId,
      issueTimestamp: issueDate,
      dueDate: dueDate,
      returnTimestamp: null,
      status: 'ISSUED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    getInMemoryTransactions().unshift(newTxn);
    const bookMap = new Map<string, any>([[cleanBookId, memoryBooks[bookIdx]]]);
    return this.enrichTransaction(newTxn, bookMap);
  }

  async returnBook(dto: ReturnBookDto) {
    if (!dto.bookId?.trim() && !dto.transactionId?.trim()) {
      throw new Error('Book ID or Transaction ID is required for return');
    }

    const cleanBookId = dto.bookId ? dto.bookId.trim().toUpperCase() : '';
    const cleanBorrowerId = dto.borrowerId ? dto.borrowerId.trim().toUpperCase() : '';
    const returnTime = new Date();

    if (isDbConnected()) {
      let query: any = { status: 'ISSUED' };
      if (dto.transactionId) {
        query._id = dto.transactionId;
      } else {
        query.bookId = cleanBookId;
        if (cleanBorrowerId) {
          query.borrowerId = cleanBorrowerId;
        }
      }

      // Find the most recent active issue transaction
      const activeTxn = await TransactionModel.findOne(query).sort({ issueTimestamp: -1 });

      if (!activeTxn) {
        throw new Error(
          `No active issue transaction found for book "${cleanBookId}". Book cannot be returned.`
        );
      }

      activeTxn.returnTimestamp = returnTime;
      activeTxn.status = 'RETURNED';
      await activeTxn.save();

      // Increment book availableCopies
      const updatedBook = await BookModel.findOneAndUpdate(
        { bookId: activeTxn.bookId },
        { $inc: { availableCopies: 1 } },
        { new: true }
      );

      const bookMap = new Map<string, any>([[activeTxn.bookId, updatedBook]]);
      return this.enrichTransaction(activeTxn.toObject(), bookMap);
    }

    // In-memory operation
    const memoryTxns = getInMemoryTransactions();
    let txnIndex = -1;

    if (dto.transactionId) {
      txnIndex = memoryTxns.findIndex(
        (t) => (t.id === dto.transactionId || t._id === dto.transactionId) && t.status === 'ISSUED'
      );
    } else {
      txnIndex = memoryTxns.findIndex(
        (t) =>
          t.bookId === cleanBookId &&
          t.status === 'ISSUED' &&
          (!cleanBorrowerId || t.borrowerId === cleanBorrowerId)
      );
    }

    if (txnIndex === -1) {
      throw new Error(
        `No active issue transaction found for book "${cleanBookId}". Book cannot be returned.`
      );
    }

    const matchedTxn = memoryTxns[txnIndex];
    matchedTxn.returnTimestamp = returnTime;
    matchedTxn.status = 'RETURNED';
    matchedTxn.updatedAt = returnTime;

    // Increment availableCopies
    const memoryBooks = getInMemoryBooks();
    const bIdx = memoryBooks.findIndex((b) => b.bookId === matchedTxn.bookId);
    if (bIdx !== -1) {
      memoryBooks[bIdx].availableCopies = Math.min(
        memoryBooks[bIdx].totalCopies,
        memoryBooks[bIdx].availableCopies + 1
      );
      memoryBooks[bIdx].updatedAt = returnTime;
    }

    const bookMap = new Map<string, any>([
      [matchedTxn.bookId, bIdx !== -1 ? memoryBooks[bIdx] : null],
    ]);
    return this.enrichTransaction(matchedTxn, bookMap);
  }

  async getActiveIssueForBook(bookId: string) {
    const cleanId = bookId.trim().toUpperCase();

    if (isDbConnected()) {
      const activeTxn = await TransactionModel.findOne({
        bookId: cleanId,
        status: 'ISSUED',
      })
        .sort({ issueTimestamp: -1 })
        .lean();

      if (!activeTxn) return null;
      const book = await BookModel.findOne({ bookId: cleanId }).lean();
      const bookMap = new Map<string, any>([[cleanId, book]]);
      return this.enrichTransaction(activeTxn, bookMap);
    }

    const activeTxn = getInMemoryTransactions().find(
      (t) => t.bookId === cleanId && t.status === 'ISSUED'
    );
    if (!activeTxn) return null;

    const book = getInMemoryBooks().find((b) => b.bookId === cleanId);
    const bookMap = new Map<string, any>([[cleanId, book]]);
    return this.enrichTransaction(activeTxn, bookMap);
  }

  async getActiveIssueForBorrowerAndBook(bookId: string, borrowerId: string) {
    const cleanBookId = bookId.trim().toUpperCase();
    const cleanBorrowerId = borrowerId.trim().toUpperCase();

    if (isDbConnected()) {
      return await TransactionModel.findOne({
        bookId: cleanBookId,
        borrowerId: cleanBorrowerId,
        status: 'ISSUED',
      }).lean();
    }

    return getInMemoryTransactions().find(
      (t) =>
        t.bookId === cleanBookId && t.borrowerId === cleanBorrowerId && t.status === 'ISSUED'
    );
  }

  async getAllTransactions(params: TransactionQueryParams = {}) {
    const {
      search = '',
      status = 'ALL',
      category = '',
      borrower = '',
      book = '',
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = params;

    const now = new Date();

    // Prepare book map for details
    let books: any[] = [];
    if (isDbConnected()) {
      books = await BookModel.find({}).lean();
    } else {
      books = getInMemoryBooks();
    }

    const bookMap = new Map<string, any>();
    books.forEach((b) => bookMap.set(b.bookId, b));

    let allTxns: any[] = [];

    if (isDbConnected()) {
      allTxns = await TransactionModel.find({}).sort({ issueTimestamp: -1 }).lean();
    } else {
      allTxns = [...getInMemoryTransactions()].sort(
        (a, b) => new Date(b.issueTimestamp).getTime() - new Date(a.issueTimestamp).getTime()
      );
    }

    let enriched = allTxns.map((t) => this.enrichTransaction(t, bookMap));

    // Filters
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(
        (t) =>
          t.borrowerName.toLowerCase().includes(q) ||
          t.borrowerId.toLowerCase().includes(q) ||
          t.bookId.toLowerCase().includes(q) ||
          (t.bookTitle && t.bookTitle.toLowerCase().includes(q)) ||
          (t.bookAuthor && t.bookAuthor.toLowerCase().includes(q))
      );
    }

    if (borrower) {
      const bq = borrower.toLowerCase();
      enriched = enriched.filter(
        (t) => t.borrowerName.toLowerCase().includes(bq) || t.borrowerId.toLowerCase().includes(bq)
      );
    }

    if (book) {
      const bkq = book.toLowerCase();
      enriched = enriched.filter(
        (t) =>
          t.bookId.toLowerCase().includes(bkq) ||
          (t.bookTitle && t.bookTitle.toLowerCase().includes(bkq))
      );
    }

    if (category && category !== 'All') {
      enriched = enriched.filter(
        (t) => t.bookCategory && t.bookCategory.toLowerCase() === category.toLowerCase()
      );
    }

    if (status === 'ISSUED') {
      enriched = enriched.filter((t) => t.status === 'ISSUED');
    } else if (status === 'RETURNED') {
      enriched = enriched.filter((t) => t.status === 'RETURNED');
    } else if (status === 'OVERDUE') {
      enriched = enriched.filter((t) => t.isOverdue);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      enriched = enriched.filter((t) => new Date(t.issueTimestamp).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      enriched = enriched.filter((t) => new Date(t.issueTimestamp).getTime() <= end);
    }

    const total = enriched.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = enriched.slice(skip, skip + Number(limit));

    return {
      transactions: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  async getTransactionById(id: string) {
    let txn: any = null;
    if (isDbConnected()) {
      txn = await TransactionModel.findById(id).lean();
    } else {
      txn = getInMemoryTransactions().find((t) => t.id === id || t._id === id);
    }

    if (!txn) return null;

    let book: any = null;
    if (isDbConnected()) {
      book = await BookModel.findOne({ bookId: txn.bookId }).lean();
    } else {
      book = getInMemoryBooks().find((b) => b.bookId === txn.bookId);
    }

    const bookMap = new Map<string, any>([[txn.bookId, book]]);
    return this.enrichTransaction(txn, bookMap);
  }
}

export const transactionService = new TransactionService();
export default transactionService;
