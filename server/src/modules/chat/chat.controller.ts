import { Response } from "express";
import { prisma } from "../../config/prisma";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { getIO } from "../../config/socket";
import handleError from "../../shared/utils/error";

export const chatController = {
  // Start or get a conversation between a Buyer and Supplier
  getOrCreateConversation: async (req: AuthenticatedRequest, res: Response) => {
    const { rfpId } = req.body;
    const currentUserId = req.user?.id; // Assuming the buyer starts the chat

    try {
      const rfp = await prisma.rfp.findUnique({
        where: { id: rfpId },
        select: { buyerId: true },
      });

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: "RFP not found",
        });
      }

      let buyerId: string;
      let supplierId: string;

      if (currentUserId === rfp.buyerId) {
        buyerId = currentUserId;
        supplierId = req.body.supplierId;
      } else {
        buyerId = rfp.buyerId;
        supplierId = currentUserId!;
      }

      if (!supplierId) {
        return res.status(400).json({ message: "Supplier ID is required" });
      }

      let conversation = await prisma.conversation.findFirst({
        where: { buyerId, supplierId, rfpId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { buyerId, supplierId, rfpId },
          include: { messages: true },
        });
      }

      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      console.error("[CHAT_CONTROLLER_GET_OR_CREATE_CONVERSATION]", error);
      handleError("POST /chat/initialize", error, res);
    }
  },

  // Send a message
  sendMessage: async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId, content } = req.body;
    const senderId = req.user?.id;

    try {
      // 1. VERIFY PARTICIPATION: Ensure sender is part of this chat
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { buyerId: true, supplierId: true },
      });

      if (
        !conversation ||
        (conversation.buyerId !== senderId &&
          conversation.supplierId !== senderId)
      ) {
        return res
          .status(403)
          .json({ success: false, message: "CANNOT_SEND: NOT_A_PARTICIPANT" });
      }

      // 2. PERSIST
      const message = await prisma.message.create({
        data: { conversationId, senderId: senderId!, content },
        include: {
          sender: { select: { firstName: true, lastName: true, role: true } },
        },
      });

      // 3. REAL-TIME EMIT
      try {
        const io = getIO();
        io.to(conversationId).emit("new_message", message);
      } catch (socketErr) {
        console.warn("[SOCKET_EMIT_FAILED]", socketErr);
        // We don't fail the request because the DB write succeeded
      }

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      handleError("POST /chat/message", error, res);
    }
  },
  // Get all conversations for the logged-in user (Inbox View)
  getUserConversations: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ buyerId: userId }, { supplierId: userId }],
        },
        include: {
          // Include the "other" party's info for the UI
          buyer: {
            select: {
              companyName: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          supplier: {
            select: {
              businessName: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          rfp: {
            select: { title: true, status: true },
          },
          // Get the very last message for the inbox snippet
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: {
          // You could technically add an 'updatedAt' to Conversation model
          // to sort by most recent activity, but for now we use ID or a default
          id: "desc",
        },
      });

      return res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      console.error("[CHAT_CONTROLLER_GET_USER_CONVERSATIONS]", error);
      handleError("GET /chat", error, res);
    }
  },

  // Get message history for a specific conversation
  getMessages: async (req: AuthenticatedRequest, res: Response) => {
    const { conversationId } = req.params as { conversationId: string };
    const userId = req.user?.id;
    const userRole = req.user?.role;

    try {
      // 1. FETCH CONVERSATION WITH ROLES
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { buyerId: true, supplierId: true },
      });

      if (!conversation) {
        return res
          .status(404)
          .json({ success: false, message: "CONVERSATION_NOT_FOUND" });
      }

      // 2. MULTI-LEVEL ACCESS CHECK (Audit-Aware)
      const isParticipant =
        conversation.buyerId === userId || conversation.supplierId === userId;
      const isAdmin = userRole === "ADMIN" || userRole === "SUPERADMIN";

      if (!isParticipant && !isAdmin) {
        return res
          .status(403)
          .json({ success: false, message: "UNAUTHORIZED_ACCESS" });
      }

      // 3. FETCH HISTORY
      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return res.status(200).json({
        success: true,
        data: messages,
        meta: { auditMode: isAdmin && !isParticipant }, // Helpful hint for frontend
      });
    } catch (error) {
      handleError("GET /chat/:conversationId/messages", error, res);
    }
  },
};
