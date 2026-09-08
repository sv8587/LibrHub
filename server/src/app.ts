import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow inline styles/scripts and Vite previews
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API Router
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
