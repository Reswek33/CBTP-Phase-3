import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "@prisma/client/extension";
import { logActivity } from "../../shared/utils/logger.js";
import { getIO } from "../../config/socket.js";
import { sendNotification } from "../../shared/utils/notification.js";

type TransactionClient = Prisma.TransactionClient;

export const bidController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { rfpId } = req.params as { rfpId: string };
      const userId = req.user?.id;
      const { amount, proposal } = req.body;
      const file = req.file;
      const io = getIO();

      if (!file) throw new Error("Proposal file is required!");
      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const rfp = await tx.rfp.findUnique({
            where: { id: rfpId },
            include: { buyer: true },
          });

          const supplier = await tx.supplier.findUnique({
            where: { id: userId },
          });

          if (!rfp || rfp.status !== "OPEN") throw new Error("RFP_CLOSED");
          if (new Date(rfp.deadline) < new Date())
            throw new Error("DEADLINE_PASSED");
          if (supplier?.status !== "VERIFIED")
            throw new Error("SUPPLIER_NOT_VERIFIED");
          if (rfp.buyerId === userId) throw new Error("CANNOT_BID_ON_OWN_RFP");

          const bid = await tx.bid.create({
            data: {
              amount,
              proposal,
              rfpId,
              supplierId: userId!,
              status: "PENDING_APPROVAL",
              documents: {
                create: {
                  fileName: file.originalname,
                  filePath: file.path,
                  status: "PENDING",
                },
              },
            },
            include: {
              documents: true,
            },
          });
          io.to(rfpId).emit("new_bid_received", {
            rfpId,
            amount: bid.amount,
            bidId: bid.id,
          });
          return bid;
        },
      );

      await logActivity(
        `Bid placed on RFP ${rfpId}`,
        "INFO",
        userId,
        "bids.create",
        { amount, rfpId },
      );

      return res.status(201).json({
        success: true,
        message: "Bid created successfully",
        data: result,
      });
    } catch (error) {
      console.log("[BID_CONTROLLER_CREATE_BID]", error);
      handleError("POST /bid", error, res);
    }
  },

  getBids: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      let whereClause = {};

      if (role === "SUPPLIER") {
        whereClause = { supplierId: userId };
      } else if (role === "BUYER") {
        whereClause = { rfp: { buyerId: userId } };
      }
      const bids = await prisma.bid.findMany({
        where: whereClause,
        include: {
          rfp: { select: { title: true, status: true, deadline: true } },
          supplier: { select: { businessName: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      await logActivity(
        `Viewed bids list as ${role}`,
        "INFO",
        userId,
        "bids.getMany",
      );

      return res.status(200).json({
        success: true,
        message: role === "ADMIN" ? "All system bids" : "Your relevant bids",
        count: bids.length,
        data: bids,
      });
    } catch (error) {
      console.log("[BID_CONTROLLER_GET_BIDS]");
      handleError("GET /bids", error, res);
    }
  },

  awardBid: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bidId } = req.params;
      const userId = req.user?.id as string;
      const io = getIO();

      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const bid = await tx.bid.findUnique({
            where: { id: bidId },
            include: { rfp: true, supplier: true },
          });

          if (!bid) throw new Error("BID_NOT_FOUND");
          if (bid.rfp.buyerId !== userId)
            throw new Error("NOT_AUTHORIZED_BUYER");
          if (bid.rfp.status !== "OPEN") throw new Error("RFP_NOT_OPEN");

          await tx.rfp.update({
            where: { id: bid.rfpId },
            data: {
              awardedBidId: bid.id,
              status: "AWARDED",
            },
          });

          const winningBid = await tx.bid.update({
            where: { id: bidId },
            data: { status: "AWARDED" },
          });

          const otherBidders = await tx.bid.findMany({
            where: { rfpId: bid.rfpId, id: { not: bidId } },
            select: { supplierId: true },
          });

          await tx.bid.updateMany({
            where: {
              rfpId: bid.rfpId,
              id: { not: bidId },
            },
            data: { status: "OUTBID" },
          });

          // --- NOTIFICATION & SOCKET LOGIC ---

          // 1. Notify the Winner
          await sendNotification({
            userId: bid.supplierId,
            type: "BID_AWARDED",
            content: `Congratulations! You have been awarded the contract for "${bid.rfp.title}".`,
            room: bid.supplierId,
            link: `/dashboard/bids/${bidId}`,
          });

          // 2. Notify Losers
          const uniqueLoserIds = [
            ...new Set(
              otherBidders.map((b: { supplierId: string }) => b.supplierId),
            ),
          ];
          await Promise.all(
            uniqueLoserIds.map((sId: any) =>
              sendNotification({
                userId: sId,
                type: "RFP_CLOSED",
                content: `The RFP "${bid.rfp.title}" has been awarded to another supplier.`,
                room: sId,
              }),
            ),
          );

          // 3. Update all users currently viewing this RFP room
          io.to(bid.rfpId).emit("rfp_status_changed", {
            status: "AWARDED",
            winnerName: bid.supplier.businessName,
          });

          return { winningBid, supplierName: bid.supplier.businessName };
        },
      );

      await logActivity(`RFP Awarded`, "INFO", userId, "bids.award", { bidId });
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BID_CONTROLLER_AWARD_BID]", error);
      handleError("POST /bid/award", error, res);
    }
  },

  getBidById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const role = req.user?.role;

      const bid = await prisma.bid.findUnique({
        where: { id },
        include: {
          rfp: true,
          supplier: {
            select: { businessName: true, status: true },
          },
        },
      });

      if (!bid) {
        await logActivity(
          `Bid ${id} not found`,
          "WARN",
          userId,
          "bids.getOne",
          { bidId: id },
        );
        return res
          .status(404)
          .json({ success: false, message: "Bid not found" });
      }

      const isOwner = bid.supplierId === userId;
      const isBuyer = bid.rfp.buyerId === userId;
      const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

      if (!isOwner && !isBuyer && !isAdmin) {
        await logActivity(
          `Unauthorized attempt to view bid ${id}`,
          "WARN",
          userId,
          "bids.getOne",
          {
            bidId: id,
            bidOwnerId: bid.supplierId,
            rfpBuyerId: bid.rfp.buyerId,
          },
        );
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this bid.",
        });
      }

      await logActivity(
        `Viewed bid details ${id}`,
        "INFO",
        userId,
        "bids.getOne",
      );

      return res.status(200).json({
        success: true,
        data: bid,
      });
    } catch (error) {
      console.error("[BID_CONTROLLER_GET_BID_BY_ID]", error);
      handleError("GET /bid/:id", error, res);
    }
  },

  submitFinancialBid: async (req: AuthenticatedRequest, res: Response) => {
    const { bidId } = req.params as { bidId: string };
    const { amount } = req.body;
    const userId = req.user?.id;

    try {
      const existingBid = await prisma.bid.findUnique({ where: { id: bidId } });

      if (existingBid?.status !== "ACTIVE") {
        await logActivity(
          `Attempted to submit financial bid on non-active bid ${bidId} (status: ${existingBid?.status})`,
          "WARN",
          userId,
          "bids.submitFinancial",
          { bidId, currentStatus: existingBid?.status },
        );
        return res.status(403).json({
          message: "You must be approved by the buyer before entering a price.",
        });
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: { amount },
      });

      await logActivity(
        `Financial bid amount updated for bid ${bidId}`,
        "INFO",
        userId,
        "bids.submitFinancial",
        { amount },
      );

      return res.status(200).json({
        success: true,
        message: `Bid ${bidId} submitted successfully`,
        data: updatedBid,
      });
    } catch (error) {
      console.error("BID_CONTROLLER_SUBMIT_FINANCIAL_BID", error);
      handleError("POST /bids/:bidId/submit-amount", error, res);
    }
  },

  applyToBid: async (req: AuthenticatedRequest, res: Response) => {
    const { rfpId } = req.params as { rfpId: string };
    const { proposal } = req.body;
    const supplierId = req.user?.id as string;
    const io = getIO();
    const file = req.file;

    try {
      if (!file) {
        return res.status(400).json({
          success: false,
          messasge: "Proposal file is required",
        });
      }
      const bid = await prisma.$transaction(async (tx) => {
        const bid = await tx.bid.create({
          data: {
            rfpId,
            supplierId,
            proposal,
            status: "PENDING_APPROVAL",
          },
          include: {
            rfp: { select: { buyerId: true, title: true } },
            documents: true,
          },
        });

        tx.proposalDocument.create({
          data: {
            bidId: bid.id,
            fileName: file.originalname,
            filePath: file.path,
          },
        });
        return bid;
      });

      // --- NOTIFICATION & SOCKET LOGIC ---

      // Notify the Buyer
      await sendNotification({
        userId: bid.rfp.buyerId,
        type: "NEW_BID_APPLICATION",
        content: `A new supplier has applied to your RFP: ${bid.rfp.title}`,
        room: bid.rfp.buyerId,
        link: `/dashboard/rfps/${rfpId}`,
      });

      // Real-time update for buyer's dashboard if they are on the RFP page
      io.to(rfpId).emit("new_application_received", { bidId: bid.id });

      return res.status(201).json({ success: true, data: bid });
    } catch (error) {
      console.error("[BIDS_CONTROLLER_APPLY_TO_BID", error);
      handleError("POST /bids/apply/:rfpId", error, res);
    }
  },

  reapplyToBid: async (req: AuthenticatedRequest, res: Response) => {
    const { rfpId } = req.params as { rfpId: string };
    const supplierId = req.user?.id;
    const { proposal } = req.body;
    const file = req.file;
    try {
      const existingBid = await prisma.bid.findFirst({
        where: {
          rfpId,
          supplierId,
          status: "REJECTED",
        },
      });

      if (!file) throw new Error("Proposal Document is required!");

      if (!existingBid) {
        return res.status(404).json({
          success: false,
          message: "No rejected bid found to reapply",
        });
      }

      const updatedBid = await prisma.$transaction(async (tx) => {
        // Update the existing bid
        const bid = await tx.bid.update({
          where: { id: existingBid.id },
          data: {
            status: "PENDING_APPROVAL",
            proposal: proposal,
            rejectionReason: null,
            proposalPath: file?.path,
            documents: {
              create: {
                fileName: file.originalname,
                filePath: file.path,
                status: "PENDING",
              },
            },
          },
        });
        return bid;
      });

      return res.status(200).json({
        success: true,
        data: updatedBid,
      });
    } catch (err) {
      handleError("POST /bids/:rfpId/reapply", err, res);
    }
  },

  updateApplicationStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bidId } = req.params as { bidId: string };
      const { status, rejectionReason } = req.body;
      const io = getIO();

      const isEligible = status === "ACTIVE";

      const bid = await prisma.bid.update({
        where: { id: bidId },
        data: { status, rejectionReason, isEligibleForBidRoom: isEligible },
        include: {
          rfp: { select: { title: true } },
          supplier: { select: { businessName: true } },
        },
      });

      // --- NOTIFICATION & SOCKET LOGIC ---

      await sendNotification({
        userId: bid.supplierId,
        type: status === "ACTIVE" ? "BID_APPROVED" : "BID_REJECTED",
        content:
          status === "ACTIVE"
            ? `Your application for "${bid.rfp.title}" was approved! You can now submit your financial bid.`
            : `Your application for "${bid.rfp.title}" was rejected. Reason: ${rejectionReason}`,
        room: bid.supplierId,
      });

      // Tell the supplier UI to unlock the financial input
      io.to(bid.supplierId).emit("bid_status_updated", { bidId, status });
      // Tell everyone viewing the RFP page about the status update
      io.to(bid.rfpId).emit("bid_status_updated", { bidId, status });

      return res.status(200).json({ success: true, data: bid });
    } catch (error) {
      console.error("[BID_CONTROLLER_UPDATE_APPLICATION_STATSU]", error);
      handleError("PATCH /bids/:bidId/status", error, res);
    }
  },

  withdrawBid: async (req: AuthenticatedRequest, res: Response) => {
    const { bidId } = req.params as { bidId: string };
    const userId = req.user?.id!;

    try {
      const existingBid = await prisma.bid.findUnique({
        where: { id: bidId, supplierId: userId },
      });

      if (!existingBid) {
        await logActivity(
          `Withdraw failed: Bid ${bidId} not found or not owned by user`,
          "WARN",
          userId,
          "bids.withdraw",
          { bidId },
        );
        return res.status(404).json({ message: "Bid not found" });
      }

      if (
        existingBid.status !== "ACTIVE" &&
        existingBid.status !== "PENDING_APPROVAL"
      ) {
        await logActivity(
          `Cannot withdraw bid ${bidId} with status ${existingBid.status}`,
          "WARN",
          userId,
          "bids.withdraw",
          { bidId, currentStatus: existingBid.status },
        );
        return res.status(403).json({
          message: `Cannot withdraw bid with status: ${existingBid.status}`,
        });
      }

      await prisma.bid.update({
        where: { id: bidId, supplierId: userId },
        data: { status: "WITHDRAWN" },
      });

      await logActivity(
        `Bid ${bidId} withdrawn`,
        "INFO",
        userId,
        "bids.withdraw",
        { bidId },
      );

      res.json({ success: true, message: "Bid withdrawn successfully" });
    } catch (err) {
      console.error("BID_CONTROLLER_WITHDRAW_BID", err);
      handleError("PATCH /bids/:bidId/withdraw", err, res);
    }
  },
};
