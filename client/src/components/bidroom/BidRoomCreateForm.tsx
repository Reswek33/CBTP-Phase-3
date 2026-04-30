/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, type RoomCreateInput } from "@/services/api/bidroom-api";
import { getMyRfps } from "@/services/api/rfp-api";
import { getSuppliersForInvite } from "@/services/api/supplier-api";
import {
  Calendar,
  Clock,
  Users,
  Lock,
  Globe,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

interface Supplier {
  id: string;
  businessName: string;
  user: { firstName: string; lastName: string; email: string };
}

interface FormData {
  rfpId: string;
  startTime: string;
  endTime: string;
  biddingType: "PUBLIC" | "CLOSED";
  invitedSupplierIds: string[];
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

export const BidRoomCreateForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rfps, setRfps] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<FormData>({
    rfpId: "",
    startTime: "",
    endTime: "",
    biddingType: "PUBLIC",
    invitedSupplierIds: [],
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 1. Initial Load: Fetch RFPs owned by the buyer
  useEffect(() => {
    fetchRfps();
  }, []);

  // 2. Reactive Load: Fetch suppliers whenever RFP changes
  useEffect(() => {
    if (formData.rfpId) {
      fetchSuppliers(formData.rfpId);
    } else {
      setSuppliers([]);
    }

    // Safety: Reset invited list if the project context changes
    setFormData((prev) => ({ ...prev, invitedSupplierIds: [] }));
  }, [formData.rfpId]);

  const fetchRfps = async () => {
    try {
      const response = await getMyRfps();
      setRfps(response.data);
    } catch (error) {
      console.error("Failed to fetch RFPs:", error);
      setToast({ message: "Failed to load your RFPs", type: "error" });
    }
  };

  const fetchSuppliers = async (rfpId: string) => {
    try {
      // Passes rfpId as query param to match your server-side req.query destructuring
      const response = await getSuppliersForInvite({ rfpId });
      setSuppliers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch eligible suppliers:", error);
      setSuppliers([]);
      setToast({ message: "Failed to load eligible suppliers", type: "error" });
    }
  };

  const toggleSupplier = (supplierId: string) => {
    setFormData((prev) => ({
      ...prev,
      invitedSupplierIds: prev.invitedSupplierIds.includes(supplierId)
        ? prev.invitedSupplierIds.filter((id) => id !== supplierId)
        : [...prev.invitedSupplierIds, supplierId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    const startDate = new Date(formData.startTime);
    const endDate = new Date(formData.endTime);
    const now = new Date();

    if (startDate < now) {
      setToast({ message: "Start time cannot be in the past", type: "error" });
      return;
    }

    if (endDate <= startDate) {
      setToast({ message: "End time must be after start time", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const apiData: RoomCreateInput = {
        rfpId: formData.rfpId,
        startTime: startDate,
        endTime: endDate,
        biddingType: formData.biddingType,
        invitedSupplierIds: formData.invitedSupplierIds,
      };
      await createRoom(apiData);
      setShowSuccessModal(true);

      // Navigate after success modal closes
      setTimeout(() => {
        navigate("/dashboard/bidroom");
      }, 2500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to create bid room";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Bid Room Created!"
        message="Your bid room has been successfully created and invitations have been sent to the selected suppliers."
        onClose={() => setShowSuccessModal(false)}
      />

      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Create Bid Room
        </h1>
        <p className="text-muted-foreground">
          Transition your RFP into a live competitive bidding session.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-6 space-y-6"
      >
        {/* RFP Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select RFP *
          </label>
          <select
            value={formData.rfpId}
            onChange={(e) =>
              setFormData({ ...formData, rfpId: e.target.value })
            }
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Choose an RFP to fetch eligible suppliers</option>
            {rfps.map((rfp) => (
              <option key={rfp.id} value={rfp.id}>
                {rfp.title} (Budget: ${rfp.budget?.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Time Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Time *</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Bidding Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Bidding Type *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, biddingType: "PUBLIC" })
              }
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.biddingType === "PUBLIC"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="font-semibold">Public</div>
              <p className="text-xs text-muted-foreground">
                Real-time price rankings visible to all
              </p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, biddingType: "CLOSED" })
              }
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.biddingType === "CLOSED"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Lock className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="font-semibold">Closed</div>
              <p className="text-xs text-muted-foreground">
                Bids are hidden; no price transparency
              </p>
            </button>
          </div>
        </div>

        {/* Supplier Invitation */}
        <div
          className={`space-y-4 transition-opacity ${!formData.rfpId ? "opacity-40" : "opacity-100"}`}
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Invite Eligible Suppliers ({formData.invitedSupplierIds.length})
            </label>
            {!formData.rfpId && (
              <span className="flex items-center text-xs text-amber-500 gap-1">
                <AlertCircle className="w-3 h-3" /> Select RFP first
              </span>
            )}
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter list by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!formData.rfpId}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 bg-muted/10">
              {loading && !suppliers.length ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading suppliers...
                </div>
              ) : formData.rfpId && filteredSuppliers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No eligible suppliers found for this RFP.
                </div>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => toggleSupplier(supplier.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      formData.invitedSupplierIds.includes(supplier.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {supplier.businessName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {supplier.user.email}
                      </div>
                    </div>
                    {formData.invitedSupplierIds.includes(supplier.id) && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => navigate("/dashboard/bidroom")}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              !formData.rfpId ||
              formData.invitedSupplierIds.length === 0
            }
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Room...
              </>
            ) : (
              "Initialize Bid Room"
            )}
          </button>
        </div>
      </form>

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
