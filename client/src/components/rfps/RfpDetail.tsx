/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { getRfpsById } from "../../services/api/rfp-api";
import {
  applyToBid,
  updateApplicationStatus,
} from "../../services/api/bid-api";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import {
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Upload,
  File,
  Eye,
  UserCheck,
  UserX,
  Download,
  Send,
  Users,
} from "lucide-react";

const getFileUrl = (filePath: string) => {
  if (!filePath) return "";
  return `/${filePath.startsWith("/") ? filePath.slice(1) : filePath}`;
};

export const RfpDetail = ({ rfpId }: { rfpId: string }) => {
  const { user } = useAuth();
  const [rfp, setRfp] = useState<any>(null);
  const [userBid, setUserBid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Document states
  const [proposalText, setProposalText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getRfpsById(rfpId);
      setRfp(response.data);
      const existingBid = response.data.bids?.find(
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
    if (!socket || !rfpId) return;

    socket.emit("join_rfp", rfpId);

    const handleUpdate = () => fetchData();

    socket.on("new_application_received", handleUpdate);
    socket.on("bid_status_updated", handleUpdate);
    socket.on("rfp_status_changed", handleUpdate);
    socket.on("rfp_cancelled", handleUpdate);

    return () => {
      socket.off("new_application_received", handleUpdate);
      socket.off("bid_status_updated", handleUpdate);
      socket.off("rfp_status_changed", handleUpdate);
      socket.off("rfp_cancelled", handleUpdate);
      if (socket.connected) {
        socket.emit("leave_rfp", rfpId);
      }
    };
  }, [socket, rfpId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please upload a proposal PDF");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proposal", proposalText);
      formData.append("proposalFile", selectedFile);
      await applyToBid(rfpId, formData);
      alert("Application submitted! Wait for technical approval.");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Application failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (
    bidId: string,
    newStatus: "ACTIVE" | "REJECTED",
  ) => {
    const reason =
      newStatus === "REJECTED" ? prompt("Reason for rejection:") : "";
    try {
      setSubmitting(true);
      await updateApplicationStatus(bidId, {
        status: newStatus,
        rejectionReason: reason || "",
      });
      fetchData();
    } catch (err) {
      alert("Status update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse">Loading RFP Data...</div>
    );
  if (!rfp) return <div className="p-20 text-center">RFP not found</div>;

  const isBuyer = user?.role === "BUYER" && rfp.buyerId === user?.id;
  const canApply =
    user?.role === "SUPPLIER" && !userBid && rfp.status === "OPEN";

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header Section */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                {rfp.category}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${rfp.status === "OPEN" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}
              >
                {rfp.status}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              {rfp.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {rfp.description}
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-2xl border border-border min-w-[280px] space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Budget Range
                </p>
                <p className="text-xl font-bold">
                  {rfp.currency} {Number(rfp.budget).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">
                  Deadline
                </p>
                <p className="text-md font-medium">
                  {new Date(rfp.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Documents & Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Technical Proposal Submission (Supplier Only) */}
          {canApply && (
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> Submit Technical
                Proposal
              </h3>
              <form onSubmit={handleApply} className="space-y-4">
                <textarea
                  placeholder="Summarize your technical approach..."
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                />
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer border-2 border-dashed border-border p-4 rounded-xl hover:bg-muted/50 transition-colors text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                    <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedFile
                        ? selectedFile.name
                        : "Upload Technical PDF"}
                    </span>
                  </label>
                  <button
                    disabled={submitting}
                    className="h-full px-8 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Supplier Application Status */}
          {userBid && !isBuyer && (
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${userBid.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}
                >
                  {userBid.status === "ACTIVE" ? <CheckCircle /> : <Clock />}
                </div>
                <div>
                  <h4 className="font-bold">
                    Application Status: {userBid.status.replace("_", " ")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {userBid.status === "ACTIVE"
                      ? "You are shortlisted! You can join the Bid Room once invited."
                      : "Your proposal is under technical review."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Proposals Grid (Buyer Only) */}
          {isBuyer && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" /> Submitted Proposals
                </h2>
                <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                  {rfp.bids?.length || 0} Submissions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rfp.bids?.map((bid: any) => (
                  <div
                    key={bid.id}
                    className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg">
                          {bid.supplier?.businessName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {bid.supplier?.user?.email || bid.supplier?.phone}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bid.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}
                      >
                        {bid.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 italic">
                      "{bid.proposal}"
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <a
                        href={getFileUrl(bid.proposalPath)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted hover:bg-border rounded-lg text-xs font-bold transition-colors"
                      >
                        <Eye className="w-3 h-3" /> View Proposal
                      </a>

                      {bid.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(bid.id, "ACTIVE")}
                            className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20"
                            title="Shortlist for Bid Room"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(bid.id, "REJECTED")
                            }
                            className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"
                            title="Reject Proposal"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata & Files */}
        <div className="space-y-6">
          {/* RFP Original Documents */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <File className="w-4 h-4 text-primary" /> Reference Documents
            </h3>
            <div className="space-y-3">
              {rfp.documents?.map((doc: any) => (
                <a
                  key={doc.id}
                  href={getFileUrl(doc.filePath)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium truncate flex-1">
                    {doc.fileName}
                  </span>
                  <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Bid Room Link (If shortlisted) */}
          {userBid?.status === "ACTIVE" && (
            <div className="bg-primary p-6 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
              <h4 className="font-bold mb-2">Technical Approval Passed!</h4>
              <p className="text-sm opacity-90 mb-4">
                You are eligible for the Invitation Bid Room. Keep an eye on
                your invitations.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/20 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" /> ELIGIBLE_FOR_BID_ROOM
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
