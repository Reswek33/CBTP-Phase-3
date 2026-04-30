import type { Response } from "express";
import { prisma } from "../../config/prisma.js";
import handleError from "../../shared/utils/error.js";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";

export const analyticsController = {
  getOverviewStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [
        rfpDistribution,
        userGrowth,
        bidStatusStats,
        subscriptionTrends,
        recentActivity
      ] = await Promise.all([
        // RFP Distribution by Category
        prisma.rfp.groupBy({
          by: ['category'],
          _count: { id: true },
        }),

        // User Growth (last 6 months)
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(id) as count
          FROM users
          WHERE created_at >= NOW() - INTERVAL '6 months'
          GROUP BY month
          ORDER BY month ASC
        `,

        // Bid Status Stats
        prisma.bid.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        // Subscription Trends (Payment success per month)
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            SUM(amount) as revenue
          FROM payment_transactions
          WHERE status = 'SUCCESS' AND created_at >= NOW() - INTERVAL '6 months'
          GROUP BY month
          ORDER BY month ASC
        `,

        // Recent System Activity
        prisma.activityLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, role: true } } }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          rfpDistribution,
          userGrowth,
          bidStatusStats,
          subscriptionTrends,
          recentActivity
        }
      });
    } catch (err) {
      handleError("GET /admin/analytics/overview", err, res);
    }
  },

  getSystemHealth: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [errorLogs, criticalLogs, pendingApprovals] = await Promise.all([
        prisma.systemLog.count({ where: { level: 'ERROR' } }),
        prisma.systemLog.count({ where: { level: 'CRITICAL' } }),
        prisma.rfp.count({ where: { status: 'PENDING_APPROVAL' as any } })
      ]);

      res.status(200).json({
        success: true,
        data: {
          errorLogs,
          criticalLogs,
          pendingApprovals,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      });
    } catch (err) {
      handleError("GET /admin/analytics/health", err, res);
    }
  }
};
