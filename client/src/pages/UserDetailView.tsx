/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  amount: string;
  proposal: string;
  status: string;
  createdAt: string;
  rfp?: {
    title: string;
    status: string;
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
    rfps: any[];
  };
  activityLogs: ActivityLog[];
}

const getFileUrl = (filePath: string): string => {
  if (!filePath) return "";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const apiUrl = "http://localhost:5000";
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
  console.log("fileUrl", fileUrl);
  const isImage = document.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = document.fileName.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col shadow-2xl animate-scale-in">
        {/* Header */}
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

        {/* Document Preview */}
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

        {/* Footer */}
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
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Processing..." : confirmText}
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
            className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Rejection"}
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
    "overview" | "documents" | "activity"
  >("overview");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (id) {
      try {
        const res = await getUserDetails(id);
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
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      if (data?.role === "BUYER") {
        await verifyBuyer(id!, "VERIFIED", undefined);
        await fetchData();
      }
      if (data?.role === "SUPPLIER") {
        await verifySupplier(id!, "VERIFIED", undefined);
        await fetchData();
      }
    } catch (err) {
      console.error("Approval failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;

    setShowRejectModal(false);
    setIsSubmitting(true);
    try {
      if (data?.role === "SUPPLIER") {
        await verifySupplier(id!, "REJECTED", reason);
        setReason("");
        await fetchData();
      }

      if (data?.role === "BUYER") {
        await verifyBuyer(id!, "REJECTED", reason);
        setReason("");
        await fetchData();
      }
    } catch (err) {
      console.error("Rejection failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockToggle = async () => {
    setShowBlockModal(false);
    setIsSubmitting(true);
    try {
      const newStatus = !data?.isActive;
      await blockUser(id!, newStatus);
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
            {/* Block/Unblock Button */}
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
        <div className="flex gap-2">
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
              {/* Personal & Business Info */}
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
                        icon={FileText}
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
                        icon={FileText}
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

              {/* Bio / Description */}
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

              {/* Bids (Suppliers) */}
              {isSupplier &&
                data.supplier?.bids &&
                data.supplier.bids.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Recent Bids
                    </h3>
                    <div className="space-y-3">
                      {data.supplier.bids.slice(0, 5).map((bid) => (
                        <div
                          key={bid.id}
                          className="p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="font-medium text-foreground">
                                {bid.rfp?.title || "Untitled RFP"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Bid Amount: ${bid.amount}
                              </p>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                bid.status === "AWARDED"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {bid.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* RFPs (Buyers) */}
              {isBuyer && data.buyer?.rfps && data.buyer.rfps.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Recent RFPs
                  </h3>
                  <div className="space-y-3">
                    {data.buyer.rfps.slice(0, 5).map((rfp: any) => (
                      <div key={rfp.id} className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-medium text-foreground">
                              {rfp.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Budget: ${rfp.budget} • Deadline:{" "}
                              {new Date(rfp.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              rfp.status === "OPEN"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {rfp.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                              ✓ Verified on{" "}
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
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
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
            </div>
          </div>

          {/* Verification Info */}
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

          {/* Stats */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={showDocumentViewer}
        document={selectedDocument}
        onClose={() => {
          setShowDocumentViewer(false);
          setSelectedDocument(null);
        }}
      />

      {/* Confirmation Modal for Approval */}
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

      {/* Confirmation Modal for Block/Unblock */}
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

      {/* Rejection Modal */}
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
