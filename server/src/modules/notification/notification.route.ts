import { Router } from "express";
import { authenticateUser } from "../../shared/middleware/authMiddleware.js";
import { notificationController } from "./notification.controller.js";

const router = Router();

router
  .use(authenticateUser)
  .get("/", notificationController.getMyNotification)
  .patch("/:notificationId", notificationController.updateIsRead)
  .delete("/", notificationController.deleteNotifications);

export default router;
