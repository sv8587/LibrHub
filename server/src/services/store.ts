import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { IBook, ITransaction, IUser } from '../types';
import BookModel from '../models/Book';
import TransactionModel from '../models/Transaction';
import UserModel from '../models/User';

// In-memory collections as reliable fallback if MongoDB Atlas is not yet configured
let inMemoryBooks: IBook[] = [];
let inMemoryTransactions: ITransaction[] = [];
let inMemoryUsers: IUser[] = [];
let isInitialized = false;

export const INITIAL_BOOKS: IBook[] = [
  { bookId: 'LIB-101', title: 'Five Point Someone', author: 'Chetan Bhagat', isbn: '978-8129115300', category: 'Indian Fiction', totalCopies: 5, availableCopies: 3, createdAt: new Date('2024-01-10T09:00:00Z'), updatedAt: new Date('2024-01-10T09:00:00Z') },
  { bookId: 'LIB-102', title: 'The White Tiger', author: 'Aravind Adiga', isbn: '978-1416562603', category: 'Indian Fiction', totalCopies: 4, availableCopies: 0, createdAt: new Date('2024-01-12T10:30:00Z'), updatedAt: new Date('2024-01-12T10:30:00Z') },
  { bookId: 'LIB-103', title: 'Malgudi Days', author: 'R. K. Narayan', isbn: '978-8185986171', category: 'Indian Literature', totalCopies: 6, availableCopies: 4, createdAt: new Date('2024-01-15T11:00:00Z'), updatedAt: new Date('2024-01-15T11:00:00Z') },
  { bookId: 'LIB-104', title: 'Train to Pakistan', author: 'Khushwant Singh', isbn: '978-0143065883', category: 'Indian Literature', totalCopies: 3, availableCopies: 1, createdAt: new Date('2024-01-18T14:15:00Z'), updatedAt: new Date('2024-01-18T14:15:00Z') },
  { bookId: 'LIB-105', title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', isbn: '978-8173711466', category: 'Biography', totalCopies: 5, availableCopies: 2, createdAt: new Date('2024-01-20T08:45:00Z'), updatedAt: new Date('2024-01-20T08:45:00Z') },
  { bookId: 'LIB-106', title: 'The God of Small Things', author: 'Arundhati Roy', isbn: '978-0006550686', category: 'Indian Literature', totalCopies: 4, availableCopies: 3, createdAt: new Date('2024-02-01T12:00:00Z'), updatedAt: new Date('2024-02-01T12:00:00Z') },
  { bookId: 'LIB-107', title: 'Midnight\'s Children', author: 'Salman Rushdie', isbn: '978-0099578512', category: 'Indian Literature', totalCopies: 3, availableCopies: 0, createdAt: new Date('2024-02-05T13:20:00Z'), updatedAt: new Date('2024-02-05T13:20:00Z') },
  { bookId: 'LIB-108', title: 'A Suitable Boy', author: 'Vikram Seth', isbn: '978-0060786526', category: 'Indian Fiction', totalCopies: 4, availableCopies: 4, createdAt: new Date('2024-02-08T09:30:00Z'), updatedAt: new Date('2024-02-08T09:30:00Z') },
  { bookId: 'LIB-109', title: 'Ignited Minds', author: 'A. P. J. Abdul Kalam', isbn: '978-0143424123', category: 'Science & Technology', totalCopies: 5, availableCopies: 3, createdAt: new Date('2024-02-12T15:00:00Z'), updatedAt: new Date('2024-02-12T15:00:00Z') },
  { bookId: 'LIB-110', title: 'India 2020', author: 'A. P. J. Abdul Kalam', isbn: '978-8173711626', category: 'Science & Technology', totalCopies: 4, availableCopies: 2, createdAt: new Date('2024-02-16T11:45:00Z'), updatedAt: new Date('2024-02-16T11:45:00Z') },
  { bookId: 'LIB-111', title: 'The Discovery of India', author: 'Jawaharlal Nehru', isbn: '978-0143031031', category: 'History', totalCopies: 6, availableCopies: 5, createdAt: new Date('2024-02-20T10:10:00Z'), updatedAt: new Date('2024-02-20T10:10:00Z') },
  { bookId: 'LIB-112', title: 'The Argumentative Indian', author: 'Amartya Sen', isbn: '978-0141012117', category: 'Economics & Society', totalCopies: 5, availableCopies: 2, createdAt: new Date('2024-02-24T16:30:00Z'), updatedAt: new Date('2024-02-24T16:30:00Z') },
  { bookId: 'LIB-113', title: 'The Palace of Illusions', author: 'Chitra Banerjee Divakaruni', isbn: '978-0385528221', category: 'Mythology', totalCopies: 4, availableCopies: 3, createdAt: new Date('2024-03-01T09:15:00Z'), updatedAt: new Date('2024-03-01T09:15:00Z') },
  { bookId: 'LIB-114', title: 'The Namesake', author: 'Jhumpa Lahiri', isbn: '978-0618485222', category: 'Indian Diaspora', totalCopies: 3, availableCopies: 1, createdAt: new Date('2024-03-05T14:40:00Z'), updatedAt: new Date('2024-03-05T14:40:00Z') },
  { bookId: 'LIB-115', title: 'The Immortals of Meluha', author: 'Amish Tripathi', isbn: '978-9380658742', category: 'Mythology', totalCopies: 4, availableCopies: 4, createdAt: new Date('2024-03-10T11:00:00Z'), updatedAt: new Date('2024-03-10T11:00:00Z') },
  { bookId: 'LIB-116', title: 'The Inheritance of Loss', author: 'Kiran Desai', isbn: '978-0802142818', category: 'Indian Fiction', totalCopies: 3, availableCopies: 2, createdAt: new Date('2024-03-12T13:10:00Z'), updatedAt: new Date('2024-03-12T13:10:00Z') },
  { bookId: 'LIB-117', title: "1984", author: 'George Orwell', isbn: '9780451524935', category: 'Classic Fiction', totalCopies: 5, availableCopies: 4, createdAt: new Date('2024-03-15T09:20:00Z'), updatedAt: new Date('2024-03-15T09:20:00Z') },
  { bookId: 'LIB-118', title: "To Kill a Mockingbird", author: 'Harper Lee', isbn: '9780061120084', category: 'Classic Fiction', totalCopies: 4, availableCopies: 3, createdAt: new Date('2024-03-18T10:00:00Z'), updatedAt: new Date('2024-03-18T10:00:00Z') },
  { bookId: 'LIB-119', title: "The Great Gatsby", author: 'F. Scott Fitzgerald', isbn: '9780743273565', category: 'Classic Fiction', totalCopies: 5, availableCopies: 2, createdAt: new Date('2024-03-20T11:15:00Z'), updatedAt: new Date('2024-03-20T11:15:00Z') },
  { bookId: 'LIB-120', title: "Pride and Prejudice", author: 'Jane Austen', isbn: '9780141439518', category: 'Romance & Classics', totalCopies: 4, availableCopies: 4, createdAt: new Date('2024-03-22T13:00:00Z'), updatedAt: new Date('2024-03-22T13:00:00Z') },
  { bookId: 'LIB-121', title: "Jane Eyre", author: 'Charlotte Brontë', isbn: '9780141441146', category: 'Classic Fiction', totalCopies: 4, availableCopies: 3, createdAt: new Date('2024-03-25T14:10:00Z'), updatedAt: new Date('2024-03-25T14:10:00Z') },
  { bookId: 'LIB-122', title: "The Hobbit", author: 'J. R. R. Tolkien', isbn: '9780547928227', category: 'Fantasy', totalCopies: 5, availableCopies: 2, createdAt: new Date('2024-03-28T09:45:00Z'), updatedAt: new Date('2024-03-28T09:45:00Z') },
  { bookId: 'LIB-123', title: "Harry Potter and the Philosopher's Stone", author: 'J. K. Rowling', isbn: '9780590353427', category: 'Fantasy', totalCopies: 6, availableCopies: 5, createdAt: new Date('2024-04-01T10:30:00Z'), updatedAt: new Date('2024-04-01T10:30:00Z') },
  { bookId: 'LIB-124', title: "The Catcher in the Rye", author: 'J. D. Salinger', isbn: '9780316769488', category: 'Classic Fiction', totalCopies: 4, availableCopies: 2, createdAt: new Date('2024-04-04T12:00:00Z'), updatedAt: new Date('2024-04-04T12:00:00Z') },
  { bookId: 'LIB-125', title: "Little Women", author: 'Louisa May Alcott', isbn: '9780147514011', category: 'Classic Fiction', totalCopies: 4, availableCopies: 4, createdAt: new Date('2024-04-07T15:20:00Z'), updatedAt: new Date('2024-04-07T15:20:00Z') },
  { bookId: 'LIB-126', title: "Animal Farm", author: 'George Orwell', isbn: '9780451526342', category: 'Political Fiction', totalCopies: 5, availableCopies: 3, createdAt: new Date('2024-04-10T09:00:00Z'), updatedAt: new Date('2024-04-10T09:00:00Z') },
  { bookId: 'LIB-127', title: "Hamlet", author: 'William Shakespeare', isbn: '9780743477123', category: 'Drama', totalCopies: 4, availableCopies: 3, createdAt: new Date('2024-04-12T11:40:00Z'), updatedAt: new Date('2024-04-12T11:40:00Z') },
  { bookId: 'LIB-128', title: "Lord of the Flies", author: 'William Golding', isbn: '9780399501487', category: 'Classic Fiction', totalCopies: 4, availableCopies: 1, createdAt: new Date('2024-04-15T16:00:00Z'), updatedAt: new Date('2024-04-15T16:00:00Z') },
];

// Reference date for realistic overdue scenarios
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const daysFuture = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

export const INITIAL_TRANSACTIONS: ITransaction[] = [
  // 1. Overdue issue (LIB-102 borrowed by Aakriti, due 5 days ago)
  {
    id: 'TXN-001',
    bookId: 'LIB-102',
    borrowerName: 'Aakriti Bansal',
    borrowerId: 'RA2500000000001',
    issueTimestamp: daysAgo(19),
    dueDate: daysAgo(5),
    returnTimestamp: null,
    status: 'ISSUED',
    createdAt: daysAgo(19),
    updatedAt: daysAgo(19),
  },
  // 2. Overdue issue (LIB-107 borrowed by Abhinav, due 2 days ago)
  {
    id: 'TXN-002',
    bookId: 'LIB-107',
    borrowerName: 'Abhinav Khatri',
    borrowerId: 'RA2500000000002',
    issueTimestamp: daysAgo(16),
    dueDate: daysAgo(2),
    returnTimestamp: null,
    status: 'ISSUED',
    createdAt: daysAgo(16),
    updatedAt: daysAgo(16),
  },
  // 3. Active on-time issue (LIB-101 borrowed by Aditi, due in 7 days)
  {
    id: 'TXN-003',
    bookId: 'LIB-101',
    borrowerName: 'Aditi Goswami',
    borrowerId: 'RA2500000000003',
    issueTimestamp: daysAgo(7),
    dueDate: daysFuture(7),
    returnTimestamp: null,
    status: 'ISSUED',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  // 4. Active on-time issue (LIB-104 borrowed by Ajinkya, due in 10 days)
  {
    id: 'TXN-004',
    bookId: 'LIB-104',
    borrowerName: 'Ajinkya Gawande',
    borrowerId: 'RA2500000000004',
    issueTimestamp: daysAgo(4),
    dueDate: daysFuture(10),
    returnTimestamp: null,
    status: 'ISSUED',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  // 5. Active on-time issue (LIB-105 borrowed by Alok, due in 12 days)
  {
    id: 'TXN-005',
    bookId: 'LIB-105',
    borrowerName: 'Alok Keshri',
    borrowerId: 'RA2500000000005',
    issueTimestamp: daysAgo(2),
    dueDate: daysFuture(12),
    returnTimestamp: null,
    status: 'ISSUED',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  // 6. Active on-time issue (LIB-112 borrowed by Amrita, due in 5 days)
  {
    id: 'TXN-006',
    bookId: 'LIB-112',
    borrowerName: 'Amrita Panigrahi',
    borrowerId: 'RA2500000000006',
    issueTimestamp: daysAgo(9),
    dueDate: daysFuture(5),
    returnTimestamp: null,
    status: 'ISSUED',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
  // 7. Returned on-time (LIB-103 returned by Aniket)
  {
    id: 'TXN-007',
    bookId: 'LIB-103',
    borrowerName: 'Aniket Gosain',
    borrowerId: 'RA2500000000007',
    issueTimestamp: daysAgo(25),
    dueDate: daysAgo(11),
    returnTimestamp: daysAgo(12),
    status: 'RETURNED',
    createdAt: daysAgo(25),
    updatedAt: daysAgo(12),
  },
  // 8. Returned on-time (LIB-106 returned by Anshika)
  {
    id: 'TXN-008',
    bookId: 'LIB-106',
    borrowerName: 'Anshika Yadav',
    borrowerId: 'RA2500000000008',
    issueTimestamp: daysAgo(20),
    dueDate: daysAgo(6),
    returnTimestamp: daysAgo(7),
    status: 'RETURNED',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(7),
  },
  // 9. Returned late (LIB-109 returned by Anup)
  {
    id: 'TXN-009',
    bookId: 'LIB-109',
    borrowerName: 'Anup Nair',
    borrowerId: 'RA2500000000009',
    issueTimestamp: daysAgo(30),
    dueDate: daysAgo(16),
    returnTimestamp: daysAgo(14),
    status: 'RETURNED',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(14),
  },
  // 10. Returned on-time (LIB-111 returned by Aparna)
  {
    id: 'TXN-010',
    bookId: 'LIB-111',
    borrowerName: 'Aparna Kulshrestha',
    borrowerId: 'RA2500000000010',
    issueTimestamp: daysAgo(15),
    dueDate: daysAgo(1),
    returnTimestamp: daysAgo(2),
    status: 'RETURNED',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  },
  // 11. Returned (LIB-113 returned by Aravind)
  {
    id: 'TXN-011',
    bookId: 'LIB-113',
    borrowerName: 'Aravind Iyer',
    borrowerId: 'RA2500000000011',
    issueTimestamp: daysAgo(14),
    dueDate: daysAgo(0),
    returnTimestamp: daysAgo(1),
    status: 'RETURNED',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(1),
  },
  // 12. Returned (LIB-114 returned by Archana)
  {
    id: 'TXN-012',
    bookId: 'LIB-114',
    borrowerName: 'Archana Chauhan',
    borrowerId: 'RA2500000000012',
    issueTimestamp: daysAgo(22),
    dueDate: daysAgo(8),
    returnTimestamp: daysAgo(9),
    status: 'RETURNED',
    createdAt: daysAgo(22),
    updatedAt: daysAgo(9),
  },
];

export async function initStore() {
  if (isInitialized) return;

  inMemoryBooks = JSON.parse(JSON.stringify(INITIAL_BOOKS));
  inMemoryTransactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));

  const hashedPassword = await bcrypt.hash('Admin@12345', 10);
  inMemoryUsers = [
    {
      id: 'USR-001',
      username: 'admin',
      email: 'admin@librhub.library',
      password: hashedPassword,
      name: 'Neha Sharma (Head Librarian)',
      role: 'admin',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'USR-002',
      username: 'librarian',
      email: 'librarian@librhub.library',
      password: hashedPassword,
      name: 'Rohan Mehta (Assistant Librarian)',
      role: 'librarian',
      createdAt: new Date('2024-01-05T00:00:00Z'),
      updatedAt: new Date('2024-01-05T00:00:00Z'),
    },
  ];

  isInitialized = true;

  // If Mongoose is already connected to an actual MongoDB, sync / seed database
  if (mongoose.connection.readyState === 1) {
    try {
      const bookCount = await BookModel.countDocuments();
      if (bookCount === 0) {
        console.log('Seeding initial books to MongoDB...');
        await BookModel.insertMany(INITIAL_BOOKS as any);
      }
      const txnCount = await TransactionModel.countDocuments();
      if (txnCount === 0) {
        console.log('Seeding initial transactions to MongoDB...');
        await TransactionModel.insertMany(INITIAL_TRANSACTIONS as any);
      }
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        await UserModel.insertMany(inMemoryUsers as any);
      }
    } catch (e: any) {
      console.warn('Sync to MongoDB had error:', e.message);
    }
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Accessors for in-memory collections
export function getInMemoryBooks(): IBook[] {
  return inMemoryBooks;
}

export function getInMemoryTransactions(): ITransaction[] {
  return inMemoryTransactions;
}

export function getInMemoryUsers(): IUser[] {
  return inMemoryUsers;
}

export function resetInMemoryStore(): void {
  isInitialized = false;
  initStore();
}
