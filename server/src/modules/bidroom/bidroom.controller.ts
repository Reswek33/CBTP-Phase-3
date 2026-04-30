import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import z from "zod";
import { prisma } from "../../config/prisma.js";
import type { InvitationStatus } from "../../../generated/prisma/index.js";
import { logActivity } from "../../shared/utils/logger.js";
import { getIO } from "../../config/socket.js";

const roomCreateInputSchema = z.object({
  rfpId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  biddingType: z.enum(["PUBLIC", "CLOSED"]),
  invitedSupplierIds: z.array(z.string().uuid()),
});

const invitationUpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]),
});

const bidAmountInputSchema = z.object({
  amount: z.coerce.number().positive(),
});

const awardInputSchema = z.object({
  winningBidId: z.string().uuid(),
});

const normalizeRoomStatus = async (
  roomId: string,
  currentStatus: "SCHEDULED" | "ACTIVE" | "CLOSED" | "CANCELLED" | "AWARDED",
  startTime: Date,
  endTime: Date,
) => {
  if (currentStatus === "CANCELLED" || currentStatus === "AWARDED") {
    return currentStatus;
  }

  const now = new Date();
  let nextStatus = currentStatus;

  if (now >= endTime && currentStatus !== "CLOSED") {
    nextStatus = "CLOSED";
  } else if (
    now >= startTime &&
    now < endTime &&
    currentStatus === "SCHEDULED"
  ) {
    nextStatus = "ACTIVE";
  }

  if (nextStatus !== currentStatus) {
    await prisma.bidRoom.update({
      where: { id: roomId },
      data: { status: nextStatus },
    });
  }

  return nextStatus;
};

