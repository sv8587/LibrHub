import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authMiddleware, (req, res) => authController.getProfile(req, res));

export default router;
