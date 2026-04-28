import React, { useState } from "react";
import { Send, DollarSign } from "lucide-react";

interface BidInputProps {
  onSubmit: (amount: number) => Promise<void>;
  isSubmitting: boolean;
  minBid: number;
  maxBid?: number;
}

export const BidInput: React.FC<BidInputProps> = ({
  onSubmit,
  isSubmitting,
  minBid,
  maxBid,
}) => {
  const [amount, setAmount] = useState<number>(minBid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < minBid) {
      alert(`Minimum bid is $${minBid}`);
      return;
    }
    if (maxBid && amount > maxBid) {
      alert(`Maximum bid cannot exceed $${maxBid}`);
      return;
    }
    if (maxBid && amount === maxBid) {
      alert("Your bid must be lower than the current leading bid");
      return;
    }
    await onSubmit(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Bid Amount ($)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={minBid}
            max={maxBid}
            step={0.01}
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Minimum bid: ${minBid.toLocaleString()}
          {maxBid && ` | Must be lower than: $${maxBid.toLocaleString()}`}
        </p>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Place Bid
          </>
        )}
      </button>
    </form>
  );
};
