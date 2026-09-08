import { Router } from 'express';
import { reportController } from '../controllers/reportController';

const router = Router();

router.get('/transactions/csv', (req, res) => reportController.exportCsv(req, res));
router.get('/transactions/excel', (req, res) => reportController.exportExcel(req, res));
router.get('/export/csv', (req, res) => reportController.exportCsv(req, res));
router.get('/export/excel', (req, res) => reportController.exportExcel(req, res));
router.get('/csv', (req, res) => reportController.exportCsv(req, res));
router.get('/excel', (req, res) => reportController.exportExcel(req, res));

export default router;
