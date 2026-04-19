import { Router } from "express";
import { authenticateUser } from "../../shared/middleware/authMiddleware.js";
import { chatController } from "./chat.controller.js";

const router = Router();

router
  .use(authenticateUser)
  .get("/", chatController.getUserConversations)
  .post("/initialize", chatController.getOrCreateConversation)
  .get("/:conversationId/messages", chatController.getMessages)
  .post("/message", chatController.sendMessage);

export default router;
