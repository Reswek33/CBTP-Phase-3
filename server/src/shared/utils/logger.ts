import { LogLevel, User } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";

export const logActivity = async (
  message: string,
  level: LogLevel = "INFO",
  userId?: string,
  context?: string,
  payload?: any,
) => {
  try {
    // Sanitize payload to remove sensitive keys
    const sanitizedPayload = payload ? { ...payload } : null;
    if (sanitizedPayload) {
      ["password", "token", "secret"].forEach(
        (key) => delete sanitizedPayload[key],
      );
    }

    await prisma.systemLog.create({
      data: {
        message,
        level,
        userId,
        context,
        payload: sanitizedPayload,
      },
    });
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: message,
        },
      });
    }
  } catch (err) {
    console.error("Logger Failed:", err);
  }
};
