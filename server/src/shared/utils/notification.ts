import { prisma } from "../../config/prisma";
import { getIO } from "../../config/socket";

export const sendNotification = async (data: {
  userId: string;
  type: string;
  content: string;
  link?: string;
  room?: string; // e.g., "VERIFIED_SUPPLIERS" or a specific User ID
}) => {
  try {
    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        content: data.content,
        link: data.link,
        type: data.type,
      },
    });

    // 2. Emit via Socket
    const io = getIO();
    if (data.room) {
      io.to(data.room).emit("new_notification", notification);
    } else {
      io.emit("new_notification", notification); // Global broadcast
    }

    return notification;
  } catch (error) {
    console.error("NOTIFICATION_SERVICE_ERROR", error);
  }
};
