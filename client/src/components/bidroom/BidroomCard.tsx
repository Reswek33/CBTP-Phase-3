/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Play,
  XCircle,
  ExternalLink,
  CheckCircle2,
  X,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import {
  updateInvitationStatus,
  startRoom,
  cancelRoom,
} from "@/services/api/bidroom-api";

interface BidRoomCardProps {
  invitation: any; // Contains status and bidRoom object
  onUpdate: () => void;
  isOwner?: boolean;
}

export const BidRoomCard: React.FC<BidRoomCardProps> = ({
  invitation,
  onUpdate,
  isOwner = false,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const room = invitation.bidRoom;

  // Handler for Supplier Invitation (Accept/Decline)
  const handleInvitation = async (status: "ACCEPTED" | "DECLINED") => {
    setActionLoading(true);
    try {
      await updateInvitationStatus(invitation.id, status);
      onUpdate();
    } catch (error) {
      console.error("Failed to update invitation:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for Buyer Actions (Start/Cancel)
  const handleStartRoom = async () => {
    if (
      !window.confirm(
        "Are you sure you want to start this bidding session now?",
      )
    )
      return;
    setActionLoading(true);
    try {
      await startRoom(room.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to start room:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRoom = async () => {
    const reason = window.prompt("Reason for cancellation (optional):");
    if (reason === null) return; // User clicked cancel on prompt

    setActionLoading(true);
    try {
      await cancelRoom(room.id, reason);
      onUpdate();
    } catch (error) {
      console.error("Failed to cancel room:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = invitation.status === "PENDING";
  const isActive = room.status === "ACTIVE";
  const isScheduled = room.status === "SCHEDULED";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md mb-2 inline-block ${
                isActive
                  ? "bg-green-500/10 text-green-500"
                  : isScheduled
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {room.status}
            </span>
            <h3 className="text-lg font-bold text-foreground line-clamp-1">
              {room.rfp?.title || "Project Bidding Session"}
            </h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {invitation.bidRoom?.biddingType}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              Starts: {format(new Date(room.startTime), "MMM dd, yyyy HH:mm")}
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Clock className="w-4 h-4" />
            <span>
              Ends: {format(new Date(room.endTime), "MMM dd, yyyy HH:mm")}
            </span>
          </div>
        </div>

        {/* Action Logic for Suppliers (Invitations) */}
        {!isOwner && isPending && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleInvitation("DECLINED")}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Decline
            </button>
            <button
              onClick={() => handleInvitation("ACCEPTED")}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Accept
            </button>
          </div>
        )}

        {/* Join Logic for Accepted Suppliers */}
        {!isOwner &&
          !isPending &&
          (room.status === "ACTIVE" || room.status === "SCHEDULED") && (
            <Link
              to={`/dashboard/bidroom/${room.id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Enter Room
            </Link>
          )}

        {/* Action Logic for Buyers (Owners) */}
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            {isScheduled && (
              <button
                onClick={handleStartRoom}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Start Now
              </button>
            )}

            {/* Enter room button for owner to monitor */}
            {(isActive || isScheduled) && (
              <Link
                to={`/dashboard/bidroom/${room.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Users className="w-4 h-4" />{" "}
                {isActive ? "Monitor Live" : "View Details"}
              </Link>
            )}

            {(isActive || isScheduled) && (
              <button
                onClick={handleCancelRoom}
                disabled={actionLoading}
                className="px-3 py-2 border border-border rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                title="Cancel Room"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Completed Status */}
        {["CLOSED", "AWARDED"].includes(room.status) && (
          <Link
            to={`/dashboard/bidroom/${room.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <Trophy className="w-4 h-4" /> View Results
          </Link>
        )}
      </div>
    </div>
  );
};
