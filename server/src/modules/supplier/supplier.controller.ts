import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { prisma } from "../../config/prisma";
import handleError from "../../shared/utils/error";
import { logActivity } from "../../shared/utils/logger";

export const supplierController = {
  uploadDocument: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // The documentType usually comes from the body (e.g., "TIN_CERTIFICATE" or "LICENSE")
      const { documentType } = req.body;

      const document = await prisma.supplierDocument.create({
        data: {
          supplierId: userId!,
          documentType: documentType || "BUSINESS_LICENSE",
          fileName: file.originalname,
          filePath: file.path,
        },
      });

      // Optional: Set supplier status back to PENDING if they were REJECTED before
      await prisma.supplier.update({
        where: { id: userId },
        data: { status: "PENDING" },
      });

      await logActivity(
        `Document uploaded: ${document.documentType}`,
        "INFO",
        userId,
        "Supplier.upload",
      );

      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error) {
      console.error("[SUPPLIER_UPLOAD_ERROR]", error);
      handleError("POST /supplier/upload", error, res);
    }
  },
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

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
          categories, // Prisma handles string arrays automatically
          bio,
          // We DON'T update status here; that's for the Admin to do
        },
      });

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
      console.error("[SUPPLIER_UPDATE_ERROR]", error);
      handleError("PATCH /supplier/profile", error, res);
    }
  },
};
