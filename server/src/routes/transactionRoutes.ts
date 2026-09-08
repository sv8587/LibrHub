import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';

const router = Router();

router.post('/issue', (req, res) => transactionController.issueBook(req, res));
router.post('/return', (req, res) => transactionController.returnBook(req, res));
router.get('/', (req, res) => transactionController.getAllTransactions(req, res));
router.get('/active/:bookId', (req, res) =>
  transactionController.getActiveIssueByBook(req, res)
);
router.get('/:id', (req, res) => transactionController.getTransactionById(req, res));

export default router;
