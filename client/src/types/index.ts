export interface Book {
  id: string;
  _id?: string;
  title: string;
  author: string;
  bookId: string;
  isbn: string;
  coverUrl?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  status: 'Available' | 'Issued';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  _id?: string;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookIsbn?: string;
  bookCategory?: string;
  borrowerName: string;
  borrowerId: string;
  issueTimestamp: string;
  dueDate: string;
  returnTimestamp: string | null;
  status: 'ISSUED' | 'RETURNED';
  isOverdue?: boolean;
  daysOverdue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalPhysicalCopies: number;
  availableBooks: number;
  issuedBooks: number;
  overdueBooks: number;
}

export interface CurrentlyIssuedItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn?: string;
  category: string;
  borrowerName: string;
  borrowerId: string;
  issueDate: string;
  dueDate: string;
  isOverdue: boolean;
  daysOverdue: number;
  statusText: string;
}

export interface DashboardData {
  stats: DashboardStats;
  currentlyIssuedList: CurrentlyIssuedItem[];
  recentlyIssued: Array<{
    id: string;
    bookId: string;
    bookTitle: string;
    bookIsbn?: string;
    borrowerName: string;
    borrowerId: string;
    issueDate: string;
    dueDate: string;
  }>;
  recentlyReturned: Array<{
    id: string;
    bookId: string;
    bookTitle: string;
    bookIsbn?: string;
    borrowerName: string;
    borrowerId: string;
    returnDate: string;
  }>;
  recentTransactions: Array<{
    id: string;
    bookId: string;
    bookTitle: string;
    bookIsbn?: string;
    borrowerName: string;
    borrowerId: string;
    issueDate: string;
    dueDate: string;
    returnDate: string | null;
    status: 'ISSUED' | 'RETURNED';
    isOverdue: boolean;
  }>;
  charts: {
    booksByCategory: Array<{ category: string; count: number }>;
    issueVsReturn: Array<{ name: string; count: number; fill: string }>;
    mostBorrowedBooks: Array<{
      bookId: string;
      title: string;
      author: string;
      isbn?: string;
      category: string;
      borrows: number;
    }>;
    mostBorrowedCategories: Array<{ category: string; borrows: number }>;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'librarian' | 'admin';
}
