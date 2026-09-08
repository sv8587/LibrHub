import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { getDatabaseStatus } from '../config/db';

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      const data = await dashboardService.getDashboardStats();
      const dbStatus = getDatabaseStatus();

      res.json({
        success: true,
        data,
        database: dbStatus,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch dashboard statistics',
      });
    }
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
