import React, { useEffect, useState, useCallback } from "react";
import { getMessages } from "../../services/api/chat-api";
import { getAllConversationsForAdmin } from "../../services/api/admin-api";
import {
  MessageSquare,
  Users,
  Building2,
  Lock,
  Eye,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Updated interfaces to match actual API response
interface Conversation {
  id: string;
  rfpId?: string;
  buyerId?: string;
  supplierId?: string;
  rfp?: {
    id?: string;
    title: string;
    status: string;
  } | null;
  buyer?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName: string;
    user?: {
      firstName: string;
      lastName: string;
      id: string;
    };
  } | null;
  supplier?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    businessName: string;
    user?: {
      firstName: string;
      lastName: string;
      id: string;
    };
  } | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead?: boolean;
    senderId?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
  unreadCount?: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  isRead: boolean;
  conversationId?: string;
}

const AuditPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all conversations
  const fetchAllChats = useCallback(async () => {
    try {
      setError(null);
      const res = await getAllConversationsForAdmin();

      // Safely filter conversations - check for required data existence
      const validConversations = (res.data || []).filter(
        (conv: Conversation) => {
          // Check if conversation exists and has required nested objects
          if (!conv) return false;

          // For audit view, we want to show all conversations, but handle missing data gracefully
          // Don't filter out conversations with missing data, just handle them in UI
          return true;
        },
      );

      setConversations(validConversations);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllChats();

    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!activeChat) {
        fetchAllChats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAllChats, activeChat]);

  const handleSelectChat = async (conv: Conversation) => {
    if (!conv?.id) return;

    setActiveChat(conv);
    setLoading(true);
    setError(null);

    try {
      const res = await getMessages(conv.id);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      setError("Failed to load messages for this conversation");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllChats();
  };

  // Helper function to safely get buyer name
  const getBuyerName = (conv: Conversation) => {
    if (!conv?.buyer) return "Unknown Buyer";

    // Handle nested user structure
    const firstName = conv.buyer.user?.firstName || conv.buyer.firstName;
    const lastName = conv.buyer.user?.lastName || conv.buyer.lastName;

    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;

    return conv.buyer.companyName || "Unknown Buyer";
  };

  // Helper function to safely get supplier name
  const getSupplierName = (conv: Conversation) => {
    if (!conv?.supplier) return "Unknown Supplier";

    // Handle nested user structure
    const firstName = conv.supplier.user?.firstName || conv.supplier.firstName;
    const lastName = conv.supplier.user?.lastName || conv.supplier.lastName;

    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;

    return conv.supplier.businessName || "Unknown Supplier";
  };

  // Helper function to get initials for avatar
  const getInitials = (conv: Conversation, type: "buyer" | "supplier") => {
    if (type === "buyer") {
      const firstName = conv.buyer?.user?.firstName || conv.buyer?.firstName;
      const lastName = conv.buyer?.user?.lastName || conv.buyer?.lastName;
      if (firstName && lastName)
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      if (firstName) return firstName.charAt(0).toUpperCase();
      return "?";
    } else {
      const firstName =
        conv.supplier?.user?.firstName || conv.supplier?.firstName;
      const lastName = conv.supplier?.user?.lastName || conv.supplier?.lastName;
      if (firstName && lastName)
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      if (firstName) return firstName.charAt(0).toUpperCase();
      return "?";
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    // Skip invalid conversations
    if (!conv) return false;

    const rfpTitle = conv.rfp?.title?.toLowerCase() || "";
    const buyerName = getBuyerName(conv).toLowerCase();
    const supplierName = getSupplierName(conv).toLowerCase();
    const buyerCompany = conv.buyer?.companyName?.toLowerCase() || "";
    const supplierBusiness = conv.supplier?.businessName?.toLowerCase() || "";

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        rfpTitle.includes(searchLower) ||
        buyerName.includes(searchLower) ||
        supplierName.includes(searchLower) ||
        buyerCompany.includes(searchLower) ||
        supplierBusiness.includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Status filter - handle both "OPEN" and "ACTIVE" statuses
    if (filterStatus !== "ALL") {
      const convStatus = conv.rfp?.status?.toUpperCase() || "";
      // Map "OPEN" to "ACTIVE" for filter compatibility
      const normalizedStatus = convStatus === "OPEN" ? "ACTIVE" : convStatus;
      if (normalizedStatus !== filterStatus) return false;
    }

    return true;
  });

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "text-muted-foreground bg-muted/50 border-border";

    const upperStatus = status.toUpperCase();

    switch (upperStatus) {
      case "OPEN":
      case "ACTIVE":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "AWARDED":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "CLOSED":
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
      case "CANCELLED":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  const getDisplayStatus = (status: string) => {
    if (!status) return "UNKNOWN";
    return status === "OPEN" ? "ACTIVE" : status;
  };

  const stats = {
    total: conversations.length,
    active: conversations.filter((c) => {
      const status = c.rfp?.status?.toUpperCase();
      return status === "OPEN" || status === "ACTIVE";
    }).length,
    awarded: conversations.filter(
      (c) => c.rfp?.status?.toUpperCase() === "AWARDED",
    ).length,
    closed: conversations.filter((c) => {
      const status = c.rfp?.status?.toUpperCase();
      return status === "CLOSED" || status === "CANCELLED";
    }).length,
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-mono text-sm">
          LOADING_AUDIT_LOGS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Chat Audit Logs
            </h2>
            <p className="text-muted-foreground text-sm">
              Forensic review of all conversation threads between buyers and
              suppliers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Lock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono text-amber-500">
                READ_ONLY_ACCESS
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                TOTAL
              </span>
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                ACTIVE
              </span>
              <MessageSquare className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.active}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                AWARDED
              </span>
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.awarded}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                CLOSED
              </span>
              <MessageSquare className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.closed}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="AWARDED">Awarded</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Conversation List */}
          <div className="h-[calc(70vh-140px)] overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No conversations found</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectChat(conv)}
                  className={`
                    w-full text-left p-4 border-b border-border transition-all duration-200
                    hover:bg-muted/50
                    ${activeChat?.id === conv.id ? "bg-primary/5 border-l-4 border-l-primary" : ""}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {conv.rfp?.title || "Untitled RFP"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {conv.buyer?.companyName || "Unknown Buyer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {conv.supplier?.businessName || "Unknown Supplier"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(conv.rfp?.status || "")}`}
                      >
                        {getDisplayStatus(conv.rfp?.status || "UNKNOWN")}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {activeChat.rfp?.title || "Untitled Conversation"}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {activeChat.buyer?.companyName || "Unknown Buyer"}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">↔</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {activeChat.supplier?.businessName ||
                            "Unknown Supplier"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(activeChat.rfp?.status || "")}`}
                    >
                      {getDisplayStatus(activeChat.rfp?.status || "UNKNOWN")}
                    </div>
                    <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <span className="text-[10px] font-mono text-amber-500">
                        AUDIT MODE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Participants Info */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {getInitials(activeChat, "buyer")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {getBuyerName(activeChat)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Buyer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {getInitials(activeChat, "supplier")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {getSupplierName(activeChat)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Supplier
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-muted-foreground">
                      DECRYPTING_LOGS...
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      No messages in this conversation
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isBuyer = message.sender?.role === "BUYER";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isBuyer ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isBuyer
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-muted border border-border"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {message.sender?.firstName || "Unknown"}{" "}
                              {message.sender?.lastName || ""}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(message.createdAt)}
                            </span>
                            {!message.isRead && (
                              <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                Unread
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground wrap-break-word">
                            {message.content || "Empty message"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Read-only footer */}
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-mono">
                    READ_ONLY_MODE - Messages cannot be sent in audit view
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">
                SELECT A CONVERSATION
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Choose a chat from the list to review messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
