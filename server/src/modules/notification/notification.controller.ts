import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { prisma } from "../../config/prisma.js";
import handleError from "../../shared/utils/error.js";

export const notificationController = {
  getMyNotification: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ status: false, message: "Unauthorized" });

    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        status: true,
        data: notifications,
      });
    } catch (err) {
      console.error("[GET_NOTIFICATION]", err);
      return handleError("GET /notifications", err, res);
    }
  },

  updateIsRead: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { notificationId } = req.params as { notificationId: string };

    if (!userId)
      return res.status(401).json({ status: false, message: "Unauthorized" });

    try {
      const updateResult = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: { isRead: true },
      });

      if (updateResult.count === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Updated Successfully",
      });
    } catch (err) {
      console.error("[NOTIFICATION_UPDATE_IS_READ]", err);
      return handleError("PATCH /notifications", err, res);
    }
  },

  deleteNotifications: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ status: false, message: "Unauthorized" });

    try {
      await prisma.notification.deleteMany({
        where: { userId },
      });

      return res.sendStatus(204);
    } catch (err) {
      console.error("[DELETE_NOTIFICATION]", err);
      return handleError("DELETE /notifications", err, res);
    }
  },
};
