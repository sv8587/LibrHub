import BookModel from '../models/Book';
import TransactionModel from '../models/Transaction';
import { isDbConnected, getInMemoryBooks, getInMemoryTransactions } from './store';
import { transactionService } from './transactionService';

export class DashboardService {
  async getDashboardStats() {
    let books: any[] = [];
    let transactions: any[] = [];

    if (isDbConnected()) {
      books = await BookModel.find({}).lean();
      transactions = await TransactionModel.find({}).sort({ issueTimestamp: -1 }).lean();
    } else {
      books = getInMemoryBooks();
      transactions = getInMemoryTransactions();
    }

    const now = new Date();
    const bookMap = new Map<string, any>();
    books.forEach((b) => bookMap.set(b.bookId, b));

    // 1. Core Stat Cards
    const totalBooks = books.length;
    const availableBooks = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
    const totalPhysicalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);

    const activeIssuedTransactions = transactions.filter((t) => t.status === 'ISSUED');
    const issuedBooksCount = activeIssuedTransactions.length;

    const overdueTransactions = activeIssuedTransactions.filter(
      (t) => new Date(t.dueDate).getTime() < now.getTime()
    );
    const overdueBooksCount = overdueTransactions.length;

    // 2. Currently Issued Section (Brownie Subtask)
    // Book, Borrower, Issue Date, Due Date, Days Overdue (positive or "On Time")
    const currentlyIssuedList = activeIssuedTransactions.map((t) => {
      const book = bookMap.get(t.bookId);
      const dueDate = new Date(t.dueDate);
      const isOverdue = now.getTime() > dueDate.getTime();
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = isOverdue ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

      return {
        id: t._id ? t._id.toString() : t.id,
        bookId: t.bookId,
        bookTitle: book ? book.title : 'Unknown Title',
        bookAuthor: book ? book.author : 'Unknown Author',
        bookIsbn: book ? book.isbn : undefined,
        category: book ? book.category : 'General',
        borrowerName: t.borrowerName,
        borrowerId: t.borrowerId,
        issueDate: t.issueTimestamp,
        dueDate: t.dueDate,
        isOverdue,
        daysOverdue,
        statusText: isOverdue ? `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue` : 'On Time',
      };
    });

    // 3. Recently Issued (Top 5)
    const recentlyIssued = transactions
      .filter((t) => t.status === 'ISSUED')
      .slice(0, 5)
      .map((t) => {
        const book = bookMap.get(t.bookId);
        return {
          id: t._id ? t._id.toString() : t.id,
          bookId: t.bookId,
          bookTitle: book ? book.title : 'Unknown Title',
          bookIsbn: book ? book.isbn : undefined,
          borrowerName: t.borrowerName,
          borrowerId: t.borrowerId,
          issueDate: t.issueTimestamp,
          dueDate: t.dueDate,
        };
      });

    // 4. Recently Returned (Top 5)
    const recentlyReturned = transactions
      .filter((t) => t.status === 'RETURNED' || t.returnTimestamp)
      .slice(0, 5)
      .map((t) => {
        const book = bookMap.get(t.bookId);
        return {
          id: t._id ? t._id.toString() : t.id,
          bookId: t.bookId,
          bookTitle: book ? book.title : 'Unknown Title',
          bookIsbn: book ? book.isbn : undefined,
          borrowerName: t.borrowerName,
          borrowerId: t.borrowerId,
          returnDate: t.returnTimestamp,
        };
      });

    // 5. Recent Combined Transactions Feed (Top 10)
    const recentTransactions = transactions.slice(0, 10).map((t) => {
      const book = bookMap.get(t.bookId);
      const isOverdue =
        t.status === 'ISSUED' && new Date(t.dueDate).getTime() < now.getTime();
      return {
        id: t._id ? t._id.toString() : t.id,
        bookId: t.bookId,
        bookTitle: book ? book.title : 'Unknown Title',
        bookIsbn: book ? book.isbn : undefined,
        borrowerName: t.borrowerName,
        borrowerId: t.borrowerId,
        issueDate: t.issueTimestamp,
        dueDate: t.dueDate,
        returnDate: t.returnTimestamp,
        status: t.status,
        isOverdue,
      };
    });

    // 6. Chart: Books by Category
    const categoryCountMap: Record<string, number> = {};
    books.forEach((b) => {
      const cat = b.category || 'Uncategorized';
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    });
    const booksByCategory = Object.entries(categoryCountMap).map(([category, count]) => ({
      category,
      count,
    }));

    // 7. Chart: Issue vs Return Statistics
    const returnedCount = transactions.filter((t) => t.status === 'RETURNED').length;
    const issueVsReturn = [
      { name: 'Active Issued', count: issuedBooksCount, fill: '#3b82f6' },
      { name: 'Returned', count: returnedCount, fill: '#10b981' },
      { name: 'Overdue', count: overdueBooksCount, fill: '#ef4444' },
    ];

    // 8. Chart & Stats: Most Borrowed Books
    const bookBorrowCounts: Record<string, number> = {};
    transactions.forEach((t) => {
      bookBorrowCounts[t.bookId] = (bookBorrowCounts[t.bookId] || 0) + 1;
    });
    const mostBorrowedBooks = Object.entries(bookBorrowCounts)
      .map(([bId, borrows]) => {
        const book = bookMap.get(bId);
        return {
          bookId: bId,
          title: book ? book.title : bId,
          author: book ? book.author : 'Unknown',
          isbn: book ? book.isbn : undefined,
          category: book ? book.category : 'General',
          borrows,
        };
      })
      .sort((a, b) => b.borrows - a.borrows)
      .slice(0, 5);

    // 9. Most Borrowed Categories
    const categoryBorrowCounts: Record<string, number> = {};
    transactions.forEach((t) => {
      const book = bookMap.get(t.bookId);
      const cat = book ? book.category : 'General';
      categoryBorrowCounts[cat] = (categoryBorrowCounts[cat] || 0) + 1;
    });
    const mostBorrowedCategories = Object.entries(categoryBorrowCounts)
      .map(([category, borrows]) => ({ category, borrows }))
      .sort((a, b) => b.borrows - a.borrows);

    return {
      stats: {
        totalBooks,
        totalPhysicalCopies,
        availableBooks,
        issuedBooks: issuedBooksCount,
        overdueBooks: overdueBooksCount,
      },
      currentlyIssuedList,
      recentlyIssued,
      recentlyReturned,
      recentTransactions,
      charts: {
        booksByCategory,
        issueVsReturn,
        mostBorrowedBooks,
        mostBorrowedCategories,
      },
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
