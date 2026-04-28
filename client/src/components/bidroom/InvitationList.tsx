/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { updateInvitationStatus } from "@/services/api/bidroom-api";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface Invitation {
  id: string;
  status: string;
  bidRoom: {
    id: string;
    startTime: string;
    endTime: string;
    biddingType: string;
    rfp: {
      title: string;
      budget: number;
    };
  };
  timeRemaining: number;
}

interface InvitationsListProps {
  invitations: Invitation[];
  onUpdate: () => void;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({
  invitations,
  onUpdate,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUpdateStatus = async (
    invitationId: string,
    status: "ACCEPTED" | "DECLINED",
  ) => {
    setProcessingId(invitationId);
    try {
      await updateInvitationStatus(invitationId, { status });
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (invitations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {inv.bidRoom.rfp.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Starts: {new Date(inv.bidRoom.startTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Ends: {new Date(inv.bidRoom.endTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Time left: {formatTimeRemaining(inv.timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateStatus(inv.id, "DECLINED")}
                disabled={processingId === inv.id}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={() => handleUpdateStatus(inv.id, "ACCEPTED")}
                disabled={processingId === inv.id}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {processingId === inv.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Accept
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
