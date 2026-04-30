import type { Response } from "express";
import { prisma } from "../../config/prisma.js";
import handleError from "../../shared/utils/error.js";
import { logActivity } from "../../shared/utils/logger.js";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { sendNotification } from "../../shared/utils/notification.js";

export const disputeController = {
  /**
   * File a new dispute.
   */
  fileDispute: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reporterId = req.user?.id as string;
      const { reportedId, rfpId, bidId, reason, description } = req.body;

      if (!reportedId || !reason || !description) {
        return res.status(400).json({
          success: false,
          message: "Reported user, reason, and description are required",
        });
      }

      const dispute = await prisma.dispute.create({
        data: {
          reporterId,
          reportedId,
          rfpId,
          bidId,
          reason,
          description,
        },
        include: {
          reporter: { select: { firstName: true, lastName: true } },
          reported: { select: { firstName: true, lastName: true } },
        },
      });

      await logActivity(
        `Dispute filed by ${dispute.reporter.firstName} against ${dispute.reported.firstName}`,
        "WARN",
        reporterId,
        "DisputeService.fileDispute",
        { disputeId: dispute.id },
      );

      // Notify Admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
        select: { id: true },
      });

      await Promise.all(
        admins.map((admin) =>
          sendNotification({
            userId: admin.id,
            type: "SYSTEM_ALERT",
            content: `New dispute filed: ${reason}`,
            link: `/dashboard/admin/disputes/${dispute.id}`,
            room: admin.id,
          }),
        ),
      );

      return res.status(201).json({
        success: true,
        message: "Dispute filed successfully. An admin will review it shortly.",
        data: dispute,
      });
    } catch (error) {
      handleError("POST /disputes", error, res);
    }
  },

  /**
   * Get all disputes (Admin only).
   */
  getDisputes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.query;
      const disputes = await prisma.dispute.findMany({
        where: status ? { status: status as any } : {},
        include: {
          reporter: {
            select: { firstName: true, lastName: true, email: true },
          },
          reported: {
            select: { firstName: true, lastName: true, email: true },
          },
          rfp: { select: { title: true } },
          bid: { select: { proposal: true } },
          resolvedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        data: disputes,
      });
    } catch (error) {
      handleError("GET /disputes", error, res);
    }
  },

  /**
   * Get dispute by ID.
   */
  getDisputeById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          reporter: {
            select: { firstName: true, lastName: true, email: true },
          },
          reported: {
            select: { firstName: true, lastName: true, email: true },
          },
          rfp: { select: { title: true } },
          bid: { select: { proposal: true } },
          resolvedBy: { select: { firstName: true, lastName: true } },
        },
      });

      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: "Dispute not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: dispute,
      });
    } catch (error) {
      handleError("GET /disputes/:id", error, res);
    }
  },

  /**
   * Resolve a dispute.
   */
  resolveDispute: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const resolvedById = req.user?.id as string;
      const { status, resolution } = req.body;

      if (!status || !resolution) {
        return res.status(400).json({
          success: false,
          message: "Status and resolution are required",
        });
      }

      const dispute = await prisma.dispute.update({
        where: { id },
        data: {
          status,
          resolution,
          resolvedById,
        },
      });

      await logActivity(
        `Dispute ${id} resolved with status ${status}`,
        "INFO",
        resolvedById,
        "DisputeService.resolveDispute",
        { resolution },
      );

      // Notify parties
      await Promise.all([
        sendNotification({
          userId: dispute.reporterId,
          type: "SECURITY_UPDATE",
          content: `Your dispute has been ${status.toLowerCase()}. Resolution: ${resolution}`,
          link: `/dashboard/disputes/${id}`,
          room: dispute.reporterId,
        }),
        sendNotification({
          userId: dispute.reportedId,
          type: "SECURITY_UPDATE",
          content: `A dispute against you has been ${status.toLowerCase()}. Resolution: ${resolution}`,
          link: `/dashboard/disputes/${id}`,
          room: dispute.reportedId,
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Dispute resolved successfully",
        data: dispute,
      });
    } catch (error) {
      handleError("PATCH /disputes/:id/resolve", error, res);
    }
  },
};
