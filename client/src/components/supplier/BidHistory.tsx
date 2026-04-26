/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBids } from "../../services/api/supplier-api";
import { bidSchema, bidsResponseSchema, type Bid } from "@/schemas/bid.schema";
import {
  Award,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  XCircle,
  Eye,
  TrendingUp,
  Calendar,
  Building2,
  Package,
  Send,
  Trash2,
  RefreshCw,
} from "lucide-react";

const BidHistory: React.FC = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBids = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyBids();
      console.log("response: ", response);

      // Validate response with Zod
      const validatedResponse = bidsResponseSchema.parse(response);

      // Validate each bid
      const validatedBids =
        validatedResponse.data?.map((bid) => bidSchema.parse(bid)) || [];
      setBids(validatedBids);
    } catch (err) {
      console.error("Failed to fetch bids:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load bid history",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "AWARDED":
        return <Award className="w-4 h-4" />;
      case "ACTIVE":
        return <TrendingUp className="w-4 h-4" />;
      case "PENDING_APPROVAL":
        return <Clock className="w-4 h-4" />;
      case "WITHDRAWN":
        return <Trash2 className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "AWARDED":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "ACTIVE":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "PENDING_APPROVAL":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "WITHDRAWN":
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
      case "REJECTED":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "CLOSED":
        return "text-muted-foreground bg-muted/50 border-border";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case "AWARDED":
        return "Awarded";
      case "ACTIVE":
        return "Active";
      case "PENDING_APPROVAL":
        return "Pending Approval";
      case "WITHDRAWN":
        return "Withdrawn";
      case "REJECTED":
        return "Rejected";
      case "CLOSED":
        return "Closed";
      default:
        return status;
    }
  }, []);

  const handleViewRFP = useCallback(
    (rfpId: string) => {
      navigate(`/dashboard/rfps/${rfpId}`);
    },
    [navigate],
  );

  const handleSubmitFinancialBid = useCallback(
    (bid: Bid) => {
      navigate(`/dashboard/bids/${bid.id}/financial`);
    },
    [navigate],
  );

  const handleWithdrawBid = useCallback(async () => {
    if (!selectedBid) return;

    setIsSubmitting(true);
    try {
      // API call to withdraw bid
      // await withdrawBid({ bidId: selectedBid.id, reason: withdrawReason });

      // Refresh bids after withdrawal
      await fetchBids();
      setShowWithdrawModal(false);
      setWithdrawReason("");
      setSelectedBid(null);
    } catch (err) {
      console.error("Failed to withdraw bid:", err);
      setError("Failed to withdraw bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedBid, withdrawReason, fetchBids]);

  const stats = {
    total: bids.length,
    active: bids.filter((b) => b.status === "ACTIVE").length,
    awarded: bids.filter((b) => b.status === "AWARDED").length,
    pending: bids.filter((b) => b.status === "PENDING_APPROVAL").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_BID_HISTORY...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">Failed to load bids</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchBids}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Bids Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            You haven't placed any bids yet. Browse RFPs to start bidding!
          </p>
          <button
            onClick={() => navigate("/dashboard/rfps")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Opportunities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Bid History</h1>
        </div>
        <p className="text-muted-foreground">
          Track and manage all your submitted bids
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              TOTAL BIDS
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              ACTIVE
            </span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.active}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              AWARDED
            </span>
            <Award className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.awarded}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              PENDING
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className="bg-card border border-border rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {bid.rfp.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    <span>{bid.rfp.buyer.companyName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{bid.rfp.category}</span>
                  </div>
                </div>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(bid.status)}`}
              >
                {getStatusIcon(bid.status)}
                {getStatusLabel(bid.status)}
              </div>
            </div>

            {/* Bid Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">
                  YOUR BID
                </p>
                {bid.amount ? (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <p className="text-lg font-bold text-green-500">
                      {bid.rfp.currency} {bid.amount.toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <p className="text-sm text-amber-500">Pending approval</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">
                  BUDGET RANGE
                </p>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    {bid.rfp.currency} {Number(bid.rfp.budget).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">
                  SUBMITTED
                </p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    {new Date(bid.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">
                  DEADLINE
                </p>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    {new Date(bid.rfp.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Proposal */}
            <div className="mb-4">
              <p className="text-xs font-mono text-muted-foreground mb-2">
                PROPOSAL
              </p>
              <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">
                {bid.proposal}
              </p>
            </div>

            {/* Rejection Reason */}
            {bid.rejectionReason && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs font-mono text-destructive mb-1">
                  REJECTION REASON
                </p>
                <p className="text-sm text-destructive">
                  {bid.rejectionReason}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleViewRFP(bid.rfpId)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View RFP</span>
              </button>

              {bid.status === "PENDING_APPROVAL" && !bid.amount && (
                <button
                  onClick={() => handleSubmitFinancialBid(bid)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Submit Financial Bid
                  </span>
                </button>
              )}

              {(bid.status === "PENDING_APPROVAL" ||
                bid.status === "ACTIVE") && (
                <button
                  onClick={() => {
                    setSelectedBid(bid);
                    setShowWithdrawModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Withdraw Bid</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedBid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h3 className="text-xl font-bold text-foreground">
                Withdraw Bid
              </h3>
            </div>

            <p className="text-muted-foreground mb-4">
              Are you sure you want to withdraw your bid for "
              {selectedBid.rfp.title}"?
            </p>

            <div className="mb-6">
              <label className="block text-xs font-mono text-muted-foreground mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Why are you withdrawing this bid?"
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawReason("");
                  setSelectedBid(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawBid}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Withdrawing..." : "Yes, Withdraw Bid"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BidHistory;
