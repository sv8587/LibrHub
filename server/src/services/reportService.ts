import * as XLSX from 'xlsx';
import { transactionService } from './transactionService';

export class ReportService {
  /**
   * Generates a CSV string containing all transaction history
   * Required columns: Book Title, Author, Book ID, Issued To, User ID, Issue Timestamp, Return Timestamp, Current Status
   */
  async generateTransactionsCsv(): Promise<string> {
    const { transactions } = await transactionService.getAllTransactions({
      limit: 10000,
    });

    const headers = [
      'Book Title',
      'Author',
      'Book ID',
      'Issued To',
      'User ID',
      'Issue Timestamp',
      'Return Timestamp',
      'Current Status',
    ];

    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = transactions.map((t) => {
      const currentStatus = t.isOverdue ? 'OVERDUE' : t.status;
      const issueDateStr = t.issueTimestamp ? new Date(t.issueTimestamp).toISOString() : '';
      const returnDateStr = t.returnTimestamp ? new Date(t.returnTimestamp).toISOString() : 'N/A';

      return [
        escapeCsvField(t.bookTitle || 'Unknown'),
        escapeCsvField(t.bookAuthor || 'Unknown'),
        escapeCsvField(t.bookId),
        escapeCsvField(t.borrowerName),
        escapeCsvField(t.borrowerId),
        escapeCsvField(issueDateStr),
        escapeCsvField(returnDateStr),
        escapeCsvField(currentStatus),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n') + '\r\n';
  }

  /**
   * Generates an Excel workbook buffer containing all transaction history
   */
  async generateTransactionsExcel(): Promise<Buffer> {
    const { transactions } = await transactionService.getAllTransactions({
      limit: 10000,
    });

    const data = transactions.map((t) => ({
      'Book Title': t.bookTitle || 'Unknown',
      Author: t.bookAuthor || 'Unknown',
      'Book ID': t.bookId,
      Category: t.bookCategory || 'General',
      'Issued To': t.borrowerName,
      'User ID': t.borrowerId,
      'Issue Timestamp': t.issueTimestamp ? new Date(t.issueTimestamp).toLocaleString() : '',
      'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      'Return Timestamp': t.returnTimestamp
        ? new Date(t.returnTimestamp).toLocaleString()
        : 'Still Borrowed',
      'Current Status': t.isOverdue ? 'OVERDUE' : t.status,
      'Days Overdue': t.daysOverdue || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set auto column widths
    const columnWidths = [
      { wch: 35 }, // Book Title
      { wch: 25 }, // Author
      { wch: 12 }, // Book ID
      { wch: 18 }, // Category
      { wch: 22 }, // Issued To
      { wch: 15 }, // User ID
      { wch: 22 }, // Issue Timestamp
      { wch: 15 }, // Due Date
      { wch: 22 }, // Return Timestamp
      { wch: 15 }, // Current Status
      { wch: 14 }, // Days Overdue
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction History');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const reportService = new ReportService();
export default reportService;
