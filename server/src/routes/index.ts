import { Router } from 'express';
import authRoutes from './authRoutes';
import bookRoutes from './bookRoutes';
import transactionRoutes from './transactionRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportRoutes from './reportRoutes';
import aiRoutes from './aiRoutes';
import { bookController } from '../controllers/bookController';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/books', bookRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.get('/qr/:id', (req, res) => bookController.getBookQR(req, res));

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'LibrHub API',
  });
});

export default apiRouter;
