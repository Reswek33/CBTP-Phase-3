/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/schemas/auth-schema";
import { cancelRfp, deleteRfp, getMyRfps } from "@/services/api/rfp-api";
import { deleteDocument } from "@/services/api/supplier-api";
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

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
        return <AlertTriangle className="w-4 h-4" />;
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
  type?: "warning" | "danger" | "info";
}> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isSubmitting = false,
  type = "warning",
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <AlertCircle className="w-12 h-12 text-destructive" />,
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

  const styles = getStyles();

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
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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

interface ResourceLedgerProps {
  user: User;
}

export const ResourceLedger: React.FC<ResourceLedgerProps> = ({ user }) => {
  const [documents, setDocuments] = useState<any[]>(
    user?.supplier?.documents || [],
  );
  const [rfps, setRfps] = useState<any[]>([]);
  const [loadingRfps, setLoadingRfps] = useState(false);
  const [deletingRfpId, setDeletingRfpId] = useState<string | null>(null);
  const [cancellingRfpId, setCancellingRfpId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    message: "",
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    id: string;
    name?: string;
  } | null>(null);

  const isBuyer = user?.role === "BUYER";

  useEffect(() => {
    if (isBuyer) {
      fetchMyRfps();
    }
  }, [user]);

  const fetchMyRfps = async () => {
    setLoadingRfps(true);
    try {
      const res = await getMyRfps();
      console.log(res);
      setRfps(res.data);
    } catch (err) {
      console.error("RFP_FETCH_ERROR", err);
      setToast({ message: "Failed to fetch your RFPs", type: "error" });
    } finally {
      setLoadingRfps(false);
    }
  };

  const confirmDeleteDocument = (docId: string, fileName: string) => {
    setPendingAction({ type: "delete_document", id: docId, name: fileName });
    setShowConfirmModal(true);
  };

  const confirmCancelRfp = (rfpId: string, rfpTitle: string) => {
    setPendingAction({ type: "cancel_rfp", id: rfpId, name: rfpTitle });
    setShowConfirmModal(true);
  };

  const confirmDeleteRfp = (rfpId: string, rfpTitle: string) => {
    setPendingAction({ type: "delete_rfp", id: rfpId, name: rfpTitle });
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    const { type, id, name } = pendingAction;

    switch (type) {
      case "delete_document":
        setDeletingDocId(id);
        try {
          await deleteDocument(id);
          setDocuments((prev) => prev.filter((d) => d.id !== id));
          setSuccessMessage({
            title: "Document Deleted",
            message: `"${name}" has been permanently removed from your vault.`,
          });
          setShowSuccessModal(true);
        } catch (err: any) {
          setToast({
            message: err.response?.data?.message || "Failed to delete document",
            type: "error",
          });
        } finally {
          setDeletingDocId(null);
        }
        break;

      case "cancel_rfp":
        setCancellingRfpId(id);
        try {
          await cancelRfp(id);
          setRfps((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)),
          );
          setSuccessMessage({
            title: "RFP Cancelled",
            message: `"${name}" has been cancelled successfully.`,
          });
          setShowSuccessModal(true);
        } catch (err: any) {
          setToast({
            message: err.response?.data?.message || "Failed to cancel RFP",
            type: "error",
          });
        } finally {
          setCancellingRfpId(null);
        }
        break;

      case "delete_rfp":
        setDeletingRfpId(id);
        try {
          await deleteRfp(id);
          setRfps((prev) => prev.filter((r) => r.id !== id));
          setSuccessMessage({
            title: "RFP Permanently Deleted",
            message: `"${name}" has been permanently removed from the system.`,
          });
          setShowSuccessModal(true);
        } catch (err: any) {
          setToast({
            message: err.response?.data?.message || "Failed to delete RFP",
            type: "error",
          });
        } finally {
          setDeletingRfpId(null);
        }
        break;
    }

    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const getConfirmModalProps = () => {
    if (!pendingAction)
      return {
        title: "",
        message: "",
        confirmText: "",
        type: "warning" as const,
      };

    switch (pendingAction.type) {
      case "delete_document":
        return {
          title: "Delete Document",
          message: `Are you sure you want to permanently delete "${pendingAction.name}"? This action cannot be undone.`,
          confirmText: "Yes, Delete",
          type: "danger" as const,
        };
      case "cancel_rfp":
        return {
          title: "Cancel RFP",
          message: `Are you sure you want to cancel "${pendingAction.name}"? Suppliers will be notified that this RFP is no longer active.`,
          confirmText: "Yes, Cancel",
          type: "warning" as const,
        };
      case "delete_rfp":
        return {
          title: "Permanently Delete RFP",
          message: `⚠️ WARNING: This will permanently delete "${pendingAction.name}". This action cannot be undone. All associated bids will also be deleted. Are you absolutely sure?`,
          confirmText: "Yes, Permanently Delete",
          type: "danger" as const,
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "",
          type: "warning" as const,
        };
    }
  };

  const modalProps = getConfirmModalProps();

  if (isBuyer) {
    return (
      <>
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
          title={successMessage.title}
          message={successMessage.message}
          onClose={() => setShowSuccessModal(false)}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={modalProps.title}
          message={modalProps.message}
          confirmText={modalProps.confirmText}
          cancelText="Cancel"
          onConfirm={executeAction}
          onCancel={() => {
            setShowConfirmModal(false);
            setPendingAction(null);
          }}
          isSubmitting={!!(deletingDocId || cancellingRfpId || deletingRfpId)}
          type={modalProps.type}
        />

        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5 pb-2 border-b border-border">
            <h3 className="text-xs font-black text-primary tracking-wider uppercase">
              Request Ledger
            </h3>
            <button
              onClick={fetchMyRfps}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              disabled={loadingRfps}
            >
              {loadingRfps ? "⟳" : "↻"}
            </button>
          </div>

          {loadingRfps ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-mono text-muted-foreground">
                Fetching RFPs...
              </p>
            </div>
          ) : rfps.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-xs font-mono font-bold">NO RFPS FOUND</p>
              <small className="text-[10px]">
                Create your first RFP to get started
              </small>
            </div>
          ) : (
            <ul className="space-y-2">
              {rfps.map((rfp) => (
                <li
                  key={rfp.id}
                  className="flex justify-between items-center p-3 border border-border"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground m-0">
                      {rfp.title}
                    </p>
                    <div className="flex gap-3 mt-1.5 items-center">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                          rfp.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : rfp.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : rfp.status === "CLOSED"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {rfp.status}
                      </span>
                      <small className="text-[9px] font-bold text-muted-foreground uppercase">
                        Deadline: {new Date(rfp.deadline).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {rfp.status !== "CANCELLED" && rfp.status !== "CLOSED" && (
                      <button
                        onClick={() => confirmCancelRfp(rfp.id, rfp.title)}
                        disabled={cancellingRfpId === rfp.id}
                        className="text-amber-600 text-[9px] font-bold border-b-2 border-amber-600 hover:opacity-70 transition-opacity disabled:opacity-50"
                      >
                        {cancellingRfpId === rfp.id ? "..." : "CANCEL"}
                      </button>
                    )}
                    <button
                      onClick={() => confirmDeleteRfp(rfp.id, rfp.title)}
                      disabled={deletingRfpId === rfp.id}
                      className="text-destructive text-[9px] font-bold border-b-2 border-destructive hover:opacity-70 transition-opacity disabled:opacity-50"
                    >
                      {deletingRfpId === rfp.id ? "..." : "DELETE"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    );
  }

  return (
    <>
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
        title={successMessage.title}
        message={successMessage.message}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={modalProps.title}
        message={modalProps.message}
        confirmText={modalProps.confirmText}
        cancelText="Cancel"
        onConfirm={executeAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingAction(null);
        }}
        isSubmitting={!!deletingDocId}
        type={modalProps.type}
      />

      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-black text-primary tracking-wider uppercase mb-5 pb-2 border-b border-border">
          Document Vault
        </h3>
        <ul className="space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-xs font-mono font-bold">NO DOCUMENTS FOUND</p>
              <small className="text-[10px]">
                Upload documents in onboarding section
              </small>
            </div>
          ) : (
            documents.map((doc) => (
              <li
                key={doc.id}
                className="flex justify-between items-center p-3 border border-border"
              >
                <div>
                  <p className="text-xs font-bold text-foreground m-0">
                    {doc.fileName}
                  </p>
                  <small className="text-[9px] font-bold text-muted-foreground uppercase">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </small>
                </div>
                <button
                  onClick={() => confirmDeleteDocument(doc.id, doc.fileName)}
                  disabled={deletingDocId === doc.id}
                  className="flex items-center gap-1 text-destructive text-[9px] font-bold border-b-2 border-destructive hover:opacity-70 transition-opacity disabled:opacity-50"
                >
                  {deletingDocId === doc.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  PURGE
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

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
    </>
  );
};
