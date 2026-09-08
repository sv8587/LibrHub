import { Request, Response } from 'express';
import { transactionService } from '../services/transactionService';

export class TransactionController {
  async issueBook(req: Request, res: Response) {
    try {
      const { bookId, borrowerName, borrowerId, dueDate, issueDate } = req.body;

      const transaction = await transactionService.issueBook({
        bookId,
        borrowerName,
        borrowerId,
        dueDate,
        issueDate,
      });

      res.status(201).json({
        success: true,
        message: `Book "${transaction.bookTitle}" successfully issued to ${transaction.borrowerName}`,
        transaction,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to issue book',
      });
    }
  }

  async returnBook(req: Request, res: Response) {
    try {
      const { bookId, borrowerId, transactionId } = req.body;

      const transaction = await transactionService.returnBook({
        bookId,
        borrowerId,
        transactionId,
      });

      res.json({
        success: true,
        message: `Book "${transaction.bookTitle}" successfully returned by ${transaction.borrowerName}`,
        transaction,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to return book',
      });
    }
  }

  async getAllTransactions(req: Request, res: Response) {
    try {
      const { search, status, category, borrower, book, startDate, endDate, page, limit } =
        req.query;

      const result = await transactionService.getAllTransactions({
        search: search as string,
        status: status as any,
        category: category as string,
        borrower: borrower as string,
        book: book as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch transactions',
      });
    }
  }

  async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: `Transaction "${id}" not found`,
        });
      }

      res.json({
        success: true,
        transaction,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch transaction',
      });
    }
  }

  async getActiveIssueByBook(req: Request, res: Response) {
    try {
      const { bookId } = req.params;
      const activeTxn = await transactionService.getActiveIssueForBook(bookId);

      res.json({
        success: true,
        activeTransaction: activeTxn,
        isIssued: !!activeTxn,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Error checking book issue status',
      });
    }
  }
}

export const transactionController = new TransactionController();
export default transactionController;
