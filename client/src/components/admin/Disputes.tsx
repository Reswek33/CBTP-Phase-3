/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
      alert(`Dispute ${resolvingStatus.toLowerCase()} successfully`);
      setSelectedDispute(null);
      setResolutionText("");
      fetchDisputes();
    } catch (err) {
      alert("Failed to resolve dispute");
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
                      onClick={handleResolve}
                      disabled={isSubmitting || !resolutionText}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {isSubmitting
                        ? "Processing..."
                        : `Submit ${resolvingStatus === "RESOLVED" ? "Resolution" : "Dismissal"}`}
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
    </div>
  );
};

export default Disputes;
