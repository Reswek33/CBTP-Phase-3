import { Response, Request } from "express";
import { prisma } from "../../config/prisma";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { logActivity } from "../../shared/utils/logger";
import handleError from "../../shared/utils/error";
import { sendNotification } from "../../shared/utils/notification";
import { getIO } from "../../config/socket";

export const adminController = {
  getPendingSuppliers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pending = await prisma.supplier.findMany({
        where: { status: "PENDING" },
        include: { user: true, documents: true },
      });
      res.status(200).json({ success: true, data: pending });
    } catch (err) {
      await logActivity(
        `Failed to fetch pending suppliers: ${err instanceof Error ? err.message : "Unknown error"}`,
        "ERROR",
        req.user?.id,
        "Admin.getPendingSuppliers",
      );
      console.error("[ADMIN_VERIFY_SUPPLIER]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  verifySupplier: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, rejectedReason } = req.body;
    const adminId = req.user?.id;
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
        room: id,
      });

      // Emit specific event for UI state refresh
      io.to(id).emit("profile_sync", {
        status: updatedSupplier.status,
        message: "Your account haas been updated",
      });

      if (status === "REJECTED") {
        io.to(id).emit("profile_sync", {
          status: updatedSupplier.status,
          message: "Document is rejected. Please update the document.",
        });
      }

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
      await logActivity(
        `Failed to verify supplier ${id}: ${err instanceof Error ? err.message : "Unknown error"}`,
        "ERROR",
        req.user?.id,
        "Admin.verifySupplier",
      );
      console.error("[ADMIN_VERIFY_SUPPLIER]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  getAllUsers: async (req: AuthenticatedRequest, res: Response) => {
    const requesterRole = req.user?.role;
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
            id: req.user?.id,
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
      await logActivity(
        `Failed to fetch all users: ${err instanceof Error ? err.message : "Unknown error"}`,
        "ERROR",
        req.user?.id,
        "Admin.getAllUsers",
      );
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
            },
          },
          activityLogs: { take: 10, orderBy: { createdAt: "desc" } },
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, user });
    } catch (error) {
      await logActivity(
        `Failed to fetch user details for ${id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        "ERROR",
        req.user?.id,
        "Admin.getUserDetails",
      );
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
      await logActivity(
        `Failed to fetch activity logs: ${error instanceof Error ? error.message : "Unknown error"}`,
        "ERROR",
        req.user?.id,
        "Admin.getActivityLogs",
      );
      console.error("[ADMIN_CONTROLLER_GET_ACTIVITY_LOGS]", error);
      handleError("GET /admin/logs", error, res);
    }
  },

  toggleUserStatus: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const isActive: boolean = req.body.isActive;
    const io = getIO();

    try {
      const user = await prisma.user.update({
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
      await logActivity(
        `Failed to ${isActive ? "activate" : "deactivate"} user ${id}`,
        "ERROR",
        req.user?.id,
        "Admin.toggleStatus",
      );
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
      await logActivity(
        `Failed to permanently delete user ${id}`,
        "ERROR",
        req.user?.id,
        "Admin.deleteUserPermanently",
      );
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
          rfp: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      handleError("ADMIN_GET_CHATS", error, res);
    }
  },
};
