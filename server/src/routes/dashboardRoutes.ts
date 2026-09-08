import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', (req, res) => dashboardController.getStats(req, res));

export default router;
