import { prisma } from "../../config/prisma.js";
import { getIO } from "../../config/socket.js";

// In your notification service
export const sendNotification = async (data: {
  userId: string;
  type: string;
  content: string;
  link?: string;
  room?: string;
  syncProfile?: boolean; // New flag
}) => {
  try {
    const io = getIO();

    // 1. Save to Database (skip for profile sync if not needed)
    let notification = null;
    if (!data.syncProfile) {
      notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          content: data.content,
          link: data.link ?? null,
          type: data.type,
        },
      });
    }

    // 2. Emit via Socket
    const room = data.room || data.userId;
    io.to(room).emit("new_notification", notification || data);

    // 3. If syncProfile is true, also emit profile_sync
    if (data.syncProfile) {
      io.to(room).emit("profile_sync", {
        status: "UPDATED",
        message: data.content,
        timestamp: new Date().toISOString(),
      });
    }

    return notification;
  } catch (error) {
    console.error("NOTIFICATION_SERVICE_ERROR", error);
  }
};
