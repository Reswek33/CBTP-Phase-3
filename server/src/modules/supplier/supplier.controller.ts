import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { prisma } from "../../config/prisma";
import handleError from "../../shared/utils/error";
import { logActivity } from "../../shared/utils/logger";
import { sendNotification } from "../../shared/utils/notification"; // Added
import { getIO } from "../../config/socket"; // Added

export const supplierController = {
  uploadDocument: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const file = req.file;
      const io = getIO();

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { documentType } = req.body;

      const document = await prisma.supplierDocument.create({
        data: {
          supplierId: userId!,
          documentType: documentType || "BUSINESS_LICENSE",
          fileName: file.originalname,
          filePath: file.path,
        },
      });

      // Reset status to PENDING so Admin knows there is new data to review
      await prisma.supplier.update({
        where: { id: userId },
        data: { status: "PENDING" },
      });

      // --- NOTIFICATION LOGIC ---
      await sendNotification({
        userId: userId!,
        type: "DOCUMENT_UPLOADED",
        content: `Document (${document.documentType}) uploaded successfully. Status: PENDING review.`,
        room: userId, // Targeted to the specific user's socket room
      });

      // Notify Admins room if you have one (optional but recommended)
      io.to("ADMIN_ROOM").emit("admin_alert", {
        message: `New document upload from Supplier: ${userId}`,
        type: "VERIFICATION_REQUEST",
      });

      await logActivity(
        `Document uploaded: ${document.documentType}`,
        "INFO",
        userId,
        "Supplier.uploadDocument",
      );

      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error) {
      handleError("POST /supplier/upload", error, res);
    }
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const io = getIO();

      const {
        phone,
        address,
        taxId,
        registrationNumber,
        yearsInBusiness,
        categories,
        bio,
      } = req.body;

      const updatedSupplier = await prisma.supplier.update({
        where: { id: userId },
        data: {
          phone,
          address,
          taxId,
          registrationNumber,
          yearsInBusiness: yearsInBusiness
            ? parseInt(yearsInBusiness)
            : undefined,
          categories,
          bio,
        },
      });

      // --- REAL-TIME FEEDBACK ---
      await sendNotification({
        userId: userId!,
        type: "PROFILE_UPDATED",
        content: "Your business profile has been updated successfully.",
        room: userId,
      });

      // Sync the frontend header/avatar if phone or bio changed
      io.to(userId!).emit("profile_sync", updatedSupplier);

      await logActivity(
        "Supplier updated profile information",
        "INFO",
        userId,
        "Supplier.updateProfile",
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedSupplier,
      });
    } catch (error) {
      handleError("PATCH /supplier/profile", error, res);
    }
  },

  deleteDocument: async (req: AuthenticatedRequest, res: Response) => {
    const { docId } = req.params as { docId: string };
    const userId = req.user?.id;

    try {
      const doc = await prisma.supplierDocument.findUnique({
        where: { id: docId },
      });

      if (!doc || doc.supplierId !== userId) {
        return res.status(403).json({ message: "Unauthorized or not found" });
      }

      if (doc.verifiedAt) {
        return res
          .status(403)
          .json({ message: "Cannot delete verified documents" });
      }

      await prisma.supplierDocument.delete({ where: { id: docId } });

      // --- NOTIFICATION ---
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
      handleError("DELETE /supplier/documents/:id", err, res);
    }
  },
};
