import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app';
import { connectDB } from './config/db';
import { initStore } from './services/store';

const PORT = 3000;

export async function startServer() {
  const app = createApp();

  // Initialize database connection & seed initial data
  await connectDB();
  await initStore();

  // In development, hook Vite dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LibrHub Server running at http://0.0.0.0:${PORT}`);
  });
}

// Automatically start if executed directly
startServer().catch((err) => {
  console.error('Fatal error starting LibrHub server:', err);
});
