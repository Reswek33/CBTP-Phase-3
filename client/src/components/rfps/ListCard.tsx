import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { RFPS } from "../../schemas/rfps.schema";
import { getRfps } from "../../services/api/rfp-api";
import { getOrCreateConversation } from "../../services/api/chat-api";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  DollarSign,
  Calendar,
  Users,
  Building2,
  MessageSquare,
  Eye,
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type SortField = "budget" | "deadline" | "createdAt" | "bids";
type SortOrder = "asc" | "desc";

interface FilterState {
  status: string[];
  priority: string[];
  minBudget: number;
  maxBudget: number;
  searchTerm: string;
}

const ListCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rfps, setRfps] = useState<RFPS[]>([]);
  const [filteredRfps, setFilteredRfps] = useState<RFPS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    minBudget: 0,
    maxBudget: Infinity,
    searchTerm: "",
  });

  const isBuyer = user?.role === "BUYER";
  const isSupplier = user?.role === "SUPPLIER";

  // Fetch RFPs
  useEffect(() => {
    const fetchRfps = async () => {
      try {
        setLoading(true);
        const response = await getRfps();
        setRfps(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load RFPs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRfps();
  }, []);

  // Filter and sort RFPs
  useEffect(() => {
    let result = [...rfps];

    // Apply filters
    if (filters.status.length > 0) {
      result = result.filter((rfp) => filters.status.includes(rfp.status));
    }

    if (filters.priority.length > 0) {
      result = result.filter((rfp) => filters.priority.includes(rfp.priority));
    }

    if (filters.minBudget > 0) {
      result = result.filter((rfp) => rfp.budget >= filters.minBudget);
    }

    if (filters.maxBudget !== Infinity) {
      result = result.filter((rfp) => rfp.budget <= filters.maxBudget);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(
        (rfp) =>
          rfp.title.toLowerCase().includes(searchLower) ||
          rfp.description?.toLowerCase().includes(searchLower) ||
          rfp.buyer.companyName.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "budget":
          comparison = a.budget - b.budget;
          break;
        case "deadline":
          comparison =
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case "bids":
          comparison = (a._count?.bids || 0) - (b._count?.bids || 0);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredRfps(result);
  }, [rfps, filters, sortField, sortOrder]);

  const handleContactBuyer = useCallback(
    async (e: React.MouseEvent, rfp: RFPS) => {
      e.stopPropagation();
      try {
        const chat = await getOrCreateConversation({ rfpId: rfp.id });
        navigate(`/dashboard/chat?id=${chat.id}`);
      } catch (err) {
        console.error("Failed to initialize chat", err);
      }
    },
    [navigate],
  );

  const handleCardClick = useCallback(
    (rfpId: string) => {
      navigate(`/dashboard/rfps/${rfpId}`);
    },
    [navigate],
  );

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "HIGH":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "NORMAL":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "LOW":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "OPEN":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "CLOSED":
        return "text-muted-foreground bg-muted/50 border-border";
      case "AWARDED":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "CANCELLED":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  }, []);

  const stats = useMemo(
    () => ({
      total: rfps.length,
      open: rfps.filter((r) => r.status === "OPEN").length,
      urgent: rfps.filter((r) => r.priority === "URGENT").length,
      totalBudget: rfps.reduce((sum, r) => sum + r.budget, 0),
    }),
    [rfps],
  );

  const uniqueStatuses = useMemo(
    () => [...new Set(rfps.map((r) => r.status))],
    [rfps],
  );

  const uniquePriorities = useMemo(
    () => [...new Set(rfps.map((r) => r.priority))],
    [rfps],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_OPPORTUNITIES...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">Failed to load RFPs</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              TOTAL RFPS
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              OPEN
            </span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.open}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              URGENT
            </span>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.urgent}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              TOTAL BUDGET
            </span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${(stats.totalBudget / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-2 py-1 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="createdAt">Date</option>
              <option value="budget">Budget</option>
              <option value="deadline">Deadline</option>
              <option value="bids">Bids</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, description, or company..."
                value={filters.searchTerm}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          status: prev.status.includes(status)
                            ? prev.status.filter((s) => s !== status)
                            : [...prev.status, status],
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filters.status.includes(status)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniquePriorities.map((priority) => (
                    <button
                      key={priority}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          priority: prev.priority.includes(priority)
                            ? prev.priority.filter((p) => p !== priority)
                            : [...prev.priority, priority],
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filters.priority.includes(priority)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Min Budget ($)
                </label>
                <input
                  type="number"
                  value={filters.minBudget || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minBudget: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Max Budget ($)
                </label>
                <input
                  type="number"
                  value={
                    filters.maxBudget === Infinity ? "" : filters.maxBudget
                  }
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxBudget: Number(e.target.value) || Infinity,
                    }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Any"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  setFilters({
                    status: [],
                    priority: [],
                    minBudget: 0,
                    maxBudget: Infinity,
                    searchTerm: "",
                  })
                }
                className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredRfps.length}
          </span>{" "}
          of <span className="font-medium text-foreground">{rfps.length}</span>{" "}
          opportunities
        </p>
      </div>

      {/* RFP Cards */}
      {filteredRfps.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">No RFPs found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later for new opportunities
          </p>
          {isBuyer && (
            <button
              onClick={() => navigate("/dashboard/rfps/create")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Your First RFP
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRfps.map((rfp) => (
            <div
              key={rfp.id}
              onClick={() => handleCardClick(rfp.id)}
              className="bg-card border border-border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {rfp.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{rfp.buyer.companyName}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(rfp.priority)}`}
                  >
                    {rfp.priority}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(rfp.status)}`}
                  >
                    {rfp.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {rfp.description}
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    BUDGET
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    ${rfp.budget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    DEADLINE
                  </p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {new Date(rfp.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    BIDS
                  </p>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {rfp._count?.bids || 0}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">
                    POSTED
                  </p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {new Date(rfp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(rfp.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View Details</span>
                </button>
                {isSupplier && rfp.status === "OPEN" && (
                  <button
                    onClick={(e) => handleContactBuyer(e, rfp)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Contact Buyer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListCard;
