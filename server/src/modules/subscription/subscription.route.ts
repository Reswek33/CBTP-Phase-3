import { Router } from "express";
import { authenticateUser } from "../../shared/middleware/authMiddleware.js";
import { subscriptionController } from "./subscription.controller.js";

const router = Router();

// Public webhook (no auth)
router.post("/webhook", subscriptionController.webhook);

// Protected routes
router.use(authenticateUser);
router.get("/plans", subscriptionController.getPlans);
router.get("/status", subscriptionController.getStatus);
router.post("/initialize", subscriptionController.initializePayment);
router.post("/verify", subscriptionController.verifyPayment);

export default router;
