import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { analyticsController } from "./analytics.controller.js";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";

const router = Router();

// Dashboard & Stats
router.get(
  "/dashboard-stats",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getAdminDashboardStats,
);
router.get(
  "/subscriptions",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getAllSubscriptions,
);
router.get(
  "/transactions",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getAllTransactions,
);

// Analytics
router.get(
  "/analytics/overview",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  analyticsController.getOverviewStats,
);
router.get(
  "/analytics/health",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  analyticsController.getSystemHealth,
);

// User Management
router.get(
  "/users",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getAllUsers,
);
router.get(
  "/users/:id",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getUserDetails,
);
router.patch(
  "/users/:id/status",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.toggleUserStatus,
);
router.delete(
  "/users/:id",
  authenticateUser,
  requireRole(["SUPERADMIN"]),
  adminController.deleteUserPermanently,
);

// Verification
router.get(
  "/pending-suppliers",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getPendingSuppliers,
);
router.patch(
  "/suppliers/:id/verify",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.verifySupplier,
);
router.patch(
  "/buyer/:id/verify",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.verifyBuyer,
);

// Audit & Logs
router.get(
  "/logs",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getActivityLogs,
);
router.get(
  "/audit-stats",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getAuditStats,
);

// Communication
router.get(
  "/conversations",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  adminController.getAllConversationsForAdmin,
);

// Superadmin Actions
router.post(
  "/create-admin",
  authenticateUser,
  requireRole(["SUPERADMIN"]),
  adminController.createAdmin,
);

export default router;
