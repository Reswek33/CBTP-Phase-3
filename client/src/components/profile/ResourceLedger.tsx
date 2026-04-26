/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/schemas/auth-schema";
import { cancelRfp, deleteRfp, getMyRfps } from "@/services/api/rfp-api";
import { deleteDocument } from "@/services/api/supplier-api";
import React, { useState, useEffect } from "react";

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
    } finally {
      setLoadingRfps(false);
    }
  };

  const onRemoveFile = async (docId: string) => {
    if (!window.confirm("CONFIRM_FILE_PURGE?")) return;
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.response?.data?.message || "FILE_PURGE_FAILED");
    }
  };

  const onCancelRfp = async (rfpId: string) => {
    if (!window.confirm("CONFIRM_RFP_TERMINATION?")) return;
    try {
      await cancelRfp(rfpId);
      setRfps((prev) =>
        prev.map((r) => (r.id === rfpId ? { ...r, status: "CANCELLED" } : r)),
      );
    } catch (err: any) {
      console.error(err);
      alert("CANCELLATION_FAILED");
    }
  };

  const onDeleteRfp = async (rfpId: string) => {
    if (
      !window.confirm(
        "⚠️ PERMANENT_ACTION: This will permanently delete this RFP. CONFIRM?",
      )
    )
      return;

    setDeletingRfpId(rfpId);
    try {
      await deleteRfp(rfpId);
      setRfps((prev) => prev.filter((r) => r.id !== rfpId));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "DELETE_OPERATION_FAILED";
      alert(errorMsg.toUpperCase());
    } finally {
      setDeletingRfpId(null);
    }
  };

  if (isBuyer) {
    return (
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>
          REQUEST_LEDGER
          <button
            onClick={fetchMyRfps}
            style={styles.refreshBtn}
            disabled={loadingRfps}
          >
            {loadingRfps ? "⟳" : "↻"}
          </button>
        </h3>

        {loadingRfps ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p>FETCHING_RFPS...</p>
          </div>
        ) : rfps.length === 0 ? (
          <div style={styles.emptyState}>
            <p>NO_RFPS_FOUND</p>
            <small>Create your first RFP to get started</small>
          </div>
        ) : (
          <ul style={styles.list}>
            {rfps.map((rfp) => (
              <li key={rfp.id} style={styles.listItem}>
                <div style={styles.rfpInfo}>
                  <p style={styles.itemName}>{rfp.title}</p>
                  <div style={styles.rfpMeta}>
                    <small
                      style={{
                        ...styles.metaText,
                        ...styles.statusTag,
                        backgroundColor:
                          rfp.status === "ACTIVE"
                            ? "#C6F6D5"
                            : rfp.status === "CANCELLED"
                              ? "#FED7D7"
                              : rfp.status === "CLOSED"
                                ? "#E2E8F0"
                                : "#FEFCBF",
                        color:
                          rfp.status === "ACTIVE"
                            ? "#22543D"
                            : rfp.status === "CANCELLED"
                              ? "#742A2A"
                              : rfp.status === "CLOSED"
                                ? "#4A5568"
                                : "#744210",
                      }}
                    >
                      {rfp.status}
                    </small>
                    <small style={styles.metaText}>
                      Deadline: {new Date(rfp.deadline).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div style={styles.actionButtons}>
                  {rfp.status !== "CANCELLED" && rfp.status !== "CLOSED" && (
                    <button
                      onClick={() => onCancelRfp(rfp.id)}
                      style={styles.cancelBtn}
                    >
                      CANCEL
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteRfp(rfp.id)}
                    style={styles.deleteBtn}
                    disabled={deletingRfpId === rfp.id}
                  >
                    {deletingRfpId === rfp.id ? "..." : "DELETE"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <h3 style={styles.sectionTitle}>DOCUMENT_VAULT</h3>
      <ul style={styles.list}>
        {documents.length === 0 ? (
          <div style={styles.emptyState}>
            <p>NO_DOCUMENTS_FOUND</p>
            <small>Upload documents in onboarding section</small>
          </div>
        ) : (
          documents.map((doc) => (
            <li key={doc.id} style={styles.listItem}>
              <div>
                <p style={styles.itemName}>{doc.fileName}</p>
                <small style={styles.metaText}>
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </small>
              </div>
              <button
                onClick={() => onRemoveFile(doc.id)}
                style={styles.purgeBtn}
              >
                PURGE
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "#fff",
    padding: "24px",
    border: "2px solid #0F172A",
    boxShadow: "6px 6px 0px #0F172A",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "11px",
    fontWeight: "900",
    color: "#3182ce",
    letterSpacing: "1.5px",
    borderBottom: "1px solid #E2E8F0",
    paddingBottom: "8px",
    textTransform: "uppercase",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshBtn: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    margin: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    border: "1px solid #E2E8F0",
    gap: "12px",
  },
  rfpInfo: { flex: 1 },
  rfpMeta: {
    display: "flex",
    gap: "12px",
    marginTop: "6px",
    alignItems: "center",
  },
  statusTag: { padding: "2px 6px", fontSize: "9px", fontWeight: "900" },
  itemName: { margin: 0, fontSize: "11px", fontWeight: "800" },
  metaText: { fontSize: "10px", fontWeight: "700", textTransform: "uppercase" },
  purgeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#E53E3E",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    borderBottom: "2px solid #E53E3E",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ED8936",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    borderBottom: "2px solid #ED8936",
    marginRight: "8px",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#E53E3E",
    fontSize: "10px",
    fontWeight: "900",
    cursor: "pointer",
    borderBottom: "2px solid #E53E3E",
  },
  actionButtons: { display: "flex", gap: "8px" },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    gap: "12px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid #E2E8F0",
    borderTop: "2px solid #3182CE",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#718096",
    fontSize: "11px",
    fontWeight: "700",
  },
};
