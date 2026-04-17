import { LogLevel, User } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";

/**
 * Optimized Logger
 * @param message - The descriptive log message
 * @param level - INFO, WARN, ERROR, DEBUG
 * @param userId - Optional UUID of the user
 * @param context - Where the log originated (e.g., "AuthService.register")
 * @param payload - Extra JSON data (sanitized automatically)
 * @param isUserAction - If true, records to ActivityLog (visible to users/admins)
 */

export const logActivity = async (
  message: string,
  level: LogLevel = "INFO",
  userId?: string,
  context?: string,
  payload?: Record<string, any>,
  isUserAction: boolean = false,
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

    await prisma.$transaction(async (tx) => {
      await tx.systemLog.create({
        data: {
          message,
          level,
          userId,
          context,
          payload: sanitizedPayload as any,
        },
      });
      if (userId && isUserAction) {
        await tx.activityLog.create({
          data: {
            userId: userId,
            action: message,
          },
        });
      }
    });
  } catch (err) {
    console.error("CRITICAL_LOGGER_FAILURE:", err);
  }
};
