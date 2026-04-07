import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import handleError from "../../shared/utils/error";
import { prisma } from "../../config/prisma";
import { Prisma } from "@prisma/client/extension";
import { logActivity } from "../../shared/utils/logger";
import { getIO } from "../../config/socket";

type TransactionClient = Prisma.TransactionClient;

export const bidController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { rfpId } = req.params;
      const userId = req.user?.id;
      const { amount, proposal } = req.body;
      const io = getIO();

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
              status: "ACTIVE",
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

      if (role === "SUPLLIER") {
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

      return res.status(200).json({
        success: true,
        message: role === "ADMIN" ? "All system bids" : "Your relevant bids",
        count: bids.length,
        data: bids,
      });
    } catch (error) {
      console.log("[BID_CONTROLLER_GET_BIDS]");
      handleError("POST /bid", error, res);
    }
  },
  awardBid: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bidId } = req.params;
      const userId = req.user?.id;
      const io = getIO();

      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const bid = await tx.bid.findUnique({
            where: { id: bidId },
            includes: {
              rfp: true,
              supplier: true,
            },
          });

          if (!bid) throw new Error("BID_NOT_FOUND");
          if (bid.rfp.buyerId !== userId)
            throw new Error("NOT_AUTHORIZED_BUYER");
          if (bid.rfp.status !== "OPEN") throw new Error("RFP_NOT_OPEN");

          const updatedRfp = await tx.rfp.update({
            where: { id: bid.rfpId },
            data: { status: "AWARDED" },
          });

          const winningBid = await tx.bid.update({
            where: { id: bidId },
            data: { status: "AWARDED" },
          });

          await tx.bid.updateMany({
            where: {
              rfpId: bid.rfpId,
              id: { not: bidId },
            },
            data: { status: "CLOSED" },
          });
          io.to(bid.rfpId).emit("rfp_awarded", {
            winnerId: bid.supplierId,
            rfpTitle: bid.rfp.title,
          });

          return { winningBid, updatedRfp };
        },
      );

      await logActivity(
        `RFP ${result.updatedRfp.title} awarded to ${result.winningBid.supplierId}`,
        "INFO",
        userId,
        "bids.award",
        { rfpId: result.updatedRfp.id, winnerId: result.winningBid.id },
      );

      return res.status(200).json({
        success: true,
        message: "RFP successfully awarded and closed.",
        data: result,
      });
    } catch (error: any) {
      console.log("[BID_CONTROLLER_AWARD_BID]");
      if (error.message === "NOT_AUTHORIZED_BUYER") {
        return res.status(403).json({
          success: false,
          message: "You are not the owner of this RFP.",
        });
      }
      handleError("POST /bid", error, res);
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
          rfp: true, // Need this to check who the Buyer is
          supplier: {
            select: { businessName: true, status: true },
          },
        },
      });

      if (!bid) {
        return res
          .status(404)
          .json({ success: false, message: "Bid not found" });
      }

      // SECURITY CHECK:
      // Is this the Supplier who made the bid? OR is this the Buyer who owns the RFP?
      const isOwner = bid.supplierId === userId;
      const isBuyer = bid.rfp.buyerId === userId;
      const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

      if (!isOwner && !isBuyer && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this bid.",
        });
      }

      return res.status(200).json({
        success: true,
        data: bid,
      });
    } catch (error) {
      handleError("GET /bid/:id", error, res);
    }
  },
};
