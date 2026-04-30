import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authMiddleware.js";
import { prisma } from "../../config/prisma.js";

export const requireSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  // Admins and Superadmins bypass subscription checks
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return next();
  }

  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: "ACTIVE",
        endDate: {
          gt: new Date()
        }
      }
    });

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to perform this action.",
        requiresSubscription: true
      });
    }

    next();
  } catch (err) {
    console.error("[SUBSCRIPTION_GUARD_ERROR]", err);
    res.status(500).json({ success: false, message: "Subscription check failed" });
  }
};
