import { Router } from "express";
import { bidController } from "./bid.controller";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware";

const router = Router();

router
  .use(authenticateUser)
  .post("/:rfpId", requireRole(["SUPPLIER"]), bidController.create)
  .get("/", requireRole(["BUYER", "SUPPLIER", "ADMIN"]), bidController.getBids)
  .get("/:id", bidController.getBidById)
  .patch(":id/award", requireRole(["BUYER"]), bidController.awardBid);

export default router;