export const bidRoomController = {
  createRoom: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buyerId = req.user?.id!;
      const { rfpId, startTime, endTime, biddingType, invitedSupplierIds } =
        roomCreateInputSchema.parse(req.body);

      const bidRoom = await prisma.$transaction(async (tx) => {
        const rfp = await tx.rfp.findFirst({
          where: {
            id: rfpId,
            buyerId,
            status: "OPEN",
          },
          select: {
            id: true,
          },
        });

        if (!rfp) {
          throw new Error("RFP not found or not eligible for room creation");
        }

        if (endTime <= startTime) {
          throw new Error("End time must be after start time");
        }

        if (invitedSupplierIds.length === 0) {
          throw new Error("At least one supplier must be invited");
        }

        const eligibleBids = await tx.bid.findMany({
          where: {
            rfpId,
            supplierId: { in: invitedSupplierIds },
            status: "ACTIVE",
            isEligibleForBidRoom: true,
          },
          select: { supplierId: true },
        });

        const eligibleSupplierIds = new Set(eligibleBids.map((b) => b.supplierId));
        const ineligibleSuppliers = invitedSupplierIds.filter(
          (supplierId) => !eligibleSupplierIds.has(supplierId),
        );
        if (ineligibleSuppliers.length > 0) {
          throw new Error(
            "One or more invited suppliers are not eligible for this bid room",
          );
        }

        const room = await tx.bidRoom.create({
          data: {
            rfpId,
            buyerId: buyerId,
            startTime,
            endTime,
            biddingType,
            status: "SCHEDULED",
          },
        });

        const invitations = invitedSupplierIds.map((supplierId: string) => ({
          bidRoomId: room.id,
          supplierId,
          invitedBy: buyerId,
          status: "PENDING" as InvitationStatus,
        }));

        await tx.bidRoomInvitation.createMany({ data: invitations });
        await tx.bid.updateMany({
          where: {
            rfpId,
            supplierId: { in: invitedSupplierIds },
          },
          data: {
            invitedToBidRoom: true,
          },
        });

        // Create Notifications for Suppliers
        const notifications = invitedSupplierIds.map((id) => ({
          userId: id,
          content: `You have been invited to a ${biddingType} Bid Room for RFP: ${rfpId}`,
          type: "BID_INVITATION",
          link: `/dashboard/bidroom/${room.id}`,
        }));
        await tx.notification.createMany({ data: notifications });

        return { room, invitations };
      });

      await logActivity(
        `Created Bid Room ${bidRoom.room.id}`,
        "INFO",
        buyerId,
        "BidRoomController.createRoom",
        { rfpId },
        true,
      );

      const io = getIO();
      bidRoom.invitations.forEach((invitation) => {
        io.to(invitation.supplierId).emit("new_notification", {
          userId: invitation.supplierId,
          type: "BID_INVITATION",
          content: `You have been invited to a ${biddingType} Bid Room for RFP: ${rfpId}`,
          link: `/dashboard/bidroom/${bidRoom.room.id}`,
        });
      });

      return res.status(201).json({
        success: true,
        message: "Room created successfully and invitations sent",
        data: {
          id: bidRoom.room.id,
          status: bidRoom.room.status,
          invitationsCount: bidRoom.invitations.length,
        },
      });
    } catch (err) {
      handleError("POST /room/create", err, res);
    }
  },

  joinRoom: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params as { roomId: string };
      const io = getIO();
      const room = await prisma.bidRoom.findFirst({
        where: {
          id: roomId,
          OR: [
            { buyerId: userId },
            {
              invitations: { some: { supplierId: userId, status: "ACCEPTED" } },
            },
          ],
        },
        include: {
          invitations: true,
        },
      });

      if (!room) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this bid room",
        });
      }

      const socketId = req.headers["x-socket-id"] as string;
      if (socketId && io) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(`room_${roomId}`);

          // Send current room state to the joining user
          const currentBids = await prisma.roomBid.findMany({
            where: { bidRoomId: roomId },
            orderBy: { amount: "asc" },
            include: {
              supplier: {
                select: {
                  businessName: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          });

          socket.emit("room_state", {
            roomId,
            status: room.status,
            currentLeadingBid: currentBids[0] || null,
            totalBids: currentBids.length,
            participants: room.invitations.filter(
              (i) => i.status === "ACCEPTED",
            ).length,
          });
        }
      }

      return res
        .status(200)
        .json({ success: true, message: "Joined room successfully" });
    } catch (err) {
      handleError("POST /rooms/:roomId/join", err, res);
    }
  },

  getRoomDetail: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };

      const bidroom = await prisma.bidRoom.findUnique({
        where: { id: id },
        include: {
          bids: {
            orderBy: { amount: "asc" },
            include: {
              supplier: {
                select: {
                  businessName: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          rfp: {
            select: {
              title: true,
              description: true,
              budget: true,
              currency: true,
              category: true,
            },
          },
          invitations: {
            include: {
              supplier: {
                select: {
                  businessName: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      if (!bidroom) {
        return res.status(404).json({
          success: false,
          message: "Room NOT_FOUND",
        });
      }

      const isBuyer = bidroom.buyerId === userId;
      const isInvitedSupplier = bidroom.invitations.some(
        (inv) => inv.supplierId === userId && inv.status === "ACCEPTED",
      );

      if (
        !isBuyer &&
        !isInvitedSupplier &&
        !["ADMIN", "SUPERADMIN"].includes(req.user?.role || "")
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this room",
        });
      }

      const normalizedStatus = await normalizeRoomStatus(
        bidroom.id,
        bidroom.status,
        bidroom.startTime,
        bidroom.endTime,
      );

      const participantsCount = bidroom.invitations.filter(
        (i) => i.status === "ACCEPTED",
      ).length;
      const responseModel = {
        id: bidroom.id,
        status: normalizedStatus,
        startTime: bidroom.startTime,
        endTime: bidroom.endTime,
        biddingType: bidroom.biddingType,
        currentLeadingBid:
          bidroom.biddingType === "PUBLIC" ? bidroom.bids[0] : null,
        totalBids: bidroom.bids.length,
        participants: bidroom.invitations,
        participantsCount,
        rfp: bidroom.rfp,
        bids:
          bidroom.biddingType === "CLOSED" && !isBuyer
            ? []
            : bidroom.bids,
      };

      return res.status(200).json({
        success: true,
        data: responseModel,
      });
    } catch (err) {
      handleError("GET /rooms/:id", err, res);
    }
  },

  updateBidAmount: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { id: roomId } = req.params as { id: string };

      // 1. Validate Input and parse schema
      const { amount } = bidAmountInputSchema.parse(req.body);
      console.log(typeof amount);

      // Safeguard: Ensure amount is a valid finite number to prevent NaN database errors
      // if (!Number.isFinite(amount)) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Invalid bid amount provided",
      //   });
      // }

      const io = getIO();

      const result = await prisma.$transaction(async (tx) => {
        // 2. Fetch room details with existing leading bid
        const room = await tx.bidRoom.findUnique({
          where: { id: roomId },
          include: {
            bids: { orderBy: { amount: "asc" }, take: 1 },
            rfp: { select: { budget: true } },
          },
        });

        if (!room) throw new Error("Room NOT_FOUND");
        if (room.status !== "ACTIVE")
          throw new Error("Bidding is not currently active");

        const now = new Date();
        if (now < room.startTime) throw new Error("Bidding hasn't started yet");
        if (now > room.endTime) throw new Error("Bidding has ended");

        // 3. Budget Validation
        if (room.rfp.budget && amount > Number(room.rfp.budget)) {
          throw new Error(`Bid cannot exceed budget of ${room.rfp.budget}`);
        }

        // 4. Invitation Validation
        const invitation = await tx.bidRoomInvitation.findUnique({
          where: {
            bidRoomId_supplierId: { bidRoomId: roomId, supplierId: userId },
          },
        });

        if (!invitation || invitation.status !== "ACCEPTED") {
          throw new Error("You must accept the invitation before bidding");
        }

        // 5. Price Improvement Validation (Public/Standard Auction)
        const currentBest = room.bids[0];
        if (room.biddingType === "PUBLIC") {
          if (currentBest && amount >= Number(currentBest.amount)) {
            throw new Error(
              "Your bid must be lower than the current leading bid",
            );
          }
        }

        // 6. Upsert the bid using explicit relational connections to avoid Prisma validation errors
        const bid = await tx.roomBid.upsert({
          where: {
            bidRoomId_supplierId: { bidRoomId: roomId, supplierId: userId },
          },
          update: {
            amount: amount,
            previousAmount: currentBest?.amount ?? null,
            updatedAt: new Date(),
          },
          create: {
            amount: amount,
            bidRoom: {
              connect: { id: roomId },
            },
            supplier: {
              connect: { id: userId },
            },
          },
        });

        // 7. Audit Trail
        await tx.bidActivityLog.create({
          data: {
            bidRoomId: roomId,
            actorId: userId,
            action: "BID_PLACED",
            newAmount: amount,
            oldAmount: currentBest?.amount ?? null,
          },
        });

        return { bid, biddingType: room.biddingType, currentBest };
      });

      // 8. Socket Notifications
      try {
        if (result.biddingType === "PUBLIC") {
          // For PUBLIC: Broadcast the new bid amount to the room
          io.to(`room_${roomId}`).emit("new_bid", {
            amount: result.bid.amount,
            supplierId: userId,
            timestamp: new Date().toISOString(),
            isNewLeader:
              !result.currentBest ||
              Number(result.bid.amount) < Number(result.currentBest.amount),
          });
        } else {
          // For CLOSED: Hide amount, just notify that activity occurred
          io.to(`room_${roomId}`).emit("bid_placed", {
            timestamp: new Date().toISOString(),
            message: "A new bid has been placed",
          });
        }

        // Notify the previously leading supplier that they've been outbid
        if (
          result.biddingType === "PUBLIC" &&
          result.currentBest &&
          Number(result.bid.amount) < Number(result.currentBest.amount)
        ) {
          io.to(result.currentBest.supplierId).emit("outbid", {
            roomId,
            newAmount: result.bid.amount,
            message: "You have been outbid!",
          });
        }
      } catch (socketError) {
        console.error("Socket broadcast failed:", socketError);
      }

      return res.status(200).json({
        success: true,
        data: {
          id: result.bid.id,
          amount: result.bid.amount,
          timestamp: result.bid.updatedAt,
        },
      });
    } catch (err) {
      handleError("POST /rooms/:id/bids", err, res);
    }
  },

  updateInvitationStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };
      const { status } = invitationUpdateStatusSchema.parse(req.body);
      const invitation = await prisma.bidRoomInvitation.findFirst({
        where: { id, supplierId: userId },
        include: { bidRoom: true },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: "Invitation NOT_FOUND",
        });
      }

      if (invitation.status !== "PENDING") {
        return res.status(400).json({
          success: false,
          message: "Invitation has already been responded to",
        });
      }

      if (status === "ACCEPTED") {
        const now = new Date();
        if (now > invitation.bidRoom.endTime) {
          return res.status(400).json({
            success: false,
            message: "Cannot accept invitation - bidding period has ended",
          });
        }
      }

      const updatedInvitation = await prisma.bidRoomInvitation.update({
        where: { id },
        data: {
          status: status as InvitationStatus,
          respondedAt: new Date(),
        },
      });

      const io = getIO();
      io.to(`room_${invitation.bidRoomId}`).emit("invitation_updated", {
        roomId: invitation.bidRoomId,
        supplierId: invitation.supplierId,
        status: updatedInvitation.status,
      });
      io.to(invitation.bidRoom.buyerId).emit("invitation_updated", {
        roomId: invitation.bidRoomId,
        supplierId: invitation.supplierId,
        status: updatedInvitation.status,
      });
      io.to(invitation.bidRoom.buyerId).emit("new_notification", {
        userId: invitation.bidRoom.buyerId,
        type: "BID_INVITATION_RESPONSE",
        content: `A supplier has ${updatedInvitation.status.toLowerCase()} your invitation.`,
        link: `/dashboard/bidroom/${invitation.bidRoomId}`,
      });

      return res.status(200).json({
        success: true,
        message: `Invitation is ${updatedInvitation.status}`,
      });
    } catch (err) {
      handleError("PATCH /rooms/invitation/:id", err, res);
    }
  },

  awardBid: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buyerId = req.user?.id!;
      const { id: roomId } = req.params as { id: string };
      const { winningBidId } = awardInputSchema.parse(req.body);
      const io = getIO();

      const result = await prisma.$transaction(async (tx) => {
        const room = await tx.bidRoom.findFirst({
          where: { id: roomId, buyerId },
          include: {
            invitations: true,
          },
        });
        if (!room) {
          throw new Error("Room NOT_FOUND");
        }
        if (!["ACTIVE", "CLOSED"].includes(room.status)) {
          throw new Error("Room must be active or closed before awarding");
        }

        const winningBid = await tx.roomBid.findUnique({
          where: { id: winningBidId },
          include: { supplier: { select: { businessName: true } } },
        });
        if (!winningBid || winningBid.bidRoomId !== roomId) {
          throw new Error("Winning bid not found in this room");
        }

        const updatedRoom = await tx.bidRoom.update({
          where: { id: roomId },
          data: {
            status: "AWARDED",
            winningBidId,
            awardedBy: buyerId,
            awardedAt: new Date(),
          },
        });

        // Safely access supplier info with null check
        const winnerSupplierName =
          winningBid.supplier?.businessName || "A participant";

        // Notify all participants
        const notifications = room.invitations.map((inv) => ({
          userId: inv.supplierId,
          content:
            inv.supplierId === winningBid.supplierId
              ? `🎉 Congratulations! You have been awarded the contract for ${room.rfpId}`
              : `The bid room has been closed and awarded to ${winnerSupplierName}`,
          type: "BID_AWARDED",
          link: `/dashboard/bidroom/${roomId}`,
        }));

        await tx.notification.createMany({ data: notifications });

        return {
          room: updatedRoom,
          winningBid,
        };
      });

      try {
        io.to(`room_${roomId}`).emit("room_awarded", {
          roomId,
          winningBidId: result.winningBid.id,
          message:
            "The bid room has been closed and a winner has been selected",
        });
        result.room &&
          io.to(result.room.buyerId).emit("room_awarded", {
            roomId,
            winningBidId: result.winningBid.id,
          });
        io.to(result.winningBid.supplierId).emit("room_awarded", {
          roomId,
          winningBidId: result.winningBid.id,
          winner: true,
        });
        result.room &&
          io.to(result.room.buyerId).emit("new_notification", {
            userId: result.room.buyerId,
            type: "BID_AWARDED",
            content: "You awarded a bid room successfully.",
            link: `/dashboard/bidroom/${roomId}`,
          });
      } catch (socketError) {
        console.error("Failed to broadcast room award:", socketError);
      }

      await logActivity(
        `Awarded Bid Room ${roomId}`,
        "INFO",
        buyerId,
        "BidRoom.awardBid",
        { winningBidId },
        true,
      );

      return res
        .status(200)
        .json({ success: true, message: "Room awarded successfully" });
    } catch (err) {
      handleError("PATCH /rooms/:id/award", err, res);
    }
  },

  getRoomHistory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const history = await prisma.bidActivityLog.findMany({
        where: { bidRoomId: id },
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { firstName: true, lastName: true } } },
      });

      return res.status(200).json({ success: true, data: history });
    } catch (err) {
      handleError("GET /rooms/:id/history", err, res);
    }
  },

  getMyInvitations: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const invitations = await prisma.bidRoomInvitation.findMany({
        where: { supplierId: userId },
        include: {
          bidRoom: {
            include: {
              rfp: { select: { title: true, budget: true, currency: true } },
              bids: { orderBy: { amount: "asc" }, take: 1 },
            },
          },
        },
      });

      const enhancedInvitations = invitations.map((inv) => ({
        ...inv,
        bidRoom: {
          ...inv.bidRoom,
          status:
            new Date() >= new Date(inv.bidRoom.endTime) &&
            inv.bidRoom.status !== "AWARDED" &&
            inv.bidRoom.status !== "CANCELLED"
              ? "CLOSED"
              : inv.bidRoom.status,
        },
        currentLeadingBid: inv.bidRoom.bids[0] || null,
        timeRemaining: Math.max(
          0,
          new Date(inv.bidRoom.endTime).getTime() - new Date().getTime(),
        ),
      }));

      return res.status(200).json({ success: true, data: enhancedInvitations });
    } catch (err) {
      handleError("GET /rooms/my-invitations", err, res);
    }
  },

  startRoom: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buyerId = req.user?.id!;
      const { id: roomId } = req.params as { id: string };
      const io = getIO();

      const room = await prisma.bidRoom.findFirst({
        where: { id: roomId, buyerId },
        include: { invitations: true },
      });

      if (!room) {
        throw new Error("Room NOT_FOUND");
      }
      if (room.status !== "SCHEDULED") {
        throw new Error("Only scheduled rooms can be started");
      }
      const now = new Date();
      if (now > room.endTime) {
        throw new Error("Cannot start room after end time");
      }

      const updatedRoom = await prisma.bidRoom.update({
        where: { id: roomId },
        data: { status: "ACTIVE" },
        include: { invitations: true },
      });

      // Notify all invited suppliers
      const notifications = updatedRoom.invitations.map((inv) => ({
        userId: inv.supplierId,
        content: `The bid room is now active! Start placing your bids.`,
        type: "BID_ROOM_STARTED",
        link: `/dashboard/bidroom/${roomId}`,
      }));
      await prisma.notification.createMany({ data: notifications });

      // Socket broadcast
      io.to(`room_${roomId}`).emit("room_started", {
        roomId,
        startTime: updatedRoom.startTime,
        endTime: updatedRoom.endTime,
      });
      updatedRoom.invitations.forEach((inv) => {
        io.to(inv.supplierId).emit("new_notification", {
          userId: inv.supplierId,
          type: "BID_ROOM_STARTED",
          content: "The bid room is now active! Start placing your bids.",
          link: `/dashboard/bidroom/${roomId}`,
        });
      });

      return res
        .status(200)
        .json({ success: true, message: "Room started successfully" });
    } catch (err) {
      handleError("POST /rooms/:id/start", err, res);
    }
  },

  getMyRooms: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;

      const rooms = await prisma.bidRoom.findMany({
        where: { buyerId: userId },
        include: {
          rfp: { select: { title: true } },
          _count: {
            select: {
              invitations: { where: { status: "ACCEPTED" } },
              bids: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        data: rooms.map((room) => ({
          ...room,
          status:
            new Date() >= new Date(room.endTime) &&
            room.status !== "AWARDED" &&
            room.status !== "CANCELLED"
              ? "CLOSED"
              : room.status,
          acceptedInvitations: room._count.invitations,
          totalBids: room._count.bids,
        })),
      });
    } catch (err) {
      handleError("GET /rooms/my-rooms", err, res);
    }
  },

  cancelRoom: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buyerId = req.user?.id!;
      const { id: roomId } = req.params as { id: string };
      const io = getIO();

      const room = await prisma.bidRoom.findFirst({
        where: { id: roomId, buyerId },
        include: { invitations: true },
      });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room NOT_FOUND",
        });
      }

      if (room.status === "AWARDED" || room.status === "CANCELLED") {
        return res.status(400).json({
          success: false,
          message: "Room cannot be cancelled in current state",
        });
      }

      await prisma.$transaction([
        prisma.bidRoom.update({
          where: { id: roomId },
          data: { status: "CANCELLED" },
        }),
        prisma.notification.createMany({
          data: room.invitations.map((inv) => ({
            userId: inv.supplierId,
            content: "This bid room has been cancelled by the buyer.",
            type: "BID_ROOM_CANCELLED",
            link: `/dashboard/bidroom/${roomId}`,
          })),
        }),
      ]);

      io.to(`room_${roomId}`).emit("room_cancelled", {
        roomId,
      });
      room.invitations.forEach((inv) => {
        io.to(inv.supplierId).emit("new_notification", {
          userId: inv.supplierId,
          type: "BID_ROOM_CANCELLED",
          content: "This bid room has been cancelled by the buyer.",
          link: `/dashboard/bidroom/${roomId}`,
        });
      });

      return res.status(200).json({
        success: true,
        message: "Room cancelled successfully",
      });
    } catch (err) {
      handleError("PATCH /rooms/:id/cancel", err, res);
    }
  },
};
