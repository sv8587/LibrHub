import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { initStore, INITIAL_BOOKS, INITIAL_TRANSACTIONS, isDbConnected } from '../services/store';
import BookModel from '../models/Book';
import TransactionModel from '../models/Transaction';
import UserModel from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

async function runSeed() {
  console.log('🌱 Starting LibrHub database seed...');

  const { mode, isConnected } = await connectDB();
  console.log(`Connection state: mode=${mode}, isConnected=${isConnected}`);

  if (isConnected) {
    try {
      console.log('Clearing existing records in MongoDB Atlas / local MongoDB...');
      await BookModel.deleteMany({});
      await TransactionModel.deleteMany({});
      await UserModel.deleteMany({});

      console.log(`Inserting ${INITIAL_BOOKS.length} books...`);
      await BookModel.insertMany(INITIAL_BOOKS as any);

      console.log(`Inserting ${INITIAL_TRANSACTIONS.length} transactions...`);
      await TransactionModel.insertMany(INITIAL_TRANSACTIONS as any);

      const hashedPassword = await bcrypt.hash('Admin@12345', 10);
      await UserModel.create([
        {
          username: 'admin',
          email: 'admin@librhub.library',
          password: hashedPassword,
          name: 'Neha Sharma (Head Librarian)',
          role: 'admin',
        },
        {
          username: 'librarian',
          email: 'librarian@librhub.library',
          password: hashedPassword,
          name: 'Rohan Mehta (Assistant Librarian)',
          role: 'librarian',
        },
      ]);

      console.log('✅ MongoDB database successfully seeded with realistic library records!');
    } catch (err: any) {
      console.error('Error during MongoDB seeding:', err.message);
    }
  } else {
    console.log('In-memory database initialized with realistic records.');
    await initStore();
    console.log(`✅ Preloaded ${INITIAL_BOOKS.length} books and ${INITIAL_TRANSACTIONS.length} transactions in-memory.`);
  }

  console.log('\nSample Librarian Credentials:');
  console.log('Email:    admin@librhub.library');
  console.log('Password: Admin@12345\n');

  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed script fatal error:', err);
  process.exit(1);
});
