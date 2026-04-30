import { Router } from "express";
import { rfpsController } from "./rfps.controller.js";
import { authenticateUser, requireRole } from "../../shared/middleware/authMiddleware.js";
import { requireSubscription } from "../../shared/middleware/subscriptionMiddleware.js";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/", authenticateUser, requireRole(["BUYER"]), requireSubscription, upload.single("documents"), rfpsController.create);
router.get("/", authenticateUser, rfpsController.list);
router.get("/my-rfps", authenticateUser, requireRole(["BUYER"]), rfpsController.listMyRfps);
router.get("/:id", authenticateUser, rfpsController.listById);
router.patch("/:rfpId/cancel", authenticateUser, requireRole(["BUYER"]), rfpsController.cancelRfp);
router.delete("/:rfpId", authenticateUser, requireRole(["BUYER"]), rfpsController.delete);

export default router;
