import React from "react";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = "rect" }) => {
  const baseClass = "bg-muted relative overflow-hidden";
  const variantClass = variant === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className={`${baseClass} ${variantClass} ${className}`}>
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
      />
    </div>
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton className="h-[400px]" />
      <Skeleton className="h-[400px]" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton variant="circle" className="w-12 h-12" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <Skeleton className="h-20 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);
