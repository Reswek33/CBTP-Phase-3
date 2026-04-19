import { Router } from "express";
import { bidController } from "./bid.controller.js";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";
import { upload } from "../../config/multer.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Supplier routes
router.route("/:rfpId").post(requireRole(["SUPPLIER"]), bidController.create);

router
  .route("/:bidId/submit-amount")
  .patch(requireRole(["SUPPLIER"]), bidController.submitFinancialBid);

router
  .route("/apply/:rfpId")
  .post(
    requireRole(["SUPPLIER"]),
    upload.single("proposalFile"),
    bidController.applyToBid,
  );

// Buyer/Admin routes
router
  .route("/:bidId/status")
  .patch(
    requireRole(["BUYER", "ADMIN"]),
    bidController.updateApplicationStatus,
  );

router
  .route("/:bidId/award")
  .patch(requireRole(["BUYER"]), bidController.awardBid);

router
  .route("/:bidId/withdraw")
  .patch(requireRole(["SUPPLIER"]), requireRole(["SUPPLIER"]));
// Multi-role routes
router
  .route("/")
  .get(requireRole(["BUYER", "SUPPLIER", "ADMIN"]), bidController.getBids);

router.route("/:id").get(bidController.getBidById);

export default router;
