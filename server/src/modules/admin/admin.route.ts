import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware";
import { adminController } from "./admin.controller";

const router = Router();

router
  .get(
    "/suppliers/pending",
    authenticateUser,
    requireRole(["ADMIN", "SUPERADMIN"]),
    adminController.getPendingSuppliers,
  )
  .patch(
    "/suppliers/:id/verify",
    authenticateUser,
    requireRole(["ADMIN", "SUPERADMIN"]),
    adminController.verifySupplier,
  );

export default router;
