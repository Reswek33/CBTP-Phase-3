import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";

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

  io.on("connection", (socket: Socket) => {
    console.log(`⚡ Connection: ${socket.id}`);
    const userId = socket.handshake.query.userId;

    if (userId) {
      socket.join(userId as string);
      console.log(`User ${userId} joined their personal room`);
    }

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`👤 User joined chat room: ${conversationId}`);
    });
    socket.on("join_rfp", (rfpId: string) => {
      socket.join(rfpId);
      console.log(`User joined room: ${rfpId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
    });
    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });

    return io;
  });
};
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
