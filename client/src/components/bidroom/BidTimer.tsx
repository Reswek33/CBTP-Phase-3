import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface BidTimerProps {
  endTime: string;
  onEnd?: () => void;
}

export const BidTimer: React.FC<BidTimerProps> = ({ endTime, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    let hasCalledEnd = false;

    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft("Ended");
        if (!hasCalledEnd) {
          onEnd?.();
          hasCalledEnd = true;
        }
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (minutes < 60) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      if (end - now <= 0) {
        calculateTimeLeft();
        clearInterval(timer);
      } else {
        calculateTimeLeft();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  const isUrgent = timeLeft.includes("m") && parseInt(timeLeft) < 5;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}
    >
      <Clock className="w-4 h-4" />
      <span className="font-mono font-bold">{timeLeft}</span>
    </div>
  );
};
