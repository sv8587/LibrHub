import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

router.post('/chat', (req, res) => aiController.chat(req, res));
router.post('/query', (req, res) => aiController.chat(req, res));
router.post('/ask', (req, res) => aiController.chat(req, res));

export default router;
