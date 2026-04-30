/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserDetails,
  verifySupplier,
  blockUser,
  verifyBuyer,
} from "../services/api/admin-api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Eye,
  User,
  Calendar,
  Award,
  Target,
  Shield,
  AlertTriangle,
  X,
  Activity,
  Lock,
  Unlock,
  Download,
  DollarSign,
  TrendingUp,
  Package,
  Hash,
  Tag,
  Loader2,
} from "lucide-react";

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  createdAt: string;
}

interface Bid {
  id: string;
  amount: string | null;
  proposal: string;
  status: string;
  createdAt: string;
  rejectionReason?: string;
  rfp?: {
    title: string;
    status: string;
  };
}

interface RFP {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  currency: string;
  deadline: string;
  priority: string;
  status: string;
  awardedBidId?: string;
  createdAt: string;
  _count?: {
    bids: number;
  };
}

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    businessName: string;
    phone: string;
    address: string;
    businessType: string | null;
    taxId: string;
    registrationNumber: string;
    yearsInBusiness: number;
    categories: string[];
    bio: string;
    status: string;
    verifiedAt?: string;
    rejectedReason?: string;
    documents: Document[];
    bids: Bid[];
  };
  buyer?: {
    companyName: string;
    phone: string | null;
    address: string | null;
    companyType: string | null;
    taxId: string | null;
    department: string | null;
    position: string | null;
    status?: string;
    verifiedAt?: string;
    rejectedReason?: string;
    documents: Document[];
    rfps: RFP[];
  };
  activityLogs: ActivityLog[];
}

const getFileUrl = (filePath: string): string => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${apiUrl}/${filePath}`;
};

// Document Viewer Modal Component
const DocumentViewerModal: React.FC<{
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
}> = ({ isOpen, document, onClose }) => {
  if (!isOpen || !document) return null;

  const fileUrl = getFileUrl(document.filePath);
  const isImage = document.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = document.fileName.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {document.fileName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Type: {document.documentType} • Uploaded:{" "}
              {new Date(document.uploadedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-muted/20">
          {isImage ? (
            <img
              src={fileUrl}
              alt={document.fileName}
              className="max-w-full h-auto mx-auto rounded-lg"
            />
          ) : isPDF ? (
            <iframe
              src={`${fileUrl}#toolbar=0`}
              title={document.fileName}
              className="w-full h-[70vh] rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Preview not available
              </p>
              <a
                href={fileUrl}
                download
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Document
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {document.verifiedAt ? (
              <span className="text-green-500">
                ✓ Verified on {new Date(document.verifiedAt).toLocaleString()}
              </span>
            ) : (
              <span className="text-amber-500">⚠ Not verified yet</span>
            )}
          </div>
          <a
            href={fileUrl}
            download
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
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

