import QRCode from 'qrcode';
import { bookService } from './bookService';

export class QRService {
  /**
   * Generates a high-resolution QR code data URL for a given book
   */
  async generateBookQR(bookId: string): Promise<{
    bookId: string;
    qrDataUrl: string;
    payload: string;
    bookTitle?: string;
    bookAuthor?: string;
  }> {
    const cleanId = bookId.trim().toUpperCase();
    const book = await bookService.getBookById(cleanId);

    // Payload can be clean JSON identifying the book
    const payloadObject = {
      system: 'LIBRA_LMS',
      bookId: cleanId,
      isbn: book ? book.isbn : undefined,
    };
    const payload = JSON.stringify(payloadObject);

    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 400,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
    });

    return {
      bookId: cleanId,
      qrDataUrl,
      payload,
      bookTitle: book ? book.title : undefined,
      bookAuthor: book ? book.author : undefined,
    };
  }
}

export const qrService = new QRService();
export default qrService;
