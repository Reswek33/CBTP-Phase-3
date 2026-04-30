import { Router } from "express";
import { bidController } from "./bid.controller.js";
import { authenticateUser, requireRole } from "../../shared/middleware/authMiddleware.js";
import { requireSubscription } from "../../shared/middleware/subscriptionMiddleware.js";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/:rfpId", authenticateUser, requireRole(["SUPPLIER"]), requireSubscription, upload.single("proposalFile"), bidController.create);
router.get("/", authenticateUser, bidController.getBids);
router.get("/:id", authenticateUser, bidController.getBidById);
router.post("/award/:bidId", authenticateUser, requireRole(["BUYER"]), bidController.awardBid);
router.post("/:bidId/submit-amount", authenticateUser, requireRole(["SUPPLIER"]), bidController.submitFinancialBid);
router.post("/apply/:rfpId", authenticateUser, requireRole(["SUPPLIER"]), requireSubscription, upload.single("proposalFile"), bidController.applyToBid);
router.post("/:rfpId/reapply", authenticateUser, requireRole(["SUPPLIER"]), upload.single("proposalFile"), bidController.reapplyToBid);
router.patch("/:bidId/status", authenticateUser, requireRole(["BUYER"]), bidController.updateApplicationStatus);
router.patch("/:bidId/technical", authenticateUser, requireRole(["BUYER"]), bidController.evaluateTechnicalBid);
router.patch("/:bidId/withdraw", authenticateUser, requireRole(["SUPPLIER"]), bidController.withdrawBid);

export default router;
