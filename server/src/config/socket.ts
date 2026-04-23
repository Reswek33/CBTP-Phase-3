import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { prisma } from "./prisma.js";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.VPS_URL
          : "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket: Socket) => {
    console.log(`⚡ Connection: ${socket.id}`);
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      // 1. Join Personal Room (Required for sendNotification helper)
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);

      // 2. Identify and Join Admin Room
      prisma.user
        .findUnique({
          where: { id: userId },
          select: { role: true },
        })
        .then((user) => {
          if (user) {
            socket.join(`role:${user.role}`);
            console.log(`User ${userId} joined role room: role:${user.role}`);
          }
        });
      socket.emit("connected", { userId, timestamp: new Date().toISOString() });
    }

    // --- Dynamic Room Handlers ---
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`👤 User joined chat room: ${conversationId}`);
    });

    socket.on("join_rfp", (rfpId: string) => {
      socket.join(rfpId);
      console.log(`User joined rfp room: ${rfpId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
