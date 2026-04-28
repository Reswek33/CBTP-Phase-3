import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";
import { bidRoomController } from "./bidroom.controller.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticateUser);

// ============================================
// SPECIFIC ROUTES (no dynamic parameters)
// ============================================

// Supplier routes - invitations
router.get(
  "/my-invitations",
  requireRole(["SUPPLIER"]),
  bidRoomController.getMyInvitations,
);

// Buyer routes - rooms
router.get("/my-rooms", requireRole(["BUYER"]), bidRoomController.getMyRooms);

// Supplier routes - update invitation status
router.patch(
  "/invitations/:id",
  requireRole(["SUPPLIER"]),
  bidRoomController.updateInvitationStatus,
);

// Buyer routes - create room
router.post("/create", requireRole(["BUYER"]), bidRoomController.createRoom);

// ============================================
// ROUTES WITH PARAMETERS (dynamic)
// ============================================

// Join room (specific supplier action)
router.post(
  "/:roomId/join",
  requireRole(["SUPPLIER", "BUYER"]),
  bidRoomController.joinRoom,
);

// Start room (buyer action)
router.post("/:id/start", requireRole(["BUYER"]), bidRoomController.startRoom);

// Award bid (buyer action)
router.patch("/:id/award", requireRole(["BUYER"]), bidRoomController.awardBid);

// Cancel room (buyer action)
router.patch(
  "/:id/cancel",
  requireRole(["BUYER"]),
  bidRoomController.cancelRoom,
);

// Place bid (supplier action)
router.post(
  "/:id/bids",
  requireRole(["SUPPLIER"]),
  bidRoomController.updateBidAmount,
);

// Get room history (accessible by participants)
router.get(
  "/:id/history",
  requireRole(["BUYER", "SUPPLIER", "ADMIN", "SUPERADMIN"]),
  bidRoomController.getRoomHistory,
);

// Get room detail (accessible by participants - MUST BE LAST)
router.get(
  "/:id",
  requireRole(["BUYER", "SUPPLIER", "ADMIN", "SUPERADMIN"]),
  bidRoomController.getRoomDetail,
);

export default router;
