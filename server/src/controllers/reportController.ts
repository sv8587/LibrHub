import { Request, Response } from 'express';
import { reportService } from '../services/reportService';

export class ReportController {
  async exportCsv(req: Request, res: Response) {
    try {
      const csvData = await reportService.generateTransactionsCsv();
      const filename = `librhub-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvData);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to generate CSV export',
      });
    }
  }

  async exportExcel(req: Request, res: Response) {
    try {
      const buffer = await reportService.generateTransactionsExcel();
      const filename = `librhub-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to generate Excel export',
      });
    }
  }
}

export const reportController = new ReportController();
export default reportController;
