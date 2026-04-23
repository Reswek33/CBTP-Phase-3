import type { Response } from "express";
import { prisma } from "../../config/prisma.js";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import { logActivity } from "../../shared/utils/logger.js";
import { getIO } from "../../config/socket.js";
import { sendNotification } from "../../shared/utils/notification.js";
import { deleteFileIfExists } from "../../shared/utils/fileCleanup.js";

export const buyerController = {
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id!;
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
    const userId = req.user?.id!;
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

  uploadDoc: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id!;
    const file = req.file;

    try {
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { documentType } = req.body;

      const [document] = await prisma.$transaction([
        prisma.buyerDocument.create({
          data: {
            buyerId: userId,
            documentType: documentType || "BUSINESS_LICENSE",
            fileName: file.originalname,
            filePath: file.path,
          },
        }),
        prisma.buyer.update({
          where: { id: userId },
          data: { status: "PENDING" },
        }),
      ]);

      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
        select: { id: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      await Promise.all([
        sendNotification({
          userId: userId!,
          type: "DOCUMENT_UPLOADED",
          content: `Your ${document.documentType} was uploaded. Status: PENDING review.`,
          room: userId,
        }),

        ...admins.map((admin) => {
          sendNotification({
            userId: admin.id,
            type: "VERIFICATION_REQUEST",
            content: `New document upload from Supplier: ${user?.firstName} ${user?.lastName}`,
            link: `/dashboard/admin/users/${userId}`,
            room: admin.id,
          });
        }),

        logActivity(
          `Document uploaded: ${document.documentType}`,
          "INFO",
          userId,
          "Buyer.uploadDocument",
          undefined,
          true, // Record as user action
        ),
      ]);

      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error) {
      handleError("POST /supplier/upload", error, res);
    }
  },

  deleteDoc: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id!;
    const { docId } = req.params as { docId: string };

    try {
      const doc = await prisma.buyerDocument.findUnique({
        where: { id: docId },
      });

      if (!doc || doc.buyerId !== userId) {
        return res.status(403).json({ message: "Unauthorized or not found" });
      }
      if (doc.verifiedAt) {
        return res.status(403).json({
          success: false,
          message: "Cannot delete verified documents",
        });
      }

      await deleteFileIfExists(doc.filePath);

      await prisma.supplierDocument.delete({ where: { id: docId } });

      await sendNotification({
        userId: userId!,
        type: "DOCUMENT_DELETED",
        content: `Document ${doc.documentType} has been removed from your profile.`,
        room: userId,
      });

      await logActivity(
        `Document deleted: ${doc.documentType}`,
        "INFO",
        userId,
        "Supplier.deleteDocument",
      );

      res.status(200).json({ success: true, message: "Document removed" });
    } catch (err) {
      console.error("[BUYER_CONTROLLER_DELETE-DOC");
      handleError("GET /supplier/bids", err, res);
    }
  },
};
