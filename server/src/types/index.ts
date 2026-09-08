export interface IBook {
  _id?: string;
  id?: string;
  title: string;
  author: string;
  bookId: string;
  isbn: string;
  coverUrl?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  status?: 'Available' | 'Issued';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ITransaction {
  _id?: string;
  id?: string;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookIsbn?: string;
  bookCategory?: string;
  borrowerName: string;
  borrowerId: string;
  issueTimestamp: string | Date;
  dueDate: string | Date;
  returnTimestamp: string | Date | null;
  status: 'ISSUED' | 'RETURNED';
  isOverdue?: boolean;
  daysOverdue?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IUser {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: 'librarian' | 'admin';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
