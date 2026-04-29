import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import { SubscriptionService } from "./subscription.service.js";

const subscriptionService = new SubscriptionService();

export const subscriptionController = {
  getPlans: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const plans = await subscriptionService.getAllPlans();
      return res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (err) {
      handleError("GET /subscription/plans", err, res);
    }
  },

  initializePayment: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { planId } = req.body;
      const userId = req.user?.id!;
      
      const result = await subscriptionService.initializePayment(userId, planId);
      
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      handleError("POST /subscription/initialize", err, res);
    }
  },

  verifyPayment: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { txRef } = req.body;
      const result = await subscriptionService.verifyPayment(txRef);
      
      return res.status(200).json(result);
    } catch (err) {
      handleError("POST /subscription/verify", err, res);
    }
  },

  getStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      return res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (err) {
      handleError("GET /subscription/status", err, res);
    }
  },

  webhook: async (req: any, res: Response) => {
    // Chapa sends webhook as POST
    // We should verify signature if Chapa provides it
    try {
      const payload = req.body;
      console.log("[CHAPA_WEBHOOK]", payload);
      
      if (payload.event === 'charge.success') {
        const txRef = payload.tx_ref;
        // Verify again to be safe
        await subscriptionService.verifyPayment(txRef);
      }
      
      return res.status(200).send('OK');
    } catch (err) {
      console.error("[CHAPA_WEBHOOK_ERROR]", err);
      return res.status(500).send('Error');
    }
  }
};
