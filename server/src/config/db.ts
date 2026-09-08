import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let connectionMode: 'atlas' | 'local' | 'memory' = 'memory';

export async function connectDB(): Promise<{ mode: string; isConnected: boolean }> {
  const uri = process.env.MONGODB_URI;

  if (uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))) {
    try {
      console.log('Attempting MongoDB connection to:', uri.replace(/:([^:@]+)@/, ':****@'));
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      connectionMode = uri.includes('mongodb+srv') ? 'atlas' : 'local';
      console.log(`✅ MongoDB connected successfully in [${connectionMode}] mode`);
      return { mode: connectionMode, isConnected: true };
    } catch (err: any) {
      console.warn('⚠️ MongoDB connection failed:', err.message);
      console.log('Switching to high-performance in-memory datastore fallback.');
      isConnected = false;
      connectionMode = 'memory';
      return { mode: 'memory', isConnected: false };
    }
  } else {
    console.log('ℹ️ No MONGODB_URI configured. Running with in-memory resilient datastore.');
    isConnected = false;
    connectionMode = 'memory';
    return { mode: 'memory', isConnected: false };
  }
}

export function getDatabaseStatus() {
  return {
    isConnected: mongoose.connection.readyState === 1 || isConnected,
    mode: connectionMode,
    readyState: mongoose.connection.readyState,
  };
}
