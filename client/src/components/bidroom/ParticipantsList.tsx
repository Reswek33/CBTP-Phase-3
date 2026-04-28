import React from "react";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

interface Participant {
  id: string;
  supplierId: string;
  status: string;
  supplier?: {
    businessName: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface ParticipantsListProps {
  participants: Participant[];
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
}) => {
  const acceptedParticipants = participants.filter(
    (p) => p.status === "ACCEPTED",
  );
  const pendingParticipants = participants.filter(
    (p) => p.status === "PENDING",
  );
  const declinedParticipants = participants.filter(
    (p) => p.status === "DECLINED",
  );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="border-b border-border p-4 bg-muted/30">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Participants ({acceptedParticipants.length})
        </h3>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Accepted Participants */}
        {acceptedParticipants.length > 0 && (
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-2">
              ACCEPTED
            </p>
            <div className="space-y-2">
              {acceptedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-green-500/5"
                >
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {participant.supplier?.businessName || "Unknown Supplier"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined the bidding room
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Participants */}
        {pendingParticipants.length > 0 && (
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-2">
              PENDING INVITES
            </p>
            <div className="space-y-2">
              {pendingParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/5"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {participant.supplier?.businessName || "Unknown Supplier"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Awaiting response
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Declined Participants */}
        {declinedParticipants.length > 0 && (
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-2">
              DECLINED
            </p>
            <div className="space-y-2">
              {declinedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5"
                >
                  <UserX className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {participant.supplier?.businessName || "Unknown Supplier"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Declined invitation
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
