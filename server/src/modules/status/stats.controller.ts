import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { prisma } from "../../config/prisma.js";
import handleError from "../../shared/utils/error.js";

// Type definitions
interface RFPWithCount {
  id: string;
  title: string;
  deadline: Date;
  status: string;
  budget: number | null;
  _count: {
    bids: number;
  };
}

interface BidWithRelations {
  id: string;
  amount: number | null;
  createdAt: Date;
  status: string;
  rfpId: string;
  supplier: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  rfp: {
    title: string;
  };
}

interface DeadlineItem {
  id: string;
  title: string;
  deadline: Date;
}

interface SystemLogWithUser {
  id: string;
  message: string;
  level: string;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export const statController = {
  getStats: async (req: AuthenticatedRequest, res: Response) => {
    // Basic safety check
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, role } = req.user;

    try {
      // 1. BUYER STATS
      if (role === "BUYER") {
        const openRfpsCount = await prisma.rfp.count({
          where: { buyerId: id, status: "OPEN" },
        });

        const totalBidsReceived = await prisma.bid.count({
          where: { rfp: { buyerId: id } },
        });

        const uniqueSuppliers = await prisma.bid.groupBy({
          by: ["supplierId"],
          where: { rfp: { buyerId: id } },
        });
        const activeSuppliers = uniqueSuppliers.length;

        const avgBidAmountResult = await prisma.bid.aggregate({
          where: { rfp: { buyerId: id } },
          _avg: { amount: true },
        });
        const avgBidAmount = avgBidAmountResult._avg.amount || 0;

        const recentRfps = await prisma.rfp.findMany({
          where: { buyerId: id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            _count: {
              select: { bids: true },
            },
          },
        });

        const recentBids = await prisma.bid.findMany({
          where: { rfp: { buyerId: id } },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            supplier: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            rfp: {
              select: { title: true },
            },
          },
        });

        const upcomingDeadlines = await prisma.rfp.findMany({
          where: {
            buyerId: id,
            status: "OPEN",
            deadline: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            id: true,
            title: true,
            deadline: true,
          },
          orderBy: { deadline: "asc" },
        });

        // Format recent RFPs
        const formattedRecentRfps = (recentRfps as RFPWithCount[]).map(
          (rfp) => ({
            id: rfp.id,
            title: rfp.title,
            deadline: rfp.deadline.toISOString(),
            bidsCount: rfp._count.bids,
            status: rfp.status,
            budget: rfp.budget,
          }),
        );

        // Format recent bids
        const formattedRecentBids = (recentBids as BidWithRelations[]).map(
          (bid) => ({
            id: bid.id,
            supplierName: `${bid.supplier.user.firstName} ${bid.supplier.user.lastName}`,
            amount: bid.amount,
            time: bid.createdAt.toISOString(),
            status: bid.status,
            rfpId: bid.rfpId,
            rfpTitle: bid.rfp.title,
          }),
        );

        // Format upcoming deadlines
        const formattedDeadlines = (upcomingDeadlines as DeadlineItem[]).map(
          (deadline) => ({
            id: deadline.id,
            title: deadline.title,
            date: deadline.deadline.toISOString(),
            daysLeft: Math.ceil(
              (deadline.deadline.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            ),
            type: "rfp" as const,
          }),
        );

        return res.status(200).json({
          success: true,
          data: {
            openRfpsCount,
            totalBidsReceived,
            activeSuppliers,
            avgBidAmount: Math.round(Number(avgBidAmount) / 1000),
            recentRfps: formattedRecentRfps,
            recentBids: formattedRecentBids,
            upcomingDeadlines: formattedDeadlines,
          },
        });
      }

      // 2. SUPPLIER STATS
      if (role === "SUPPLIER") {
        const activeBids = await prisma.bid.count({
          where: {
            supplierId: id,
            rfp: { status: "OPEN" },
            status: { not: "WITHDRAWN" },
          },
        });

        const newRfpsCount = await prisma.rfp.count({
          where: {
            status: "OPEN",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        const wonBidsCount = await prisma.bid.count({
          where: {
            supplierId: id,
            status: "AWARDED",
          },
        });

        const totalBids = await prisma.bid.count({
          where: { supplierId: id },
        });

        const recentRfps = await prisma.rfp.findMany({
          where: { status: "OPEN" },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            _count: {
              select: { bids: true },
            },
            buyer: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        });

        const recommendedRfps = await prisma.rfp.findMany({
          where: {
            status: "OPEN",
          },
          orderBy: { deadline: "asc" },
          take: 4,
          include: {
            _count: {
              select: { bids: true },
            },
          },
        });

        const upcomingDeadlines = await prisma.rfp.findMany({
          where: {
            status: "OPEN",
            deadline: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
          select: {
            id: true,
            title: true,
            deadline: true,
          },
          orderBy: { deadline: "asc" },
          take: 5,
        });

        // Calculate win rate
        const winRate = totalBids > 0 ? (wonBidsCount / totalBids) * 100 : 0;

        // Format recent RFPs
        const formattedRecentRfps = (recentRfps as RFPWithCount[]).map(
          (rfp) => ({
            id: rfp.id,
            title: rfp.title,
            deadline: rfp.deadline.toISOString(),
            bidsCount: rfp._count.bids,
            budget: rfp.budget,
            daysLeft: Math.ceil(
              (rfp.deadline.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          }),
        );

        // Format recommended RFPs
        const formattedRecommendedRfps = (
          recommendedRfps as RFPWithCount[]
        ).map((rfp) => ({
          id: rfp.id,
          title: rfp.title,
          deadline: rfp.deadline.toISOString(),
          bidsCount: rfp._count.bids,
          budget: rfp.budget,
          daysLeft: Math.ceil(
            (rfp.deadline.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        }));

        // Format upcoming deadlines
        const formattedDeadlines = (upcomingDeadlines as DeadlineItem[]).map(
          (deadline) => ({
            id: deadline.id,
            title: deadline.title,
            date: deadline.deadline.toISOString(),
            daysLeft: Math.ceil(
              (deadline.deadline.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            ),
            type: "rfp" as const,
          }),
        );

        return res.status(200).json({
          success: true,
          data: {
            activeBids,
            newRfpsCount,
            wonBidsCount,
            winRate: Math.round(winRate),
            recentRfps: formattedRecentRfps,
            recommendedRfps: formattedRecommendedRfps,
            upcomingDeadlines: formattedDeadlines,
          },
        });
      }

      // 3. ADMIN / SUPERADMIN STATS
      if (role === "ADMIN" || role === "SUPERADMIN") {
        const totalUsers = await prisma.user.count();

        const pendingVerifications = await prisma.supplier.count({
          where: { status: "PENDING" },
        });

        const activeRfps = await prisma.rfp.count({
          where: { status: "OPEN" },
        });

        const totalBids = await prisma.bid.count();

        const recentActivities = await prisma.systemLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        });

        // Top performing suppliers
        const topSupplierResults = await prisma.bid.groupBy({
          by: ["supplierId"],
          where: { status: "AWARDED" },
          _count: { supplierId: true },
          orderBy: { _count: { supplierId: "desc" } },
          take: 5,
        });

        const topPerformers = await Promise.all(
          topSupplierResults.map(async (result) => {
            const supplier = await prisma.supplier.findUnique({
              where: { id: result.supplierId },
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            });

            const totalBidsPlaced = await prisma.bid.count({
              where: { supplierId: result.supplierId },
            });

            const winRate =
              totalBidsPlaced > 0
                ? (result._count.supplierId / totalBidsPlaced) * 100
                : 0;

            return {
              id: result.supplierId,
              name:
                supplier?.businessName ||
                `${supplier?.user.firstName} ${supplier?.user.lastName}` ||
                "Unknown",
              bids: totalBidsPlaced,
              winRate: Math.round(winRate),
            };
          }),
        );

        // Format recent activities
        const formattedActivities = (
          recentActivities as SystemLogWithUser[]
        ).map((log) => ({
          id: log.id,
          action: log.message,
          time: log.createdAt.toISOString(),
          status:
            log.level === "ERROR" || log.level === "CRITICAL"
              ? "warning"
              : log.level === "INFO"
                ? "info"
                : "active",
        }));

        return res.status(200).json({
          success: true,
          data: {
            totalUsers,
            pendingVerifications,
            activeRfps,
            totalBids,
            recentActivities: formattedActivities,
            topPerformers,
          },
        });
      }

      // If role doesn't match any of the above
      return res.status(403).json({
        success: false,
        message: "Role stats not defined for this user type",
      });
    } catch (err) {
      console.error("[DASHBOARD_STATS_ERROR]", err);
      return handleError("GET /dashboard/stats", err, res);
    }
  },

  // Optional: Get recent notifications
  getRecentNotifications: async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      console.error("[NOTIFICATIONS_ERROR]", err);
      return handleError("GET /dashboard/notifications", err, res);
    }
  },

  // Optional: Get system health metrics (for admin)
  getSystemHealth: async (req: AuthenticatedRequest, res: Response) => {
    if (
      !req.user ||
      (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN")
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    try {
      const userCount24h = await prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const rfpCount24h = await prisma.rfp.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const bidCount24h = await prisma.bid.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          newUsersLast24h: userCount24h,
          newRfpsLast24h: rfpCount24h,
          newBidsLast24h: bidCount24h,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("[SYSTEM_HEALTH_ERROR]", err);
      return handleError("GET /dashboard/health", err, res);
    }
  },
};
