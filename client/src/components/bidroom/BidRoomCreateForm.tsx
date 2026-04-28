/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, type RoomCreateInpute } from "@/services/api/bidroom-api";
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
    setLoading(true);
    try {
      const apiData: RoomCreateInpute = {
        rfpId: formData.rfpId,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        biddingType: formData.biddingType,
        invitedSupplierIds: formData.invitedSupplierIds,
      };
      await createRoom(apiData);
      navigate("/dashboard/bidroom");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create bid room");
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
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 bg-muted/10">
              {formData.rfpId && filteredSuppliers.length === 0 ? (
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
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Creating Room..." : "Initialize Bid Room"}
          </button>
        </div>
      </form>
    </div>
  );
};
