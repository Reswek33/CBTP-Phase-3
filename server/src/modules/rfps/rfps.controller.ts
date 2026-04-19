import type { Request, Response } from "express";
import { Role } from "../../../generated/prisma/index.js";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { rfpsCreateInputSchema } from "./rfps.schema.js";
import { prisma } from "../../config/prisma.js";
import { logActivity } from "../../shared/utils/logger.js";
import handleError from "../../shared/utils/error.js";
import { getIO } from "../../config/socket.js";
import { sendNotification } from "../../shared/utils/notification.js";
import { deleteFileIfExists } from "../../shared/utils/fileCleanup.js";

export const rfpsController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role: Role = req.user?.role as Role;
      const userId = req.user?.id!;
      const io = getIO(); // Initialize Socket

      const file = req.file;
      const filePath = file ? file.path : null;

      if (role !== "BUYER") {
        return res.status(403).json({ message: "Only buyers can post RFPs" });
      }

      const validatedData = rfpsCreateInputSchema.parse(req.body);

      if (validatedData.deadline < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Deadline need to be in the future",
        });
      }

      const createData: any = {
        title: validatedData.title,
        category: validatedData.category,
        budget: validatedData.budget,
        deadline: validatedData.deadline,
        priority: validatedData.priority,
        status: "OPEN",
        buyer: { connect: { id: userId } },
      };

      if (validatedData.description !== undefined) {
        createData.description = validatedData.description;
      } else {
        createData.description = null;
      }

      if (file) {
        createData.documents = {
          create: [{ fileName: file.originalname, filePath: filePath || "" }],
        };
      }

      const rfp = await prisma.rfp.create({
        data: createData,
      });

      // --- NEW: NOTIFICATION LOGIC ---
      // 1. Broadcast to all suppliers that a new RFP is available
      io.emit("new_rfp_posted", {
        id: rfp.id,
        title: rfp.title,
        category: rfp.category,
      });

      // 2. Optional: Notify all verified suppliers in DB (Simplified)
      const suppliers = await prisma.supplier.findMany({
        where: { status: "VERIFIED" },
        select: { id: true },
      });

      await Promise.all(
        suppliers.map((s) =>
          sendNotification({
            userId: s.id,
            type: "NEW_RFP",
            content: `New RFP posted: ${rfp.title}`,
            link: `/dashboard/rfps/${rfp.id}`,
          }),
        ),
      );

      await logActivity(
        `RFP Created: "${rfp.title}"`,
        "INFO",
        userId,
        "rfps.create",
      );

      return res.status(201).json({ success: true, data: rfp });
    } catch (error) {
      handleError("POST /rfps", error, res);
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const rfps = await prisma.rfp.findMany({
        where: {
          status: "OPEN",
        },
        include: {
          buyer: {
            select: { companyName: true },
          },
          _count: {
            select: { bids: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        message: "List of RFPs",
        count: rfps.length,
        data: rfps,
      });
    } catch (error) {
      await logActivity(
        `Failed to fetch RFP list: ${error instanceof Error ? error.message : "Unknown error"}`,
        "ERROR",
        undefined,
        "rfps.list",
      );
      console.log("[RFP_CONTROLLER_LIST]", error);
      handleError("GET /rfps", error, res);
    }
  },
  listMyRfps: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id!;
    try {
      const rfps = await prisma.rfp.findMany({
        where: { buyerId: userId },
        include: { documents: true },
      });
      return res.status(200).json({
        success: true,
        message: `${userId} RFPS`,
        data: rfps,
        count: rfps.length,
      });
    } catch (err) {
      console.error("[RFP_CONTROLLER_LIST_MY_RFPS]", err);
      handleError("GET /rfps/my-rfps", err, res);
    }
  },

  listById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const rfp = await prisma.rfp.findUnique({
        where: { id: id },
        include: {
          documents: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
            },
          },
          bids: {
            include: {
              supplier: true,
            },
          },
          buyer: true,
          _count: { select: { bids: true } },
        },
      });

      if (!rfp) {
        await logActivity(
          `RFP not found: ${id}`,
          "WARN",
          userId,
          "rfps.listById",
          { rfpId: id },
        );
        return res.status(404).json({
          success: false,
          message: "RFP not found",
        });
      }

      const isOwner = userId === rfp.buyerId;
      const responseData = {
        ...rfp,
        _count: isOwner ? rfp._count : { bids: 0 },
        // bids: isOwner ? rfp.bids : null,
      };

      return res.status(200).json({
        success: true,
        message: `RFP ${rfp.id}`,
        data: responseData,
      });
    } catch (error) {
      await logActivity(
        `Failed to fetch RFP ${req.params.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        "ERROR",
        req.user?.id,
        "rfps.listById",
      );
      console.log("[RFP_CONTROLLER_LIST_BY_ID]", error);
      handleError("GET /rfps/:id", error, res);
    }
  },

  cancelRfp: async (req: AuthenticatedRequest, res: Response) => {
    const { rfpId } = req.params as { rfpId: string };
    const userId = req.user?.id;
    const io = getIO();

    try {
      const rfp = await prisma.rfp.findUnique({
        where: { id: rfpId },
        include: { bids: { select: { supplierId: true } } },
      });

      if (!rfp || rfp.buyerId !== userId) {
        return res.status(403).json({ message: "Unauthorized or not found" });
      }

      await prisma.rfp.update({
        where: { id: rfpId },
        data: { status: "CANCELLED" },
      });

      // --- NEW: NOTIFICATION LOGIC ---
      // Notify everyone who placed a bid that it's cancelled
      const uniqueSupplierIds = [...new Set(rfp.bids.map((b) => b.supplierId))];

      await Promise.all(
        uniqueSupplierIds.map((sId) =>
          sendNotification({
            userId: sId,
            type: "RFP_CANCELLED",
            content: `RFP "${rfp.title}" has been cancelled by the buyer.`,
            room: sId, // Assuming you join users to rooms named after their ID
          }),
        ),
      );

      // Emit to the specific RFP room for real-time UI updates
      io.to(rfp.id).emit("rfp_cancelled", { rfpId: rfp.id });

      await logActivity(
        `RFP cancelled: ${rfpId}`,
        "INFO",
        userId,
        "rfps.cancel",
      );
      res.json({ success: true, message: "RFP Cancelled" });
    } catch (err) {
      handleError("PATCH /rfps/:rfpId/cancel", err, res);
    }
  },

  delete: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { rfpId } = req.params as { rfpId: string };
    try {
      const rfp = await prisma.rfp.findUnique({
        where: { id: rfpId },
        select: {
          buyerId: true,
          documents: {
            select: {
              filePath: true,
            },
          },
        },
      });

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: "RFP not found",
        });
      }
      if (rfp?.buyerId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorozid",
        });
      }

      if (rfp.documents && rfp.documents.length > 0) {
        await Promise.all(
          rfp.documents.map((doc) => deleteFileIfExists(doc.filePath)),
        );
      }
      await prisma.rfp.delete({
        where: { id: rfpId },
      });
      return res.status(200).json({
        success: true,
        message: "RFP deleted successfully",
      });
    } catch (err) {
      console.error("[RFP_CONTROLLER_DELETE]", err);
      handleError("DELETE /rfps/:rfpid/delete", err, res);
    }
  },
};
