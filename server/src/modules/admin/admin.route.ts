import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware";
import { adminController } from "./admin.controller";

const router = Router();

router
  .use(authenticateUser, requireRole(["ADMIN", "SUPERADMIN"]))
  .get("/users", adminController.getAllUsers)
  .get("/users/:id", adminController.getUserDetails)
  .get("/logs", adminController.getActivityLogs)
  .get("/suppliers/pending", adminController.getPendingSuppliers)
  .patch("/suppliers/:id/verify", adminController.verifySupplier)
  .patch("/users/:id/status", adminController.toggleUserStatus);

router
  .use(authenticateUser, requireRole(["SUPERADMIN"]))
  .delete("/users/:id", adminController.deleteUserPermanently);
export default router;
