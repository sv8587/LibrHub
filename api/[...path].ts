import type { Request, Response } from 'express';
import { createApp } from '../server/src/app';
import { connectDB } from '../server/src/config/db';
import { initStore } from '../server/src/services/store';

const app = createApp();

let initialized = false;
let initializationPromise: Promise<void> | null = null;

async function initialize() {
  if (initialized) return;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectDB();
      await initStore();
      initialized = true;
    })();
  }

  await initializationPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    await initialize();
    return app(req, res);
  } catch (error) {
    console.error('LibrHub API initialization error:', error);

    return res.status(500).json({
      success: false,
      message: 'LibrHub API failed to initialize',
    });
  }
}