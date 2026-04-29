 
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMe, updateCredentials } from "../services/api/auth-api";
import {
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  X,
  Edit2,
  FileText,
  Download,
  Eye as ViewIcon,
  CheckCircle2,
  AlertCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Save,
  Activity,
} from "lucide-react";
import type { User as UserType } from "@/schemas/auth-schema";

// Helper function to get file URL
const getFileUrl = (filePath: string) => {
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
  document: any;
  onClose: () => void;
}> = ({ isOpen, document, onClose }) => {
  if (!isOpen || !document) return null;

  const fileUrl = getFileUrl(document.filePath);
  const isImage = document.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = document.fileName?.match(/\.pdf$/i);

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
              <span className="text-green-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified on {new Date(document.verifiedAt).toLocaleString()}
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pending verification
              </span>
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

// Password Change Modal Component
const PasswordChangeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCredentials({
        tempPassword: currentPassword,
        newPassword: newPassword,
      });
      setSuccess("Password updated successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Change Password
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
              {success}
            </div>
          )}

          <div className="relative">
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              Current Password
            </label>
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-primary"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              New Password
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-primary"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              Confirm New Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-muted-foreground hover:text-primary"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const refreshUser = async () => {
    try {
      const response = await getMe();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [authUser]);

  const getBusinessName = (userData: UserType) => {
    if (userData.role === "BUYER")
      return userData.buyer?.companyName || "Not provided";
    if (userData.role === "SUPPLIER")
      return userData.supplier?.businessName || "Not provided";
    return "Not provided";
  };

  const getBusinessType = (userData: UserType) => {
    if (userData.role === "BUYER")
      return userData.buyer?.companyType || "Not provided";
    if (userData.role === "SUPPLIER")
      return userData.supplier?.businessType || "Not provided";
    return "Not provided";
  };

  const getPhoneNumber = (userData: UserType) => {
    if (userData.role === "SUPPLIER") return userData.supplier?.phone;
    if (userData.role === "BUYER") return userData.buyer?.phone;
    return null;
  };

  const getTaxId = (userData: UserType) => {
    if (userData.role === "SUPPLIER") return userData.supplier?.taxId;
    if (userData.role === "BUYER") return userData.buyer?.taxId;
    return null;
  };

  const getAddress = (userData: UserType) => {
    if (userData.role === "SUPPLIER") return userData.supplier?.address;
    if (userData.role === "BUYER") return userData.buyer?.address;
    return null;
  };

  const getIndustrySector = (userData: UserType) => {
    if (userData.role === "BUYER") return userData.buyer?.industrySector;
    return null;
  };

  const getVerificationStatus = () => {
    if (!user) return { verified: false, status: "PENDING" };
    if (user.role === "SUPPLIER") {
      return {
        verified: user.supplier?.status === "VERIFIED",
        status: user.supplier?.status || "PENDING",
      };
    }
    if (user.role === "BUYER") {
      return {
        verified: user.buyer?.status === "VERIFIED",
        status: user.buyer?.status || "PENDING",
      };
    }
    return { verified: true, status: "VERIFIED" };
  };

  const getDocuments = () => {
    if (!user) return [];
    if (user.role === "SUPPLIER") return user.supplier?.documents || [];
    if (user.role === "BUYER") return user.buyer?.documents || [];
    return [];
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_PROFILE...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const isBuyer = user.role === "BUYER";
  const isSupplier = user.role === "SUPPLIER";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
  const verification = getVerificationStatus();
  const documents = getDocuments();

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <User className="w-4 h-4" />,
      show: true,
    },
    {
      id: "business",
      label: "Business",
      icon: <Building2 className="w-4 h-4" />,
      show: !isAdmin,
    },
    {
      id: "documents",
      label: "Legal Documents",
      icon: <FileText className="w-4 h-4" />,
      show: !isAdmin && documents.length > 0,
      badge: documents.length,
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="w-4 h-4" />,
      show: true,
    },
    {
      id: "activity",
      label: "Activity",
      icon: <TrendingUp className="w-4 h-4" />,
      show: !isAdmin,
    },
  ].filter((tab) => tab.show);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="relative h-32 bg-linear-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end justify-between -mt-12">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl ring-4 ring-background">
                  <span className="text-4xl font-black text-primary-foreground">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                  </span>
                </div>
                {verification.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-background">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </h1>
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg font-mono
                    ${
                      isAdmin
                        ? "bg-purple-600/20 text-purple-400 border border-purple-600/30"
                        : isBuyer
                          ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                          : "bg-green-600/20 text-green-400 border border-green-600/30"
                    }`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg font-mono
                    ${
                      verification.verified
                        ? "bg-green-600/20 text-green-400 border border-green-600/30"
                        : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                    }`}
                  >
                    {verification.verified ? "VERIFIED" : verification.status}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  @{user.username}
                </p>
              </div>
            </div>

            {!isAdmin && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                  bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {isEditing ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Edit2 className="w-4 h-4" />
                )}
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              MEMBER SINCE
            </span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                })
              : "N/A"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              DOCUMENTS
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {documents.length} Uploaded
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              ACCOUNT STATUS
            </span>
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-green-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ACTIVE
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-all duration-200 relative flex items-center gap-2 whitespace-nowrap
                ${activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-primary/20 text-primary rounded-full">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="rounded-2xl p-6 bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      First Name
                    </label>
                    <p className="text-foreground font-medium">
                      {user.firstName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Last Name
                    </label>
                    <p className="text-foreground font-medium">
                      {user.lastName}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">
                      {getPhoneNumber(user) || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Username
                  </label>
                  <p className="text-foreground font-mono text-sm">
                    @{user.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="rounded-2xl p-6 bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Account Type
                  </label>
                  <p className="text-foreground capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Verification Status
                  </label>
                  <div className="flex items-center gap-2">
                    {verification.verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-green-500">Verified Account</p>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-500" />
                        <p className="text-amber-500">Pending Verification</p>
                      </>
                    )}
                  </div>
                  {!verification.verified && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete your profile and upload required documents to get
                      verified
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Account Created
                  </label>
                  <p className="text-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Information not available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information Summary */}
            {(isBuyer || isSupplier) && !isAdmin && (
              <div className="lg:col-span-2 rounded-2xl p-6 bg-card border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      {isBuyer ? "Company Name" : "Business Name"}
                    </label>
                    <p className="text-foreground font-medium">
                      {getBusinessName(user)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Business Type
                    </label>
                    <p className="text-foreground">{getBusinessType(user)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Tax ID / TIN
                    </label>
                    <p className="text-foreground">
                      {getTaxId(user) || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Industry Sector
                    </label>
                    <p className="text-foreground">
                      {getIndustrySector(user) || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Tab */}
        {activeTab === "business" && (isBuyer || isSupplier) && !isAdmin && (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    {isBuyer ? "Company Name" : "Business Name"}
                  </label>
                  <p className="text-foreground text-lg font-semibold">
                    {getBusinessName(user)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Business Type
                  </label>
                  <p className="text-foreground">{getBusinessType(user)}</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Tax ID / TIN
                  </label>
                  <p className="text-foreground">
                    {getTaxId(user) || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Phone Number
                  </label>
                  <p className="text-foreground">
                    {getPhoneNumber(user) || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Address
                  </label>
                  <p className="text-foreground">
                    {getAddress(user) || "Not provided"}
                  </p>
                </div>
                {isBuyer && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Industry Sector
                      </label>
                      <p className="text-foreground">
                        {user.buyer?.industrySector || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Department
                      </label>
                      <p className="text-foreground">
                        {user.buyer?.department || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Position
                      </label>
                      <p className="text-foreground">
                        {user.buyer?.position || "Not provided"}
                      </p>
                    </div>
                  </>
                )}
                {isSupplier && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Registration Number
                      </label>
                      <p className="text-foreground font-mono text-sm">
                        {user.supplier?.registrationNumber || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Years in Business
                      </label>
                      <p className="text-foreground">
                        {user.supplier?.yearsInBusiness || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Categories
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.supplier?.categories?.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs"
                          >
                            {cat}
                          </span>
                        )) || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Bio
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {user.supplier?.bio || "Not provided"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Legal Documents Tab */}
        {activeTab === "documents" && !isAdmin && documents.length > 0 && (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Legal & Verification Documents
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>Verified</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span>Pending</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleViewDocument(doc)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {doc.documentType.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {doc.fileName} •{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      {doc.verifiedAt && (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified on{" "}
                          {new Date(doc.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.verifiedAt ? (
                      <div className="px-2 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </div>
                    ) : (
                      <div className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(doc);
                      }}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ViewIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <a
                      href={getFileUrl(doc.filePath)}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Document Verification
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All documents are reviewed by our compliance team. Verified
                    documents help build trust with potential business partners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security Settings
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Change Password
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your password regularly to keep your account secure
                </p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Change Password
                </button>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && !isAdmin && (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {user.activityLogs && user.activityLogs.length > 0 ? (
                user.activityLogs.slice(0, 10).map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No activity recorded yet</p>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={refreshUser}
      />

      <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
            animation: fade-in 0.3s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        `}</style>
    </div>
  );
};
