import { Router } from "express";
import { authenticateUser } from "../../shared/middleware/authMiddleware";
import { chatController } from "./chat.controller";

const router = Router();

router
  .use(authenticateUser)
  .get("/", chatController.getUserConversations)
  .post("/initialize", chatController.getOrCreateConversation)
  .get("/:conversationId/messages", chatController.getMessages)
  .post("/message", chatController.sendMessage);

export default router;
