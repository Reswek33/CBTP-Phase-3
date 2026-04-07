import { Response } from "express";
import { prisma } from "../../config/prisma";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { logActivity } from "../../shared/utils/logger";

export const adminController = {
  getPendingSuppliers: async (req: AuthenticatedRequest, res: Response) => {
    const pending = await prisma.supplier.findMany({
      where: { status: "PENDING" },
      include: { user: true, documents: true },
    });
    res.json({ success: true, data: pending });
  },

  verifySupplier: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, reason } = req.body; // status: 'VERIFIED' | 'REJECTED'
    const adminId = req.user?.id;

    const updatedSupplier = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.update({
        where: { id: id },
        data: {
          status: status,
          rejectedReason: reason,
        },
      });

      await tx.supplierDocument.updateMany({
        where: { supplierId: id, verifiedAt: null },
        data: { verifiedBy: adminId, verifiedAt: new Date() },
      });
      return supplier;
    });

    await logActivity(
      `Supplier ${id} set to ${status}`,
      "INFO",
      req.user?.id,
      "Admin.verify",
    );

    res.json({ success: true, data: updatedSupplier });
  },
};
