/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRoomDetail,
  updateBidAmount,
  joinRoom,
  startRoom,
} from "@/services/api/bidroom-api";
import { BidTimer } from "./BidTimer";
import { BidHistory } from "./BidHistory";
import { BidInput } from "./BidInput";
import { useCallback } from "react";
import {
  ArrowLeft,
  Trophy,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import { ParticipantsList } from "./ParticipantsList";

export const BidRoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const hasJoinedRef = React.useRef(false);

  const isBuyer = user?.role === "BUYER";
  const isSupplier = user?.role === "SUPPLIER";

  const fetchRoom = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await getRoomDetail(id!);
      setRoom(response.data);
    } catch (error) {
      console.error("Failed to load room:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoom(true);
  }, [fetchRoom]);

  useEffect(() => {
    // Only attempt to join and setup sockets if we have a connection and room ID
    if (!socket || !id) return;

    const performJoin = async () => {
      if (hasJoinedRef.current || !socket.connected || !socket.id) return;
      try {
        await joinRoom(id!, socket.id);
        hasJoinedRef.current = true;
      } catch (error) {
        console.error("Failed to join room participant list:", error);
      }
    };

    performJoin();
    socket.on("connect", performJoin);

    // Join the socket room for real-time updates
    socket.on("new_bid", (data) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        const nextBids = prev.bids ? [...prev.bids] : [];
        return {
          ...prev,
          currentLeadingBid:
            prev.biddingType === "PUBLIC" ? data : prev.currentLeadingBid,
          totalBids: (prev.totalBids || 0) + 1,
          bids: nextBids,
        };
      });
    });

    socket.on("room_awarded", () => {
      fetchRoom(false);
    });

    socket.on("room_started", () => {
      fetchRoom(false);
    });
    socket.on("room_cancelled", () => {
      fetchRoom(false);
    });
    socket.on("invitation_updated", () => {
      fetchRoom(false);
    });

    return () => {
      socket.off("connect", performJoin);
      socket.off("new_bid");
      socket.off("room_awarded");
      socket.off("room_started");
      socket.off("room_cancelled");
      socket.off("invitation_updated");
      if (socket.connected) {
        socket.emit("leave_bid_room", id);
      }
    };
  }, [socket, id]);

  useEffect(() => {
    hasJoinedRef.current = false;
  }, [id]);

  const handlePlaceBid = async (amount: number) => {
    setSubmitting(true);
    try {
      await updateBidAmount(id!, { amount });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAward = async () => {
    if (
      !confirm(
        "Are you sure you want to award this bid to the current leading bidder?",
      )
    )
      return;
    setSubmitting(true);
    try {
      if (!room?.currentLeadingBid?.id) {
        alert("No leading bid available to award");
        return;
      }
      await awardBidById(id!, room.currentLeadingBid.id);
      fetchRoom(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to award bid");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRoom = async () => {
    if (!confirm("Start the bid room? Suppliers will be notified.")) return;
    setSubmitting(true);
    try {
      await startRoom(id!);
      fetchRoom(false); // Re-fetch to update status to ACTIVE
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to start room");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-foreground">Bid room not found</p>
      </div>
    );
  }

  // Logical checks for rendering UI components
  const canBid = isSupplier && room.status === "ACTIVE";
  const canAward =
    isBuyer &&
    room.status === "ACTIVE" &&
    (room.bids?.length > 0 || room.currentLeadingBid);
  const canStart = isBuyer && room.status === "SCHEDULED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <button
          onClick={() => navigate("/dashboard/bidroom")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bid Rooms
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {room.rfp?.title}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  room.status === "ACTIVE"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : room.status === "SCHEDULED"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                }`}
              >
                {room.status}
              </span>
              <span className="text-sm text-muted-foreground">
                {room.biddingType} Bidding
              </span>
            </div>
          </div>
          <BidTimer endTime={room.endTime} onEnd={fetchRoom} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">
              Current Leading Bid
            </span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {room.currentLeadingBid
              ? `${room.rfp?.currency || "$"} ${Number(room.currentLeadingBid.amount).toLocaleString()}`
              : "No bids yet"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">
              Total Bids
            </span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {room.totalBids || 0}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">
              Participants
            </span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {room.participantsCount || 0}
          </p>
        </div>
      </div>

      {/* Main Bidding Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Buyer Actions: Start Room */}
          {canStart && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 text-center">
              <p className="text-blue-600 mb-4 font-medium">
                This room is scheduled. Start it to begin bidding.
              </p>
              <button
                onClick={handleStartRoom}
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {submitting ? "Starting..." : "Start Bid Room"}
              </button>
            </div>
          )}

          {/* Buyer Actions: Award Contract */}
          {canAward && (
            <div className="bg-card border-2 border-yellow-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-foreground">
                  Award Contract
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Review the bids and award the contract to the leading supplier.
              </p>
              <button
                onClick={handleAward}
                disabled={submitting}
                className="w-full py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                Award to Leading Bidder
              </button>
            </div>
          )}

          {/* Supplier Actions: Place Bid */}
          {canBid && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Place Your Bid
              </h3>
              <BidInput
                onSubmit={handlePlaceBid}
                isSubmitting={submitting}
                minBid={0}
                maxBid={
                  room.biddingType === "PUBLIC"
                    ? Number(room.currentLeadingBid?.amount || room.rfp?.budget)
                    : Number(room.rfp?.budget)
                }
              />
            </div>
          )}

          {/* Status feedback for Supplier before Start */}
          {isSupplier && room.status === "SCHEDULED" && (
            <div className="bg-muted/50 border border-border rounded-xl p-8 text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">
                Waiting for Buyer to Start
              </h3>
              <p className="text-muted-foreground">
                The bidding input will appear here once the room goes live.
              </p>
            </div>
          )}

          {/* Bid History Component */}
          <BidHistory
            bids={room.bids || []}
            currentHighestBid={room.currentLeadingBid}
          />
        </div>

        {/* Sidebar: Participants List */}
        <div className="space-y-6">
          <ParticipantsList
            participants={
              Array.isArray(room.participants) ? room.participants : []
            }
          />

          {/* RFP Quick Reference */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold mb-4">RFP Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{room.rfp?.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium">
                  {room.rfp?.currency}{" "}
                  {Number(room.rfp?.budget).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
