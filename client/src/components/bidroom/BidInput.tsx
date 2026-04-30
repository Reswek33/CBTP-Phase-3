/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Send, DollarSign, AlertCircle, X, CheckCircle } from "lucide-react";

interface BidInputProps {
  onSubmit: (amount: number) => Promise<void>;
  isSubmitting: boolean;
  minBid: number;
  maxBid?: number;
}

// Toast/Notification Component
const Toast: React.FC<{
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
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
        return <AlertCircle className="w-4 h-4" />;
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

export const BidInput: React.FC<BidInputProps> = ({
  onSubmit,
  isSubmitting,
  minBid,
  maxBid,
}) => {
  const [amount, setAmount] = useState<number>(minBid);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (amount < minBid) {
      setToast({
        message: `Minimum bid is $${minBid.toLocaleString()}`,
        type: "warning",
      });
      return;
    }

    if (maxBid && amount > maxBid) {
      setToast({
        message: `Bid cannot exceed $${maxBid.toLocaleString()}`,
        type: "warning",
      });
      return;
    }

    if (maxBid && amount === maxBid) {
      setToast({
        message: "Your bid must be lower than the current leading bid",
        type: "warning",
      });
      return;
    }

    try {
      await onSubmit(amount);
      setToast({
        message: `Bid of $${amount.toLocaleString()} placed successfully!`,
        type: "success",
      });

      // Clear success toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || "Failed to place bid",
        type: "error",
      });
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">
              Minimum bid:{" "}
              <span className="font-medium text-primary">
                ${minBid.toLocaleString()}
              </span>
            </p>
            {maxBid && (
              <p className="text-xs text-muted-foreground">
                Current leading:{" "}
                <span className="font-medium text-destructive">
                  ${maxBid.toLocaleString()}
                </span>
              </p>
            )}
          </div>
          {maxBid && (
            <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Must be lower than the current leading bid
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Placing Bid...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Place Bid
            </>
          )}
        </button>
      </form>

      <style>{`
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
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
