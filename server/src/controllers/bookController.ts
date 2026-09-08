import { Request, Response } from 'express';
import { bookService } from '../services/bookService';
import { qrService } from '../services/qrService';

export class BookController {
  async getAllBooks(req: Request, res: Response) {
    try {
      const { search, category, availability, author, sortBy, sortOrder, page, limit } = req.query;

      const result = await bookService.getAllBooks({
        search: search as string,
        category: category as string,
        availability: availability as any,
        author: author as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
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
        message: err.message || 'Failed to retrieve books',
      });
    }
  }

  async getBookById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: `Book with ID "${id}" not found`,
        });
      }

      res.json({
        success: true,
        book,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Error fetching book',
      });
    }
  }

  async createBook(req: Request, res: Response) {
    try {
      const book = await bookService.createBook(req.body);
      res.status(201).json({
        success: true,
        message: `Book "${book.title}" added successfully with ID ${book.bookId}`,
        book,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to add book',
      });
    }
  }

  async updateBook(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await bookService.updateBook(id, req.body);

      res.json({
        success: true,
        message: `Book "${updated.title}" updated successfully`,
        book: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to update book',
      });
    }
  }

  async deleteBook(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await bookService.deleteBook(id);

      res.json({
        success: true,
        message: `Book "${result.deletedBookId}" removed from catalogue`,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Failed to delete book',
      });
    }
  }

  async getBookQR(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: `Book "${id}" not found for QR generation`,
        });
      }

      const qrData = await qrService.generateBookQR(book.bookId);

      res.json({
        success: true,
        ...qrData,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to generate QR code',
      });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await bookService.getAllCategories();
      res.json({
        success: true,
        categories,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch categories',
      });
    }
  }
}

export const bookController = new BookController();
export default bookController;
