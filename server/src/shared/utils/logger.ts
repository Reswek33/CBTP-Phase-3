import { LogLevel } from "../../../generated/prisma/index.js";
import { prisma } from "../../config/prisma.js";

/**
 * Optimized Logger
 * @param message - The descriptive log message
 * @param level - INFO, WARN, ERROR, DEBUG
 * @param userId - Optional UUID of the user
 * @param context - Where the log originated (e.g., "AuthService.register")
 * @param payload - Extra JSON data (sanitized automatically)
 * @param isUserAction - If true, records to ActivityLog (visible to users/admins)
 * @param ipAddress - Client IP address
 * @param userAgent - Client User Agent
 */

export const logActivity = async (
  message: string,
  level: LogLevel = "INFO",
  userId?: string,
  context?: string,
  payload?: Record<string, any>,
  isUserAction: boolean = false,
  ipAddress?: string,
  userAgent?: string,
) => {
  try {
    // Sanitize payload to remove sensitive keys
    let sanitizedPayload = null;
    if (payload) {
      sanitizedPayload = { ...payload };
      const sensitiveKeys = ["password", "token", "secret", "confirmPassword"];
      sensitiveKeys.forEach((key) => {
        if (key in sanitizedPayload!) delete sanitizedPayload![key];
      });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.systemLog.create({
        data: {
          message,
          level,
          userId,
          context,
          payload: sanitizedPayload as any,
          ipAddress,
          userAgent
        },
      });
      if (userId && isUserAction) {
        await tx.activityLog.create({
          data: {
            userId: userId,
            action: message,
            ipAddress,
            userAgent
          },
        });
      }
    });
  } catch (err) {
    console.error("CRITICAL_LOGGER_FAILURE:", err);
  }
};
