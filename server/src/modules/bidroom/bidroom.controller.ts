import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import z from "zod";
import { prisma } from "../../config/prisma.js";
import type { InvitationStatus } from "../../../generated/prisma/index.js";
import { logActivity } from "../../shared/utils/logger.js";
import { getIO } from "../../config/socket.js";

const roomCreateInputSchema = z.object({
  rfpId: z.uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  biddingType: z.enum(["PUBLIC", "CLOSED"]),
  invitedSupplierIds: z.array(z.uuid()),
});

const invitationUpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]),
});

const bidAmountInputSchema = z.object({
  amount: z.transform((str) => Number(str)),
});

const awardInputSchema = z.object({
  winningBidId: z.uuid(),
});

export const bidRoomController = {
  createRoom: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buyerId = req.user?.id!;
      const { rfpId, startTime, endTime, biddingType, invitedSupplierIds } =
        roomCreateInputSchema.parse(req.body);

      const bidRoom = await prisma.$transaction(async (tx) => {
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

        // Create Notifications for Suppliers
        const notifications = invitedSupplierIds.map((id) => ({
          userId: id,
          content: `You have been invited to a ${biddingType} Bid Room for RFP: ${rfpId}`,
          type: "BID_INVITATION",
          link: `/dashboard/bid-rooms/${room.id}`,
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

  jointRoom: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { roomId } = req.params as { roomId: string };
      const io = getIO();
      console.log(userId, "Joinded");

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

      if (!isBuyer && !isInvitedSupplier && req.user?.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Access denied to this room",
        });
      }

      const participantsCount = bidroom.invitations.filter(
        (i) => i.status === "ACCEPTED",
      ).length;
      const responseModel = {
        id: bidroom.id,
        status: bidroom.status,
        startTime: bidroom.startTime,
        endTime: bidroom.endTime,
        biddingType: bidroom.biddingType,
        currentLeadingBid:
          bidroom.biddingType === "PUBLIC" ? bidroom.bids[0] : null,
        totalBids: bidroom.bids.length,
        participants:
          bidroom.biddingType === "PUBLIC"
            ? participantsCount
            : "Hidden (Closed Bidding)",
        rfp: bidroom.rfp,
        bids: bidroom.bids,
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
          io.to(`user_${result.currentBest.supplierId}`).emit("outbid", {
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

      const invitation = await prisma.bidRoomInvitation.update({
        where: { id: id, supplierId: userId },
        data: { status: status as InvitationStatus },
        include: { bidRoom: true },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: "Invitation NOT_FOUND",
        });
      }

      if (invitation.status === "ACCEPTED") {
        const now = new Date();
        if (now > invitation.bidRoom.endTime) {
          return res.status(400).json({
            success: false,
            message: "Cannot accept invitation - bidding period has ended",
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Invitation is ${invitation.status}`,
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
        const room = await tx.bidRoom.update({
          where: { id: roomId, buyerId },
          data: {
            status: "AWARDED",
            winningBidId,
            awardedBy: buyerId,
            awardedAt: new Date(),
          },
          include: {
            invitations: true,
            bids: {
              where: { id: winningBidId },
              include: { supplier: { select: { businessName: true } } },
            },
          },
        });
        if (!room.bids || !Array.isArray(room.bids) || room.bids.length === 0) {
          throw new Error("Winning bid not found");
        }

        const winningBid = room.bids[0];
        if (!winningBid) {
          throw new Error("Winning bid not found");
        }

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
          link: `/dashboard/bid-rooms/${roomId}`,
        }));

        await tx.notification.createMany({ data: notifications });

        return room;
      });

      try {
        io.to(`room_${roomId}`).emit("room_awarded", {
          roomId,
          message:
            "The bid room has been closed and a winner has been selected",
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

      const room = await prisma.bidRoom.update({
        where: { id: roomId, buyerId },
        data: { status: "ACTIVE" },
        include: { invitations: true },
      });

      // Notify all invited suppliers
      const notifications = room.invitations.map((inv) => ({
        userId: inv.supplierId,
        content: `The bid room is now active! Start placing your bids.`,
        type: "BID_ROOM_STARTED",
        link: `/dashboard/bid-rooms/${roomId}`,
      }));
      await prisma.notification.createMany({ data: notifications });

      // Socket broadcast
      io.to(`room_${roomId}`).emit("room_started", {
        roomId,
        startTime: room.startTime,
        endTime: room.endTime,
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
          acceptedInvitations: room._count.invitations,
          totalBids: room._count.bids,
        })),
      });
    } catch (err) {
      handleError("GET /rooms/my-rooms", err, res);
    }
  },
};
