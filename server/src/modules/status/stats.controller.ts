import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { prisma } from "../../config/prisma.js";
import handleError from "../../shared/utils/error.js"; // Assuming you have this helper

export const statController = {
  getStats: async (req: AuthenticatedRequest, res: Response) => {
    // Basic safety check
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id, role } = req.user;

    try {
      // 1. BUYER STATS
      if (role === "BUYER") {
        const openRfps = await prisma.rfp.count({
          where: { buyerId: id, status: "OPEN" },
        });
        const totalBids = await prisma.bid.count({
          where: { rfp: { buyerId: id } },
        });
        return res.status(200).json({
          success: true,
          data: { openRfps, totalBids },
        });
      }

      // 2. SUPPLIER STATS
      if (role === "SUPPLIER") {
        const activeBids = await prisma.bid.count({
          where: { supplierId: id, rfp: { status: "OPEN" } },
        });
        const newRfps = await prisma.rfp.count({
          where: {
            status: "OPEN",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        return res.status(200).json({
          success: true,
          data: { activeBids, newRfps },
        });
      }

      // 3. ADMIN / SUPERADMIN STATS
      if (role === "ADMIN" || role === "SUPERADMIN") {
        const [pendingVerifications, activeRfps, totalUsers] =
          await prisma.$transaction([
            // Count suppliers waiting for approval
            prisma.supplier.count({
              where: { status: "PENDING" },
            }),
            // Count all open RFPs in the system
            prisma.rfp.count({
              where: { status: "OPEN" },
            }),
            // Count all registered users
            prisma.user.count(),
          ]);

        return res.status(200).json({
          success: true,
          data: {
            pendingVerifications,
            activeRfps,
            totalUsers,
          },
        });
      }

      // If role doesn't match any of the above
      return res
        .status(403)
        .json({ success: false, message: "Role stats not defined" });
    } catch (err) {
      console.error("[GET_STATS_ERROR]", err);
      handleError("GET /stats", err, res);
    }
  },
};
