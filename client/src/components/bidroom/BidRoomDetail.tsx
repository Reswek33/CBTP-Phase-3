/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRoomDetail,
  updateBidAmount,
  joinRoom,
  startRoom,
  awardBidById,
} from "@/services/api/bidroom-api";
import { BidTimer } from "./BidTimer";
import { BidHistory } from "./BidHistory";
import { BidInput } from "./BidInput";
import {
  ArrowLeft,
  Trophy,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { ParticipantsList } from "./ParticipantsList";

// Toast/Notification Component
const Toast: React.FC<{
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-500";
      case "error":
        return "bg-destructive/10 border-destructive/20 text-destructive";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 text-amber-500";
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getStyles()}`}
      >
        {getIcon()}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  type?: "warning" | "success" | "danger";
}> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isSubmitting = false,
  type = "warning",
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          button: "bg-green-500 hover:bg-green-600",
        };
      case "danger":
        return {
          icon: <AlertCircle className="w-12 h-12 text-destructive" />,
          button: "bg-destructive hover:bg-destructive/90",
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
          button: "bg-amber-500 hover:bg-amber-600",
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center text-center">
          {styles.icon}
          <h3 className="text-xl font-bold text-foreground mt-4 mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Modal Component
const SuccessModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}> = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground">{message}</p>
          <div className="mt-4 w-16 h-1 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const BidRoomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    handler: () => Promise<void>;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const hasJoinedRef = React.useRef(false);

  const isBuyer = user?.role === "BUYER";
  const isSupplier = user?.role === "SUPPLIER";

  const fetchRoom = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const response = await getRoomDetail(id!);
        setRoom(response.data);
      } catch (error) {
        console.error("Failed to load room:", error);
        setToast({ message: "Failed to load room details", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchRoom(true);
  }, [fetchRoom]);

  useEffect(() => {
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
      setToast({
        message: "Room has been awarded to the winner",
        type: "success",
      });
    });

    socket.on("room_started", () => {
      fetchRoom(false);
      setToast({
        message: "Bidding has started! Place your bids now.",
        type: "success",
      });
    });

    socket.on("room_cancelled", () => {
      fetchRoom(false);
      setToast({ message: "Room has been cancelled", type: "warning" });
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
  }, [socket, id, fetchRoom]);

  useEffect(() => {
    hasJoinedRef.current = false;
  }, [id]);

  const handlePlaceBid = async (amount: number) => {
    setSubmitting(true);
    try {
      await updateBidAmount(id!, { amount });
      setToast({
        message: `Bid of $${amount.toLocaleString()} placed successfully!`,
        type: "success",
      });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || "Failed to place bid",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAward = async () => {
    if (!room?.currentLeadingBid?.id) {
      setToast({
        message: "No leading bid available to award",
        type: "warning",
      });
      return;
    }
    setSubmitting(true);
    try {
      await awardBidById(id!, room.currentLeadingBid.id);
      setShowConfirmModal(false);
      setSuccessMessage({
        title: "Contract Awarded!",
        message:
          "The contract has been successfully awarded to the leading bidder.",
      });
      setShowSuccessModal(true);
      fetchRoom(false);

      setTimeout(() => {
        navigate("/dashboard/bidroom");
      }, 3000);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || "Failed to award bid",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRoom = async () => {
    setSubmitting(true);
    try {
      await startRoom(id!);
      setShowConfirmModal(false);
      setSuccessMessage({
        title: "Room Started!",
        message:
          "The bid room is now active. Suppliers can start placing bids.",
      });
      setShowSuccessModal(true);
      fetchRoom(false);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || "Failed to start room",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirmModal = (type: string, handler: () => Promise<void>) => {
    setConfirmAction({ type, handler });
    setShowConfirmModal(true);
  };

  const getConfirmModalProps = () => {
    if (!confirmAction)
      return {
        title: "",
        message: "",
        confirmText: "",
        type: "warning" as const,
      };

    switch (confirmAction.type) {
      case "start":
        return {
          title: "Start Bid Room",
          message:
            "Starting the bid room will notify all invited suppliers. Bidding will begin immediately. Are you sure?",
          confirmText: "Yes, Start Room",
          type: "success" as const,
        };
      case "award":
        return {
          title: "Award Contract",
          message: `Are you sure you want to award the contract to the current leading bidder ($${room?.currentLeadingBid?.amount?.toLocaleString()})? This action cannot be undone.`,
          confirmText: "Yes, Award Contract",
          type: "danger" as const,
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "",
          type: "warning" as const,
        };
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

  const canBid = isSupplier && room.status === "ACTIVE";
  const canAward =
    isBuyer &&
    room.status === "ACTIVE" &&
    (room.bids?.length > 0 || room.currentLeadingBid);
  const canStart = isBuyer && room.status === "SCHEDULED";

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={getConfirmModalProps().title}
          message={getConfirmModalProps().message}
          confirmText={getConfirmModalProps().confirmText}
          cancelText="Cancel"
          onConfirm={confirmAction.handler}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
          isSubmitting={submitting}
          type={getConfirmModalProps().type}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
      />

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
                onClick={() => openConfirmModal("start", handleStartRoom)}
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
                onClick={() => openConfirmModal("award", handleAward)}
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

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .animate-bounce {
          animation: bounce 0.5s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
