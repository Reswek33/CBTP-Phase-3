/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { getDisputes, resolveDispute } from "../../services/api/admin-api";
import {
  ShieldAlert,
  Search,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  User,
  Gavel,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";

interface Dispute {
  updatedAt: string;
  id: string;
  reporterId: string;
  reportedId: string;
  rfpId?: string;
  bidId?: string;
  reason: string;
  description: string;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "CANCELLED";
  resolution?: string;
  createdAt: string;
  reporter: { firstName: string; lastName: string; email: string };
  reported: { firstName: string; lastName: string; email: string };
  rfp?: { title: string };
  bid?: { proposal: string };
  resolvedBy?: { firstName: string; lastName: string };
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
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <ShieldAlert className="w-4 h-4" />;
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
}> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
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
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

const Disputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [resolvingStatus, setResolvingStatus] = useState<
    "RESOLVED" | "CANCELLED"
  >("RESOLVED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, [filterStatus]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await getDisputes(
        filterStatus === "ALL" ? undefined : filterStatus,
      );
      setDisputes(res.data);
    } catch (err) {
      console.error("Failed to fetch disputes", err);
      setToast({ message: "Failed to fetch disputes", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolutionText) return;
    setIsSubmitting(true);
    try {
      await resolveDispute(selectedDispute.id, {
        status: resolvingStatus,
        resolution: resolutionText,
      });

      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setResolutionText("");
      fetchDisputes();

      setTimeout(() => {
        setSelectedDispute(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to resolve dispute", err);
      setToast({
        message: `Failed to ${resolvingStatus === "RESOLVED" ? "resolve" : "dismiss"} dispute`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "INVESTIGATING":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "RESOLVED":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "CANCELLED":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredDisputes = disputes.filter(
    (d) =>
      d.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reporter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reported.firstName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" /> Dispute
              Resolution Portal
            </h2>
            <p className="text-muted-foreground text-sm">
              Mediate and resolve reports between users
            </p>
          </div>
          <button
            onClick={fetchDisputes}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-border"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* List Side */}
        <div className="lg:col-span-1 w-full lg:w-1/3 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {loading ? (
              <div className="p-10 text-center animate-pulse text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading Disputes...
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground">
                No disputes found
              </div>
            ) : (
              filteredDisputes.map((dispute) => (
                <button
                  key={dispute.id}
                  onClick={() => setSelectedDispute(dispute)}
                  className={`w-full text-left p-4 border border-border rounded-xl transition-all hover:bg-muted/50 ${selectedDispute?.id === dispute.id ? "ring-2 ring-primary bg-primary/5" : "bg-card"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(dispute.status)}`}
                    >
                      {dispute.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm truncate">
                    {dispute.reason}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                      {dispute.reporter.firstName.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {dispute.reporter.firstName} vs{" "}
                      {dispute.reported.firstName}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail Side */}
        <div className="lg:col-span-2 flex-1">
          {selectedDispute ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedDispute.reason}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dispute ID: {selectedDispute.id}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedDispute.status)}`}
                  >
                    {selectedDispute.status}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-muted/20 rounded-xl border border-border">
                    <p className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
                      <User className="w-3 h-3" /> REPORTER (PLAINTIFF)
                    </p>
                    <p className="font-bold">
                      {selectedDispute.reporter.firstName}{" "}
                      {selectedDispute.reporter.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDispute.reporter.email}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl border border-border">
                    <p className="text-xs font-mono text-muted-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> REPORTED (DEFENDANT)
                    </p>
                    <p className="font-bold">
                      {selectedDispute.reported.firstName}{" "}
                      {selectedDispute.reported.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedDispute.reported.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Dispute
                    Description
                  </h4>
                  <div className="p-4 bg-background border border-border rounded-xl text-sm leading-relaxed italic text-muted-foreground">
                    "{selectedDispute.description}"
                  </div>
                </div>

                {(selectedDispute.rfp || selectedDispute.bid) && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                    <h4 className="text-xs font-bold uppercase text-primary mb-2 flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" /> Linked Entity
                    </h4>
                    {selectedDispute.rfp && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          RFP:{" "}
                          <span className="font-bold">
                            {selectedDispute.rfp.title}
                          </span>
                        </span>
                        <button className="text-[10px] font-bold text-primary hover:underline">
                          VIEW RFP
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedDispute.status !== "RESOLVED" &&
                selectedDispute.status !== "CANCELLED" ? (
                  <div className="pt-6 border-t border-border space-y-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-primary" /> Admin
                      Resolution
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setResolvingStatus("RESOLVED")}
                        className={`py-3 rounded-xl font-bold text-sm transition-all border ${resolvingStatus === "RESOLVED" ? "bg-green-500 text-white border-green-600" : "bg-card text-muted-foreground border-border"}`}
                      >
                        Resolve Dispute
                      </button>
                      <button
                        onClick={() => setResolvingStatus("CANCELLED")}
                        className={`py-3 rounded-xl font-bold text-sm transition-all border ${resolvingStatus === "CANCELLED" ? "bg-red-500 text-white border-red-600" : "bg-card text-muted-foreground border-border"}`}
                      >
                        Cancel / Dismiss
                      </button>
                    </div>
                    <textarea
                      placeholder="Enter the official resolution details..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="w-full p-4 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary min-h-[120px] text-sm"
                    />
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!resolutionText}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      Review & Submit
                    </button>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-border space-y-4">
                    <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
                      <h4 className="font-bold text-green-600 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5" /> Final Resolution
                      </h4>
                      <p className="text-sm text-green-700/80 leading-relaxed">
                        {selectedDispute.resolution}
                      </p>
                      <div className="mt-4 pt-4 border-t border-green-500/10 flex items-center justify-between text-[10px] text-green-600/60 font-mono">
                        <span>
                          RESOLVED_BY: {selectedDispute.resolvedBy?.firstName}{" "}
                          {selectedDispute.resolvedBy?.lastName}
                        </span>
                        <span>
                          DATE:{" "}
                          {new Date(
                            selectedDispute.updatedAt ||
                              selectedDispute.createdAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/5">
              <Gavel className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-lg font-bold">No Dispute Selected</h3>
              <p className="text-sm max-w-xs mt-2">
                Select a dispute from the list to review evidence and issue a
                resolution.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Resolution"
        message={`Are you sure you want to ${resolvingStatus === "RESOLVED" ? "resolve" : "dismiss"} this dispute? This action cannot be undone.`}
        confirmText={
          resolvingStatus === "RESOLVED" ? "Yes, Resolve" : "Yes, Dismiss"
        }
        cancelText="Cancel"
        onConfirm={handleResolve}
        onCancel={() => setShowConfirmModal(false)}
        isSubmitting={isSubmitting}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title={`Dispute ${resolvingStatus === "RESOLVED" ? "Resolved" : "Dismissed"}`}
        message={`The dispute has been successfully ${resolvingStatus === "RESOLVED" ? "resolved" : "dismissed"}.`}
        onClose={() => setShowSuccessModal(false)}
      />

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

export default Disputes;