// Confirmation Modal Component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "success" | "error" | "warning" | "info";
  isSubmitting?: boolean;
}> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = "warning",
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          button: "bg-green-500 hover:bg-green-600",
        };
      case "error":
        return {
          icon: <XCircle className="w-12 h-12 text-destructive" />,
          button: "bg-destructive hover:bg-destructive/90",
        };
      case "info":
        return {
          icon: <AlertCircle className="w-12 h-12 text-blue-500" />,
          button: "bg-blue-500 hover:bg-blue-600",
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
          button: "bg-amber-500 hover:bg-amber-600",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center text-center">
          {styles.icon}
          <h3 className="text-xl font-bold text-foreground mt-4 mb-2">
            {title}
          </h3>
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
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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

// Rejection Modal Component
const RejectionModal: React.FC<{
  isOpen: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({
  isOpen,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <h3 className="text-xl font-bold text-foreground">Reject User</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-muted-foreground mb-4">
          Provide a reason for rejection so the user can understand and correct
          their profile.
        </p>

        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="e.g., Tax ID document is expired, Business license is unclear, etc."
          rows={5}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim() || isSubmitting}
            className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Rejection"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "activity" | "rfps" | "bids"
  >("overview");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (id) {
      try {
        const res = await getUserDetails(id);
        console.log(res.user);
        setData(res.user);
      } catch (err) {
        console.error("Error loading details", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (data?.role === "BUYER") {
        await verifyBuyer(id!, "VERIFIED", undefined);
      }
      if (data?.role === "SUPPLIER") {
        await verifySupplier(id!, "VERIFIED", undefined);
      }

      // Close confirm modal and show success
      setShowConfirmModal(false);
      setSuccessMessage({
        title: "User Approved",
        message: `${data?.firstName} ${data?.lastName} has been successfully verified.`,
      });
      setShowSuccessModal(true);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Approval failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      if (data?.role === "SUPPLIER") {
        await verifySupplier(id!, "REJECTED", reason);
      }
      if (data?.role === "BUYER") {
        await verifyBuyer(id!, "REJECTED", reason);
      }

      // Close reject modal and show success
      setShowRejectModal(false);
      setSuccessMessage({
        title: "User Rejected",
        message: `${data?.firstName} ${data?.lastName} has been rejected. Reason: ${reason}`,
      });
      setShowSuccessModal(true);
      setReason("");

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Rejection failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockToggle = async () => {
    setIsSubmitting(true);
    try {
      const newStatus = !data?.isActive;
      await blockUser(id!, newStatus);

      // Close block modal and show success
      setShowBlockModal(false);
      setSuccessMessage({
        title: newStatus ? "User Blocked" : "User Unblocked",
        message: `${data?.firstName} ${data?.lastName} has been ${newStatus ? "blocked" : "unblocked"} successfully.`,
      });
      setShowSuccessModal(true);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Block/Unblock failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "APPROVED":
        return {
          bg: "bg-green-500/10",
          text: "text-green-500",
          border: "border-green-500/20",
          icon: CheckCircle,
          label: "Verified",
        };
      case "PENDING":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-500",
          border: "border-amber-500/20",
          icon: Clock,
          label: "Pending",
        };
      case "REJECTED":
        return {
          bg: "bg-destructive/10",
          text: "text-destructive",
          border: "border-destructive/20",
          icon: XCircle,
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          border: "border-border",
          icon: AlertCircle,
          label: status,
        };
    }
  };

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case "AWARDED":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "REJECTED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "PENDING_APPROVAL":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "ACTIVE":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRfpStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "AWARDED":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "CLOSED":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_USER_DETAILS...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-foreground">User not found</p>
      </div>
    );
  }

  const isSupplier = data.role === "SUPPLIER";
  const isBuyer = data.role === "BUYER";
  const isPending =
    (isSupplier && data.supplier?.status === "PENDING") ||
    (isBuyer && data.buyer?.status === "PENDING");
  const statusInfo =
    isSupplier && data.supplier
      ? getStatusBadge(data.supplier.status)
      : isBuyer && data.buyer?.status
        ? getStatusBadge(data.buyer.status)
        : null;

  const documents = isSupplier
    ? data.supplier?.documents
    : data.buyer?.documents;

  const hasBids =
    isSupplier && data.supplier?.bids && data.supplier.bids.length > 0;
  const hasRfps = isBuyer && data.buyer?.rfps && data.buyer.rfps.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBlockModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                data.isActive
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              }`}
            >
              {data.isActive ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Block User</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span className="text-sm font-medium">Unblock User</span>
                </>
              )}
            </button>

            {statusInfo && (
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
              >
                <statusInfo.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{statusInfo.label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 mt-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {data.firstName?.charAt(0)}
              {data.lastName?.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {data.firstName} {data.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <p className="text-muted-foreground">{data.email}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-mono text-muted-foreground">
                @{data.username}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>ID: {data.id.slice(0, 8)}...</span>
              <span>
                Joined: {new Date(data.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar for Pending Users */}
      {isPending && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">
                  Pending Verification
                </p>
                <p className="text-sm text-muted-foreground">
                  Review documents before approving this user
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Approve User
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-destructive text-white rounded-lg font-medium hover:bg-destructive/90 transition-colors"
              >
                Reject User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "overview"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
            {activeTab === "overview" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>
          {(isSupplier || isBuyer) && (
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "documents"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Documents
              {documents && documents.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded-full">
                  {documents.length}
                </span>
              )}
              {activeTab === "documents" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          )}
          {isSupplier && hasBids && (
            <button
              onClick={() => setActiveTab("bids")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "bids"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bids
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded-full">
                {data.supplier?.bids.length}
              </span>
              {activeTab === "bids" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          )}
          {isBuyer && hasRfps && (
            <button
              onClick={() => setActiveTab("rfps")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "rfps"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              RFPs
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded-full">
                {data.buyer?.rfps.length}
              </span>
              {activeTab === "rfps" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "activity"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Activity Logs
            {activeTab === "activity" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {isSupplier ? "Business Information" : "Company Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isSupplier ? (
                    <>
                      <InfoRow
                        icon={Building2}
                        label="Business Name"
                        value={data.supplier?.businessName}
                      />
                      <InfoRow
                        icon={Briefcase}
                        label="Business Type"
                        value={data.supplier?.businessType}
                      />
                      <InfoRow
                        icon={Hash}
                        label="Tax ID"
                        value={data.supplier?.taxId}
                      />
                      <InfoRow
                        icon={FileText}
                        label="Registration Number"
                        value={data.supplier?.registrationNumber}
                      />
                      <InfoRow
                        icon={Award}
                        label="Years in Business"
                        value={data.supplier?.yearsInBusiness?.toString()}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Phone"
                        value={data.supplier?.phone}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={data.supplier?.address}
                      />
                    </>
                  ) : (
                    <>
                      <InfoRow
                        icon={Building2}
                        label="Company Name"
                        value={data.buyer?.companyName}
                      />
                      <InfoRow
                        icon={Briefcase}
                        label="Company Type"
                        value={data.buyer?.companyType}
                      />
                      <InfoRow
                        icon={Hash}
                        label="Tax ID"
                        value={data.buyer?.taxId}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Phone"
                        value={data.buyer?.phone}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={data.buyer?.address}
                      />
                      <InfoRow
                        icon={Briefcase}
                        label="Department"
                        value={data.buyer?.department}
                      />
                      <InfoRow
                        icon={Briefcase}
                        label="Position"
                        value={data.buyer?.position}
                      />
                    </>
                  )}
                </div>
              </div>

              {isSupplier && data.supplier?.bio && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    About
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {data.supplier.bio}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "documents" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Verification Documents
              </h3>
              {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Type: {doc.documentType} • Uploaded:{" "}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          {doc.verifiedAt && (
                            <p className="text-xs text-green-500">
                              ✓ Verified by Admin on{" "}
                              {new Date(doc.verifiedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No documents uploaded
                </p>
              )}
            </div>
          )}

          {activeTab === "bids" && isSupplier && data.supplier?.bids && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Bid History
              </h3>
              <div className="space-y-4">
                {data.supplier.bids.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-foreground">
                            {bid.rfp?.title || "Untitled RFP"}
                          </h4>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${getBidStatusBadge(bid.status)}`}
                          >
                            {bid.status.replace("_", " ")}
                          </span>
                        </div>
                        {bid.proposal && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {bid.proposal}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {bid.amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Amount: {bid.amount}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Submitted:{" "}
                            {new Date(bid.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {bid.rejectionReason && (
                          <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                            Rejection reason: {bid.rejectionReason}
                          </div>
                        )}
                      </div>
                      {bid.rfp?.status && (
                        <div
                          className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getRfpStatusBadge(bid.rfp.status)}`}
                        >
                          RFP: {bid.rfp.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "rfps" && isBuyer && data.buyer?.rfps && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Request for Proposals (RFPs)
              </h3>
              <div className="space-y-4">
                {data.buyer.rfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">
                            {rfp.title}
                          </h4>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${getRfpStatusBadge(rfp.status)}`}
                          >
                            {rfp.status}
                          </span>
                          {rfp.priority === "URGENT" && (
                            <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border bg-destructive/10 text-destructive border-destructive/20">
                              Urgent
                            </span>
                          )}
                        </div>
                        {rfp.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {rfp.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Budget: {rfp.currency}{" "}
                            {parseInt(rfp.budget).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Deadline:{" "}
                            {new Date(rfp.deadline).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Bids: {rfp._count?.bids || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Category: {rfp.category}
                          </span>
                        </div>
                        {rfp.awardedBidId && (
                          <div className="mt-2 p-2 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                            ✓ Contract awarded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Activity Timeline
              </h3>
              <div className="space-y-3">
                {data.activityLogs?.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!data.activityLogs || data.activityLogs.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No activity logs found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Account Information
            </h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Role" value={data.role} />
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={new Date(data.createdAt).toLocaleDateString()}
              />
              <InfoRow
                icon={data.isActive ? CheckCircle : XCircle}
                label="Status"
                value={data.isActive ? "Active" : "Blocked"}
                valueColor={
                  data.isActive ? "text-green-500" : "text-destructive"
                }
              />
              <InfoRow
                icon={Clock}
                label="Last Updated"
                value={new Date(data.updatedAt).toLocaleDateString()}
              />
            </div>
          </div>

          {(isSupplier && data.supplier?.verifiedAt) ||
          (isBuyer && data.buyer?.verifiedAt) ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Verification Details
              </h3>
              <div className="space-y-3">
                <InfoRow
                  icon={Calendar}
                  label="Verified At"
                  value={new Date(
                    (isSupplier
                      ? data.supplier?.verifiedAt
                      : data.buyer?.verifiedAt) || "",
                  ).toLocaleString()}
                />
                {(isSupplier
                  ? data.supplier?.rejectedReason
                  : data.buyer?.rejectedReason) && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive mb-1">
                      Rejection Reason
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isSupplier
                        ? data.supplier?.rejectedReason
                        : data.buyer?.rejectedReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  Total Activities
                </span>
                <span className="text-lg font-bold text-foreground">
                  {data.activityLogs?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  Documents Uploaded
                </span>
                <span className="text-lg font-bold text-foreground">
                  {documents?.length || 0}
                </span>
              </div>
              {isSupplier && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    Total Bids
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {data.supplier?.bids?.length || 0}
                  </span>
                </div>
              )}
              {isBuyer && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    Total RFPs
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {data.buyer?.rfps?.length || 0}
                  </span>
                </div>
              )}
              {isSupplier && data.supplier?.bids && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    Won Bids
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    {
                      data.supplier.bids.filter((b) => b.status === "AWARDED")
                        .length
                    }
                  </span>
                </div>
              )}
              {isBuyer && data.buyer?.rfps && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    Active RFPs
                  </span>
                  <span className="text-lg font-bold text-blue-500">
                    {data.buyer.rfps.filter((r) => r.status === "OPEN").length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentViewerModal
        isOpen={showDocumentViewer}
        document={selectedDocument}
        onClose={() => {
          setShowDocumentViewer(false);
          setSelectedDocument(null);
        }}
      />

      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Approve User"
        message={`Are you sure you want to approve ${data.firstName} ${data.lastName}? This action cannot be undone.`}
        confirmText="Yes, Approve"
        cancelText="Cancel"
        onConfirm={handleApprove}
        onCancel={() => setShowConfirmModal(false)}
        type="success"
        isSubmitting={isSubmitting}
      />

      <ConfirmationModal
        isOpen={showBlockModal}
        title={data.isActive ? "Block User" : "Unblock User"}
        message={
          data.isActive
            ? `Are you sure you want to block ${data.firstName} ${data.lastName}? Blocked users cannot access the platform.`
            : `Are you sure you want to unblock ${data.firstName} ${data.lastName}? They will regain access to the platform.`
        }
        confirmText={data.isActive ? "Yes, Block" : "Yes, Unblock"}
        cancelText="Cancel"
        onConfirm={handleBlockToggle}
        onCancel={() => setShowBlockModal(false)}
        type="warning"
        isSubmitting={isSubmitting}
      />

      <RejectionModal
        isOpen={showRejectModal}
        reason={reason}
        onReasonChange={setReason}
        onConfirm={handleReject}
        onCancel={() => {
          setShowRejectModal(false);
          setReason("");
        }}
        isSubmitting={isSubmitting}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
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
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .animate-bounce {
          animation: bounce 0.5s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

// Helper Component for Info Rows
const InfoRow: React.FC<{
  icon?: React.ElementType;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
}> = ({ icon: Icon, label, value, valueColor }) => (
  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
    {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="flex-1">
      <p className="text-xs font-mono text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${valueColor || "text-foreground"}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);
