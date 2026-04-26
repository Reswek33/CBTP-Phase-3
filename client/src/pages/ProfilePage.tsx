/* eslint-disable react-hooks/exhaustive-deps */
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
  Key,
  TrendingUp,
  CheckCircle,
  Clock,
  Save,
  X,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Activity,
} from "lucide-react";
import type { User as UserType } from "@/schemas/auth-schema";

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    tempPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const refreshUser = async () => {
    try {
      const response = await getMe();
      if (response.success && response.user) {
        setUser(response.user);
        // Initialize form data with current values
        setFormData({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          phone: getPhoneNumber(response.user),
          address: getAddress(response.user),
          ...(response.user.role === "SUPPLIER" && {
            businessName: response.user.supplier?.businessName,
            businessType: response.user.supplier?.businessType,
            taxId: response.user.supplier?.taxId,
            registrationNumber: response.user.supplier?.registrationNumber,
            yearsInBusiness: response.user.supplier?.yearsInBusiness,
            categories: response.user.supplier?.categories?.join(", "),
            bio: response.user.supplier?.bio,
          }),
          ...(response.user.role === "BUYER" && {
            companyName: response.user.buyer?.companyName,
            companyType: response.user.buyer?.companyType,
            taxId: response.user.buyer?.taxId,
            industrySector: response.user.buyer?.industrySector,
            department: response.user.buyer?.department,
            position: response.user.buyer?.position,
          }),
        });
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // API call to update profile
      // await updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCredentials({
        tempPassword: passwordData.tempPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess("Password updated successfully!");
      setPasswordData({
        tempPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsUpdatingPassword(false);
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || "Failed to update password",
      );
    } finally {
      setIsSubmitting(false);
    }
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

            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      {isBuyer ? "Company Name" : "Business Name"} *
                    </label>
                    <input
                      type="text"
                      name={isBuyer ? "companyName" : "businessName"}
                      defaultValue={getBusinessName(user)}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      defaultValue={
                        getBusinessType(user) !== "Not provided"
                          ? getBusinessType(user)
                          : ""
                      }
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Select type</option>
                      <option>Individual / Freelancer</option>
                      <option>LLC / Corporation</option>
                      <option>Partnership</option>
                      <option>Enterprise</option>
                      <option>Government</option>
                      <option>Non-Profit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Tax ID / TIN
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      defaultValue={getTaxId(user) || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      placeholder="Enter tax identification number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={getPhoneNumber(user) || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={getAddress(user) || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      placeholder="Business address"
                    />
                  </div>
                  {isBuyer && (
                    <>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Industry Sector
                        </label>
                        <select
                          name="industrySector"
                          defaultValue={user.buyer?.industrySector || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                        >
                          <option value="">Select sector</option>
                          <option>Real Estate</option>
                          <option>Infrastructure</option>
                          <option>Technology</option>
                          <option>Healthcare</option>
                          <option>Manufacturing</option>
                          <option>Retail</option>
                          <option>Energy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          name="department"
                          defaultValue={user.buyer?.department || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Position
                        </label>
                        <input
                          type="text"
                          name="position"
                          defaultValue={user.buyer?.position || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                  {isSupplier && (
                    <>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          name="registrationNumber"
                          defaultValue={user.supplier?.registrationNumber || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Years in Business
                        </label>
                        <input
                          type="number"
                          name="yearsInBusiness"
                          defaultValue={user.supplier?.yearsInBusiness || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Categories (comma-separated)
                        </label>
                        <input
                          type="text"
                          name="categories"
                          defaultValue={
                            user.supplier?.categories?.join(", ") || ""
                          }
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                          placeholder="e.g., Construction, Supply, Logistics"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          defaultValue={user.supplier?.bio || ""}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none resize-none"
                          placeholder="Tell buyers about your business"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Security Settings
            </h3>

            {!isUpdatingPassword ? (
              <div>
                <button
                  onClick={() => setIsUpdatingPassword(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            ) : (
              <form
                onSubmit={handlePasswordUpdate}
                className="space-y-4 max-w-md"
              >
                {passwordError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                    {passwordSuccess}
                  </div>
                )}
                <div className="relative">
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Current Password
                  </label>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.tempPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        tempPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-8 text-muted-foreground hover:text-primary"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
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
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-8 text-muted-foreground hover:text-primary"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUpdatingPassword(false)}
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-border">
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

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
