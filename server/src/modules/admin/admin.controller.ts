import { Response, Request } from "express";
import { prisma } from "../../config/prisma";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { logActivity } from "../../shared/utils/logger";
import handleError from "../../shared/utils/error";

export const adminController = {
  getPendingSuppliers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pending = await prisma.supplier.findMany({
        where: { status: "PENDING" },
        include: { user: true, documents: true },
      });
      res.status(200).json({ success: true, data: pending });
    } catch (err) {
      console.error("[ADMIN_VERIFY_SUPPLIER]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  verifySupplier: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status, rejectedReason } = req.body;
    const adminId = req.user?.id;
    try {
      const updatedSupplier = await prisma.$transaction(async (tx) => {
        const supplier = await tx.supplier.update({
          where: { id: id },
          data: {
            status: status,
            rejectedReason: status === "REJECTED" ? rejectedReason : null,
            verifiedAt: status === "VERIFIED" ? new Date() : null,
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

      res.status(200).json({ success: true, data: updatedSupplier });
    } catch (err) {
      console.error("[ADMIN_VERIFY_SUPPLIER]", err);
      handleError("PATCH /admin/status", err, res);
    }
  },

  getAllUsers: async (req: AuthenticatedRequest, res: Response) => {
    const requesterRole = req.user?.role;
    try {
      let allowedRoles: string[] = ["BUYER", "SUPPLIER"];
      if (requesterRole === "SUPERADMIN") {
        allowedRoles.push("ADMIN");
      }
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: allowedRoles as any,
          },
          NOT: {
            id: req.user?.id,
          },
        },
        include: {
          supplier: { include: { documents: true } },
          buyer: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json({ success: true, users });
    } catch (err) {
      console.error("[ADMIN_GET_ALL_USERS]", err);
      handleError("GET /admin/users", err, res);
    }
  },

  getUserDetails: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params as { id: string };

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          supplier: {
            include: {
              documents: true,
              bids: {
                include: { rfp: { select: { title: true, status: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
          buyer: {
            include: {
              rfps: {
                include: { _count: { select: { bids: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
          activityLogs: { take: 10, orderBy: { createdAt: "desc" } },
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, user });
    } catch (err) {
      handleError("GET /admin/user-details", err, res);
    }
  },
};
