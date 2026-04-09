import { Response } from "express";
import { prisma } from "../../config/prisma";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import handleError from "../../shared/utils/error";
import { logActivity } from "../../shared/utils/logger";
import { getIO } from "../../config/socket";
import { sendNotification } from "../../shared/utils/notification";

export const buyerController = {
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { companyName, phone, address, department, position } = req.body;
    const io = getIO();

    try {
      // Get old profile state for logging
      const oldProfile = await prisma.buyer.findUnique({
        where: { id: userId },
        select: {
          companyName: true,
          phone: true,
          address: true,
          department: true,
          position: true,
        },
      });

      const updated = await prisma.buyer.update({
        where: { id: userId },
        data: { companyName, phone, address, department, position },
      });

      // Determine what changed
      const changes: string[] = [];
      if (oldProfile?.companyName !== companyName) changes.push("companyName");
      if (oldProfile?.phone !== phone) changes.push("phone");
      if (oldProfile?.address !== address) changes.push("address");
      if (oldProfile?.department !== department) changes.push("department");
      if (oldProfile?.position !== position) changes.push("position");

      if (changes.length > 0) {
        await sendNotification({
          userId: userId!,
          type: "PROFILE_UPDATE",
          content: `Your buyer profile was successfully updated (${changes.join(", ")}).`,
          room: userId,
        });

        io.to(userId!).emit("profile_refreshed", { updatedFields: changes });
      }

      // Log successful profile update with changes
      await logActivity(
        `Buyer profile updated: ${changes.join(", ")}`,
        "INFO",
        userId,
        "buyer.updateProfile",
        {
          before: oldProfile,
          after: updated,
          changes,
        },
      );

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      // Log failed profile update attempt
      await logActivity(
        `Failed to update buyer profile: ${err instanceof Error ? err.message : "Unknown error"}`,
        "ERROR",
        userId,
        "buyer.updateProfile",
        {
          attemptedFields: Object.keys(req.body),
          error: err instanceof Error ? err.message : "Unknown error",
        },
      );
      handleError("PATCH /buyer/profile", err, res);
    }
  },

  deleteAccount: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const io = getIO();

    try {
      // Get buyer info before deactivation for logging
      const buyer = await prisma.buyer.findUnique({
        where: { id: userId },
        select: {
          companyName: true,
          phone: true,
          department: true,
          user: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await sendNotification({
        userId: userId!,
        type: "ACCOUNT_DEACTIVATED",
        content: "Your account has been successfully deactivated.",
        room: userId,
      });

      io.to(userId!).emit("force_logout", {
        message: "Account deactivated by user",
      });

      // Log successful account deactivation
      await logActivity(
        `Buyer account deactivated: ${buyer?.companyName || "Unknown company"} (${buyer?.user?.email})`,
        "WARN", // Using WARN level for account deactivation
        userId,
        "buyer.deleteAccount",
        {
          companyName: buyer?.companyName,
          email: buyer?.user?.email,
          department: buyer?.department,
        },
      );

      res.status(200).json({ success: true, message: "Account deactivated" });
    } catch (err) {
      // Log failed deactivation attempt
      await logActivity(
        `Failed to deactivate buyer account: ${err instanceof Error ? err.message : "Unknown error"}`,
        "ERROR",
        userId,
        "buyer.deleteAccount",
        {
          error: err instanceof Error ? err.message : "Unknown error",
          userId,
        },
      );
      handleError("DELETE /buyer/profile", err, res);
    }
  },
};
