import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";
import { buyerController } from "./buyer.controller.js";

const router = Router();

router
  .use(authenticateUser, requireRole(["BUYER"]))
  .patch("/profile", buyerController.updateProfile)
  .post("/", buyerController.deleteAccount);

export default router;
