/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyInvitations, getMyRooms } from "@/services/api/bidroom-api";
import { Plus, Inbox, Clock, Trophy, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BidRoomCard } from "./BidroomCard";

export const BidRoomList: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isBuyer = user?.role === "BUYER";

  const fetchData = async () => {
    try {
      setLoading(true);
      // Logic: If Buyer, get rooms they created. If Supplier, get invitations.
      const response = isBuyer ? await getMyRooms() : await getMyInvitations();

      // Normalization: The BidRoomCard expects an 'invitation' object with a 'bidRoom' inside.
      // We wrap the Buyer's rooms to match that structure so the card component works for both.
      const normalizedData = isBuyer
        ? response.data.map((room: any) => ({
            id: room.id,
            status: "ACCEPTED",
            bidRoom: room,
          }))
        : response.data;

      setData(normalizedData);
    } catch (error) {
      console.error("Failed to load bid room data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isBuyer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter Logic
  // 1. Pending Invitations (Only relevant for Suppliers)
  const pendingInvitations = data.filter((item) => item.status === "PENDING");

  // 2. Active Rooms (Session is live)
  const activeRooms = data.filter(
    (item) =>
      (isBuyer || item.status === "ACCEPTED") &&
      item.bidRoom?.status === "ACTIVE",
  );

  // 3. Upcoming Rooms (Scheduled but not started)
  const scheduledRooms = data.filter(
    (item) =>
      (isBuyer || item.status === "ACCEPTED") &&
      item.bidRoom?.status === "SCHEDULED",
  );

  // 4. Past Rooms (Finished or Awarded)
  const pastRooms = data.filter((item) =>
    ["CLOSED", "AWARDED", "CANCELLED"].includes(item.bidRoom?.status),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bid Rooms</h1>
          <p className="text-muted-foreground mt-1">
            {isBuyer
              ? "Manage and monitor your live procurement auctions"
              : "Participate in real-time bidding events"}
          </p>
        </div>
        {isBuyer && (
          <Link
            to="/dashboard/bidroom/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Bid Room
          </Link>
        )}
      </div>

      {/* Supplier-Only Section: Pending Invites */}
      {!isBuyer && pendingInvitations.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground text-amber-600">
              New Invitations
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvitations.map((inv) => (
              <BidRoomCard key={inv.id} invitation={inv} onUpdate={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* Main Categories */}
      {[
        {
          title: "Active Bidding",
          icon: <Clock className="text-green-500" />,
          data: activeRooms,
        },
        {
          title: "Upcoming",
          icon: <Clock className="text-blue-500" />,
          data: scheduledRooms,
        },
        {
          title: "History",
          icon: <Trophy className="text-purple-500" />,
          data: pastRooms,
        },
      ].map(
        (section, idx) =>
          section.data.length > 0 && (
            <div key={idx}>
              <div className="flex items-center gap-2 mb-4">
                {section.icon}
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {section.data.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {section.data.map((item) => (
                  <BidRoomCard
                    key={item.id}
                    invitation={item}
                    onUpdate={fetchData}
                    isOwner={isBuyer}
                  />
                ))}
              </div>
            </div>
          ),
      )}

      {/* Empty State */}
      {data.length === 0 && (
        <div className="bg-card border border-border border-dashed rounded-xl p-20 text-center">
          <Inbox className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-foreground font-medium mb-1">No bid rooms found</p>
          <p className="text-sm text-muted-foreground">
            {isBuyer
              ? "Create a new bid room to start receiving live offers."
              : "You don't have any bidding invitations yet."}
          </p>
        </div>
      )}
    </div>
  );
};
