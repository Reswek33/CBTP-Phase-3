import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { prisma } from "../../config/prisma.js";
import { logActivity } from "../../shared/utils/logger.js";
import handleError from "../../shared/utils/error.js";
import { getIO } from "../../config/socket.js";
import { sendNotification } from "../../shared/utils/notification.js";
import bcrypt from "bcryptjs";

export const adminController = {
  getPendingSuppliers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pending = await prisma.supplier.findMany({
        where: { status: "PENDING" },
        include: { user: true, documents: true },
      });
      res.status(200).json({ success: true, data: pending });
    } catch (err) {
      console.error("[ADMIN_VERIFY_SUPPLIER]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  verifySupplier: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, rejectedReason } = req.body;
    const adminId = req.user?.id!;
    const io = getIO();

    try {
      const updatedSupplier = await prisma.$transaction(async (tx) => {
        const supplier = await tx.supplier.update({
          where: { id: id },
          data: {
            status: status,
            rejectedReason: status === "REJECTED" ? rejectedReason : null,
            verifiedAt: status === "VERIFIED" ? new Date() : null,
          },
          include: { user: true },
        });

        await tx.supplierDocument.updateMany({
          where: { supplierId: id, verifiedAt: null },
          data: { verifiedBy: adminId, verifiedAt: new Date() },
        });
        return supplier;
      });

      const isVerified = status === "VERIFIED";

      await sendNotification({
        userId: id,
        type: isVerified ? "ACCOUNT_VERIFIED" : "ACCOUNT_REJECTED",
        content: isVerified
          ? "Congratulations! Your supplier profile has been verified. You can now bid on RFPs."
          : `Your verification was rejected. Reason: ${rejectedReason}`,
        room: updatedSupplier.user.id,
        syncProfile: true,
      });

      // Emit specific event for UI state refresh
      io.to(id).emit("profile_sync", {
        status: updatedSupplier.status,
        message: isVerified
          ? "Your account has been verified successfully"
          : "Your verification was rejected",
        timestamp: new Date().toISOString(),
      });

      io.to(updatedSupplier.user.id).emit("verification_status_changed", {
        status: updatedSupplier.status,
        isVerified: isVerified,
      });

      await logActivity(
        `Supplier verification ${status}: ${id}`,
        "INFO",
        adminId,
        "AdminController.verifySupplier",
        { status, rejectedReason },
        true,
      );

      res.status(200).json({ success: true, data: updatedSupplier });
    } catch (err) {
      console.error("[ADMIN_VERIFY_SUPPLIER]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  getAllUsers: async (req: AuthenticatedRequest, res: Response) => {
    const requesterRole = req.user?.role;
    const userId = req.user?.id!;
    try {
      let allowedRoles: string[] = ["BUYER", "SUPPLIER"];
      if (requesterRole === "SUPERADMIN") {
        allowedRoles.push("ADMIN");
      }
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: allowedRoles as any,
          },
          NOT: {
            id: userId,
          },
        },
        include: {
          supplier: { include: { documents: true } },
          buyer: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ success: true, users });
    } catch (err) {
      console.error("[ADMIN_GET_ALL_USERS]", err);
      handleError("GET /admin/users", err, res);
    }
  },

  getUserDetails: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          supplier: {
            include: {
              documents: true,
              bids: {
                include: { rfp: { select: { title: true, status: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
          buyer: {
            include: {
              rfps: {
                include: { _count: { select: { bids: true } } },
                orderBy: { createdAt: "desc" },
              },
              documents: true,
            },
          },
          activityLogs: { take: 10, orderBy: { createdAt: "desc" } },
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });
      const { passwordHash, ...userData } = user;
      return res.json({ success: true, user: userData });
    } catch (error) {
      console.log("ADMIN_CONTROLLER_USER_DETAIL", error);
      handleError("GET /admin/user-details", error, res);
    }
  },
  getActivityLogs: async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.user?.role;

    try {
      // Check admin access
      if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized - Admin access required",
        });
      }

      // Parse query parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;
      const { userId, level, logType, startDate, endDate } = req.query;

      // Build filters
      const activityWhere: any = {};
      const systemWhere: any = {};

      if (userId) activityWhere.userId = userId as string;
      if (level) systemWhere.level = level as string;
      if (startDate) {
        const start = new Date(startDate as string);
        activityWhere.createdAt = { ...activityWhere.createdAt, gte: start };
        systemWhere.createdAt = { ...systemWhere.createdAt, gte: start };
      }
      if (endDate) {
        const end = new Date(endDate as string);
        activityWhere.createdAt = { ...activityWhere.createdAt, lte: end };
        systemWhere.createdAt = { ...systemWhere.createdAt, lte: end };
      }

      // Determine which logs to fetch
      const fetchActivity = !logType || logType === "activity";
      const fetchSystem = !logType || logType === "system";

      // Fetch logs with pagination
      const [activityResult, systemResult, totalActivity, totalSystem] =
        await Promise.all([
          fetchActivity
            ? prisma.activityLog.findMany({
                where: activityWhere,
                skip,
                take: limit,
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                      email: true,
                      role: true,
                      isActive: true,
                      createdAt: true,
                      updatedAt: true,
                      // ✅ Exclude passwordHash!
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),

          fetchSystem
            ? prisma.systemLog.findMany({
                where: systemWhere,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
              })
            : Promise.resolve([]),

          fetchActivity
            ? prisma.activityLog.count({ where: activityWhere })
            : Promise.resolve(0),
          fetchSystem
            ? prisma.systemLog.count({ where: systemWhere })
            : Promise.resolve(0),
        ]);

      // Prepare response
      const response: any = {
        success: true,
        message: "System logs and Activity logs retrieved successfully",
        pagination: {
          page,
          limit,
          total:
            (fetchActivity ? totalActivity : 0) +
            (fetchSystem ? totalSystem : 0),
          totalPages: Math.ceil(
            ((fetchActivity ? totalActivity : 0) +
              (fetchSystem ? totalSystem : 0)) /
              limit,
          ),
        },
      };

      if (fetchActivity) {
        response.activityLogs = activityResult;
        response.activityCount = totalActivity;
      }

      if (fetchSystem) {
        response.systemLogs = systemResult;
        response.systemCount = totalSystem;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error("[ADMIN_CONTROLLER_GET_ACTIVITY_LOGS]", error);
      handleError("GET /admin/logs", error, res);
    }
  },

  toggleUserStatus: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const isActive: boolean = req.body.isActive;
    const io = getIO();

    try {
      await prisma.user.update({
        where: { id },
        data: { isActive },
      });

      if (!isActive) {
        await sendNotification({
          userId: id,
          type: "ACCOUNT_DEACTIVATED",
          content:
            "Your account has been deactivated by an administrator. Please contact support.",
          room: id,
        });

        io.to(id).emit("force_logout", { message: "Account deactivated" });
      }

      await logActivity(
        `User ${id} ${isActive ? "activated" : "deactivated"}`,
        "WARN",
        req.user?.id,
        "Admin.toggleStatus",
      );

      res.status(200).json({ success: true, message: "User status updated" });
    } catch (err) {
      console.error("[ADMIN_TOGGLE_USER_STATUS]", err);
      handleError("PATCH /admin/users/:id/status", err, res);
    }
  },

  deleteUserPermanently: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    try {
      await prisma.user.delete({ where: { id } });
      await logActivity(
        `User ${id} permanently deleted`,
        "CRITICAL",
        req.user?.id,
        "Admin.deleteUserPermanently",
      );
      res
        .status(200)
        .json({ success: true, message: "User wiped from system" });
    } catch (err) {
      console.error("[ADMIN_DELETE_USER_PERMANENTLY]", err);
      handleError("DELETE /admin/users/:id", err, res);
    }
  },
  getAllConversationsForAdmin: async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    // Ensure only admins reach here
    if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    try {
      const conversations = await prisma.conversation.findMany({
        include: {
          buyer: { select: { companyName: true } },
          supplier: { select: { businessName: true } },
          rfp: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      handleError("ADMIN_GET_CHATS", error, res);
    }
  },

  verifyBuyer: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, rejectedReason } = req.body;
    const adminId = req.user?.id!;
    const io = getIO();
    try {
      const updateBuyer = await prisma.$transaction(async (tx) => {
        const buyer = await tx.buyer.update({
          where: { id: id },
          data: {
            status: status,
            rejectedReason: status === "REJECTED" ? rejectedReason : null,
            verifiedAt: status === "VERIFIED" ? new Date() : null,
          },
          include: { user: true },
        });

        await tx.buyerDocument.updateMany({
          where: { buyerId: id, verifiedAt: null },
          data: { verifiedBy: adminId, verifiedAt: new Date() },
        });

        return buyer;
      });

      const isVerified = status === "VERIFIED";
      await sendNotification({
        userId: id,
        type: isVerified ? "ACCOUNT_VERIFIED" : "ACCOUNT_REJECTED",
        content: isVerified
          ? "Congratulations! Your Buyer profile has been verified. You can now bid on RFPs."
          : `Your verification was rejected. Reason: ${rejectedReason}`,
        room: updateBuyer.user.id,
        syncProfile: true,
      });

      io.to(id).emit("profile_sync", {
        status: updateBuyer.status,
        message: isVerified
          ? "Your account has been verified successfully"
          : "Your verification was rejected",
        timestamp: new Date().toISOString(),
      });

      io.to(updateBuyer.user.id).emit("verification_status_changed", {
        status: updateBuyer.status,
        isVerified: isVerified,
      });

      await logActivity(
        `Buyer verification ${status}: ${id}`,
        "INFO",
        adminId,
        "AdminController.verifyBuyer",
        { status, rejectedReason },
        true,
      );

      res.status(200).json({ success: true, data: updateBuyer });
    } catch (err) {
      console.error("[VERIFY_BUYER_ADMIN]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  getAdminDashboardStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [
        userCount,
        supplierCount,
        buyerCount,
        activeSubCount,
        totalRevenue,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.supplier.count(),
        prisma.buyer.count(),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.paymentTransaction.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amount: true },
        }),
      ]);

      const recentTransactions = await prisma.paymentTransaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          plan: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalUsers: userCount,
            totalSuppliers: supplierCount,
            totalBuyers: buyerCount,
            activeSubscriptions: activeSubCount,
            totalRevenue: totalRevenue._sum.amount || 0,
          },
          recentTransactions,
        },
      });
    } catch (err) {
      handleError("GET /admin/dashboard-stats", err, res);
    }
  },

  getAllSubscriptions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscriptions = await prisma.subscription.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              username: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ success: true, data: subscriptions });
    } catch (err) {
      handleError("GET /admin/subscriptions", err, res);
    }
  },

  getAllTransactions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transactions = await prisma.paymentTransaction.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              username: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ success: true, data: transactions });
    } catch (err) {
      handleError("GET /admin/transactions", err, res);
    }
  },

  createAdmin: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName, username, email, password, adminRole } =
        req.body;

      // 1. Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email or Username already in use",
        });
      }

      // 2. Hash Password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Create Admin
      const newAdmin = await prisma.user.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          passwordHash: hashedPassword,
          role: "ADMIN",
          adminRole: adminRole || "SUPPORT_ADMIN",
          isActive: true,
        },
      });

      await logActivity(
        `New Admin created: ${newAdmin.username}`,
        "INFO",
        req.user?.id,
        "AdminController.createAdmin",
      );

      res.status(201).json({ success: true, data: newAdmin });
    } catch (err) {
      console.error("[ADMIN_CREATE_ADMIN]", err);
      handleError("POST /admin/create-admin", err, res);
    }
  },

  getAuditStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const logs = await prisma.activityLog.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          createdAt: true,
          action: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Define a clear interface for the daily stats
      interface DayStat {
        date: string;
        total: number;
        actions: Record<string, number>;
      }

      const statsMap = logs.reduce<Record<string, DayStat>>((acc, log) => {
        const date = log.createdAt.toISOString().split("T")[0] as string;

        // Initialize the date entry if it doesn't exist
        if (!acc[date]) {
          acc[date] = {
            date,
            total: 0,
            actions: {},
          };
        }

        acc[date].total += 1;

        // Group by general action type (e.g., "USER:LOGIN" -> "USER")
        const actionBase = log.action.split(":")[0] as string;
        acc[date].actions[actionBase] =
          (acc[date].actions[actionBase] || 0) + 1;

        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: Object.values(statsMap),
      });
    } catch (err) {
      // Ensure your handleError doesn't crash if res is undefined
      handleError("GET /admin/audit-stats", err, res);
    }
  },
};
