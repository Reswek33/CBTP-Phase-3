import { Router } from "express";
import { disputeController } from "./dispute.controller.js";
import {
  authenticateUser,
  requireRole,
  requireAdminRole,
} from "../../shared/middleware/authMiddleware.js";

const router = Router();

// Suppliers and Buyers can file disputes
router.post(
  "/",
  authenticateUser,
  disputeController.fileDispute
);

// Admin only routes
router.get(
  "/",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  disputeController.getDisputes
);

router.get(
  "/:id",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  disputeController.getDisputeById
);

router.patch(
  "/:id/resolve",
  authenticateUser,
  requireRole(["ADMIN", "SUPERADMIN"]),
  requireAdminRole(["SUPERADMIN", "SUPPORT_ADMIN"]), // Only support or super admins can resolve
  disputeController.resolveDispute
);

export default router;
