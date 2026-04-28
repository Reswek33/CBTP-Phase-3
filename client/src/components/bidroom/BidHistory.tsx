import React from "react";
import { History, Trophy, User } from "lucide-react";

interface Bid {
  id: string;
  amount: number;
  supplierId: string;
  createdAt: string;
  supplier?: {
    businessName: string;
  };
}

interface BidHistoryProps {
  bids: Bid[];
  currentHighestBid?: Bid;
}

export const BidHistory: React.FC<BidHistoryProps> = ({
  bids,
  currentHighestBid,
}) => {
  if (!bids || bids.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No bids placed yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Be the first to place a bid!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="border-b border-border p-4 bg-muted/30">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Bid History
        </h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {bids.map((bid, index) => {
          const isHighest = currentHighestBid?.id === bid.id;
          return (
            <div
              key={bid.id}
              className={`p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                isHighest ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isHighest && <Trophy className="w-5 h-5 text-yellow-500" />}
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {bid.supplier?.businessName || `Bidder ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    ${bid.amount.toLocaleString()}
                  </p>
                  {isHighest && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Highest Bid
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
