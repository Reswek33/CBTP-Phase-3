/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { getRfpsById } from "../../services/api/rfp-api";
import {
  applyToBid,
  submitFinancialBid,
  updateApplicationStatus,
  awardBid,
} from "../../services/api/bid-api";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileText,
  DollarSign,
  Calendar,
  Tag,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  File,
  Eye,
  Award,
  UserCheck,
  UserX,
  Download,
  Send,
  Briefcase,
  Users,
  X,
  RefreshCw,
} from "lucide-react";

// Helper function to get file URL (relative path)
const getFileUrl = (filePath: string) => {
  if (!filePath) return "";
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `/${cleanPath}`;
};

// Document Viewer Modal Component
const DocumentViewerModal: React.FC<{
  isOpen: boolean;
  document: { fileName: string; filePath: string } | null;
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
              RFP Document • Click to view or download
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
              onError={(e) => {
                console.error("Failed to load image:", fileUrl);
                (e.target as HTMLImageElement).style.display = "none";
              }}
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
                target="_blank"
                rel="noopener noreferrer"
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
            Uploaded as part of RFP documentation
          </div>
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
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

// Reapply Modal Component
const ReapplyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposalText: string, file: File | null) => Promise<void>;
  submitting: boolean;
}> = ({ isOpen, onClose, onSubmit, submitting }) => {
  const [proposalText, setProposalText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please upload a proposal PDF");
      return;
    }
    await onSubmit(proposalText, selectedFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Reapply to RFP</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Technical Proposal Summary
            </label>
            <textarea
              placeholder="Outline your technical approach, methodology, and qualifications..."
              rows={5}
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Proposal Document (PDF)
            </label>
            <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              {!selectedFile ? (
                <div>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF only (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Submit Reapplication
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RfpDetail = ({ rfpId }: { rfpId: string }) => {
  const { user } = useAuth();
  const socket = useSocket();

  const [rfp, setRfp] = useState<any>(null);
  const [userBid, setUserBid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    fileName: string;
    filePath: string;
  } | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showReapplyModal, setShowReapplyModal] = useState(false);

  // Form States
  const [proposalText, setProposalText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [financialAmount, setFinancialAmount] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getRfpsById(rfpId);
      const rfpData = response.data;
      setRfp(rfpData);

      const existingBid = rfpData.bids?.find(
        (b: any) => b.supplierId === user?.id,
      );
      setUserBid(existingBid);
    } catch (err) {
      console.error("Error fetching RFP:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [rfpId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_rfp", rfpId);

    socket.on("new_bid_received", () => fetchData());
    socket.on("rfp_awarded", () => fetchData());

    return () => {
      socket.off("new_bid_received");
      socket.off("rfp_awarded");
      socket.emit("leave_rfp", rfpId);
    };
  }, [socket, rfpId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please upload a proposal PDF");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proposal", proposalText);
      formData.append("proposalFile", selectedFile);
      await applyToBid(rfpId, formData);
      alert("Application submitted successfully!");
      fetchData();
      setProposalText("");
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Application failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReapply = async (
    newProposalText: string,
    newFile: File | null,
  ) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proposal", newProposalText);
      if (newFile) {
        formData.append("proposalFile", newFile);
      }
      const res = await applyToBid(rfpId, formData);
      console.log(res.data);
      alert("Reapplication submitted successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Reapplication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFinancialBid(userBid.id, financialAmount);
      alert("Financial bid submitted!");
      fetchData();
      setFinancialAmount(0);
    } catch (err: any) {
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (
    bidId: string,
    newStatus: "ACTIVE" | "REJECTED",
  ) => {
    let reason = "";
    if (newStatus === "REJECTED") {
      reason = prompt("Reason for rejection:") || "Does not meet requirements";
    }
    try {
      setSubmitting(true);
      await updateApplicationStatus(bidId, {
        status: newStatus,
        rejectionReason: reason,
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAwardContract = async (bidId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to award this contract? This will close the RFP.",
      )
    )
      return;
    try {
      setSubmitting(true);
      await awardBid(bidId);
      alert("Contract Awarded Successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Awarding failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = (doc: { fileName: string; filePath: string }) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      OPEN: {
        icon: <Clock className="w-3 h-3" />,
        bg: "bg-green-500/10",
        text: "text-green-500",
        border: "border-green-500/20",
        label: "Open",
      },
      PENDING_APPROVAL: {
        icon: <Clock className="w-3 h-3" />,
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
        label: "Pending Approval",
      },
      ACTIVE: {
        icon: <CheckCircle className="w-3 h-3" />,
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/20",
        label: "Active",
      },
      AWARDED: {
        icon: <Award className="w-3 h-3" />,
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        border: "border-purple-500/20",
        label: "Awarded",
      },
      REJECTED: {
        icon: <XCircle className="w-3 h-3" />,
        bg: "bg-destructive/10",
        text: "text-destructive",
        border: "border-destructive/20",
        label: "Rejected",
      },
    };
    return configs[status] || configs.OPEN;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_RFP_DETAILS...
        </p>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-foreground">RFP not found.</p>
      </div>
    );
  }

  const isBuyer = user?.role === "BUYER" && rfp.buyerId === user?.id;
  const isSupplier = user?.role === "SUPPLIER";
  const canApply = isSupplier && !userBid && rfp.status === "OPEN";
  const isPending = userBid?.status === "PENDING_APPROVAL";
  const isApproved = userBid?.status === "ACTIVE";
  const isRejected = userBid?.status === "REJECTED";
  const rfpStatusConfig = getStatusConfig(rfp.status);
  const hasDocuments = rfp.documents && rfp.documents.length > 0;

  return (
    <div className="space-y-6">
      {/* Main Info Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border bg-muted/30 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {rfp.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${rfpStatusConfig.bg} ${rfpStatusConfig.text} ${rfpStatusConfig.border}`}
                >
                  {rfpStatusConfig.icon}
                  <span>{rfpStatusConfig.label}</span>
                </div>
                {rfp.priority === "URGENT" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>URGENT</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Details Grid */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Tag className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-mono text-muted-foreground">
                  Category
                </p>
                <p className="text-sm font-medium text-foreground">
                  {rfp.category}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <DollarSign className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-mono text-muted-foreground">
                  Budget
                </p>
                <p className="text-sm font-medium text-foreground">
                  {rfp.currency || "ETB"} {Number(rfp.budget).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-mono text-muted-foreground">
                  Deadline
                </p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(rfp.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Briefcase className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-mono text-muted-foreground">Buyer</p>
                <p className="text-sm font-medium text-foreground">
                  {rfp.buyer?.companyName || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Description
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {rfp.description || "No description provided."}
          </p>
        </div>

        {/* Documents Section - Grid Cards */}
        {hasDocuments && (
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <File className="w-5 h-5 text-primary" />
              Tender Documents ({rfp.documents.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rfp.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => handleViewDocument(doc)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary">View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supplier Action Cards */}
        {isSupplier && rfp.status === "OPEN" && (
          <div className="p-6">
            {canApply && (
              <div className="bg-muted/30 rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Request to Bid
                </h3>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2">
                      Technical Proposal Summary
                    </label>
                    <textarea
                      placeholder="Outline your technical approach..."
                      rows={4}
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2">
                      Proposal Document (PDF)
                    </label>
                    <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      {!selectedFile ? (
                        <div>
                          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">
                            Click to upload PDF
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">
                            {selectedFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                          >
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Application
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {isPending && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-500 mb-1">
                      Pending Review
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your proposal is being reviewed by the buyer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">
                        Application Rejected
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {userBid?.rejectionReason ||
                          "Your application did not meet the requirements."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReapplyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reapply
                  </button>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="bg-muted/30 rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Submit Financial Bid
                </h3>
                <form onSubmit={handleFinancialSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-2">
                      Bid Amount ({rfp.currency || "ETB"})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter your bid amount"
                      value={financialAmount}
                      onChange={(e) =>
                        setFinancialAmount(Number(e.target.value))
                      }
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !financialAmount}
                    className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" /> Submit Financial Bid
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buyer Management - Supplier Cards Grid */}
      {isBuyer && rfp.bids && rfp.bids.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Supplier Applications ({rfp.bids.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rfp.bids.map((bid: any) => {
              const bidStatusConfig = getStatusConfig(bid.status);
              return (
                <div
                  key={bid.id}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {bid.supplier?.businessName || "Unknown Supplier"}
                      </h3>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border mt-2 ${bidStatusConfig.bg} ${bidStatusConfig.text} ${bidStatusConfig.border}`}
                      >
                        {bidStatusConfig.icon}
                        <span>{bidStatusConfig.label}</span>
                      </div>
                    </div>
                    {bid.amount && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Bid Amount
                        </p>
                        <p className="text-lg font-bold text-green-500">
                          {rfp.currency || "ETB"} {bid.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {bid.proposal && (
                    <div className="mb-3 p-3 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {bid.proposal}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {bid.proposalPath && (
                        <>
                          <button
                            onClick={() => {
                              const url = getFileUrl(bid.proposalPath);
                              window.open(url, "_blank");
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/80"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <a
                            href={getFileUrl(bid.proposalPath)}
                            download
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {bid.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(bid.id, "ACTIVE")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                          >
                            <UserCheck className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(bid.id, "REJECTED")
                            }
                            className="flex items-center gap-1 px-3 py-1.5 bg-destructive text-white rounded-lg text-xs font-medium hover:bg-destructive/90"
                          >
                            <UserX className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                      {bid.status === "ACTIVE" && rfp.status === "OPEN" && (
                        <button
                          onClick={() => handleAwardContract(bid.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600"
                        >
                          <Award className="w-3 h-3" />
                          Award
                        </button>
                      )}
                    </div>
                  </div>

                  {bid.rejectionReason && bid.status === "REJECTED" && (
                    <div className="mt-3 p-2 rounded-lg bg-destructive/10">
                      <p className="text-xs text-destructive">
                        {bid.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Bids Message */}
      {isBuyer && (!rfp.bids || rfp.bids.length === 0) && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications yet.</p>
        </div>
      )}

      {/* Modals */}
      <DocumentViewerModal
        isOpen={showDocumentViewer}
        document={selectedDocument}
        onClose={() => {
          setShowDocumentViewer(false);
          setSelectedDocument(null);
        }}
      />

      <ReapplyModal
        isOpen={showReapplyModal}
        onClose={() => setShowReapplyModal(false)}
        onSubmit={handleReapply}
        submitting={submitting}
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
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
