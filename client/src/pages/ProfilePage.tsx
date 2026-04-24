/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMe } from "../services/api/auth-api";
import {
  User,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Shield,
  Key,
  FileText,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { User as UserType } from "@/schemas/auth-schema";

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const refreshUser = async () => {
    try {
      const response = await getMe();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  useEffect(() => {
    if (authUser) {
      setUser(authUser as UserType);
    }
  }, [authUser]);

  if (!user) return null;

  // Type-safe property access based on role
  const isBuyer = user.role === "BUYER";
  const isSupplier = user.role === "SUPPLIER";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

  // Safely access role-specific properties
  const isVerified = isSupplier
    ? user.supplier?.status === "VERIFIED"
    : isBuyer
      ? user.buyer?.status === "VERIFIED"
      : true;

  console.log(user.supplier?.status);
  console.log(isVerified);

  // Get business name based on role - FIXED AND USED
  const getBusinessName = () => {
    if (isBuyer) return user.buyer?.companyName || "Not provided";
    if (isSupplier) return user.supplier?.businessName || "Not provided";
    return "Not provided";
  };

  // Get business type based on role - FIXED AND USED
  const getBusinessType = () => {
    if (isBuyer) return user.buyer?.companyType || "Not provided";
    if (isSupplier) return user.supplier?.businessType || "Not provided";
    return "Not provided";
  };

  // Get phone number based on role
  const getPhoneNumber = () => {
    if (isSupplier) return user.supplier?.phone;
    if (isBuyer) return user.buyer?.phone;
    return null;
  };

  // Get tax ID for suppliers - FIXED AND USED
  const getTaxId = () => {
    if (isSupplier) return user.supplier?.taxId || "Not provided";
    if (isBuyer) return user.buyer?.taxId || "Not provided";
    return "Not provided";
  };

  // Get address based on role
  const getAddress = () => {
    if (isSupplier) return user.supplier?.address;
    if (isBuyer) return user.buyer?.address;
    return null;
  };

  // Get industry/sector based on role
  const getIndustrySector = () => {
    if (isBuyer) return user.buyer?.industrySector;
    return null;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    {
      id: "business",
      label: "Business",
      icon: <Building2 className="w-4 h-4" />,
    },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    ...(!isAdmin
      ? [
          {
            id: "activity",
            label: "Activity",
            icon: <TrendingUp className="w-4 h-4" />,
          },
        ]
      : []),
  ];

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
    // Save logic here
    setIsEditing(false);
    await refreshUser();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-2xl p-6 relative overflow-hidden bg-card border border-border">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-transparent"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex items-center space-x-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-black text-primary-foreground">
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                  </span>
                </div>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center border-2 border-background">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </h1>
                  <span
                    className={`
                    px-2.5 py-1 text-xs font-bold rounded-lg font-mono
                    ${
                      user.role === "ADMIN" || user.role === "SUPERADMIN"
                        ? "bg-purple-600/20 text-purple-400 border border-purple-600/30"
                        : isBuyer
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-green-600/20 text-green-400 border border-green-600/30"
                    }
                  `}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`
                    px-2.5 py-1 text-xs font-bold rounded-lg font-mono
                    ${
                      isVerified
                        ? "bg-green-600/20 text-green-400 border border-green-600/30"
                        : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                    }
                  `}
                  >
                    {isVerified ? "VERIFIED" : "PENDING"}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  @{user.username}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 border border-border"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              MEMBER SINCE
            </span>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                })
              : "N/A"}
          </p>
        </div>

        <div className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              ACCOUNT STATUS
            </span>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-green-500">ACTIVE</p>
        </div>

        <div className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              ROLE
            </span>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground">{user.role}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-5 py-3 text-sm font-medium transition-all duration-200 relative
                flex items-center space-x-2
                ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
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
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      defaultValue={`${user.firstName} ${user.lastName}`}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    />
                  ) : (
                    <p className="text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                  )}
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
                      {getPhoneNumber() || "Not provided"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Username
                  </label>
                  <p className="text-foreground">@{user.username}</p>
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
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-green-500">Verified</p>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-500" />
                        <p className="text-amber-500">Pending Verification</p>
                      </>
                    )}
                  </div>
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

            {/* Business Information - USING THE FUNCTIONS */}
            {(isBuyer || isSupplier) && (
              <div className="lg:col-span-2 rounded-2xl p-6 bg-card border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name - Using getBusinessName() */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      {isBuyer ? "Company Name" : "Business Name"}
                    </label>
                    <p className="text-foreground font-medium">
                      {getBusinessName()}
                    </p>
                  </div>

                  {/* Business Type - Using getBusinessType() */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Business Type
                    </label>
                    <p className="text-foreground">{getBusinessType()}</p>
                  </div>

                  {/* Tax ID - Using getTaxId() */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Tax ID / TIN
                    </label>
                    <p className="text-foreground">{getTaxId()}</p>
                  </div>

                  {/* Industry Sector */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Industry Sector
                    </label>
                    <p className="text-foreground">
                      {getIndustrySector() || "Not provided"}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Address
                    </label>
                    <p className="text-foreground">
                      {getAddress() || "Not provided"}
                    </p>
                  </div>

                  {/* Role-specific additional fields */}
                  {isSupplier && (
                    <>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Registration Number
                        </label>
                        <p className="text-foreground">
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
                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Categories
                        </label>
                        <p className="text-foreground">
                          {user.supplier?.categories?.join(", ") ||
                            "Not provided"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Bio
                        </label>
                        <p className="text-foreground">
                          {user.supplier?.bio || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted-foreground mb-1">
                          Supplier Status
                        </label>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.supplier?.status === "APPROVED"
                                ? "bg-green-500"
                                : "bg-amber-500"
                            }`}
                          ></div>
                          <p className="text-foreground">
                            {user.supplier?.status || "PENDING"}
                          </p>
                        </div>
                      </div>
                      {user.supplier?.rejectedReason && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-mono text-muted-foreground mb-1">
                            Rejection Reason
                          </label>
                          <p className="text-red-500 text-sm">
                            {user.supplier.rejectedReason}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {isBuyer && (
                    <>
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Tab - USING THE FUNCTIONS */}
        {activeTab === "business" && (
          <div className="rounded-2xl p-6 bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Business Details
            </h3>

            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name Field */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      {isBuyer ? "Company Name" : "Business Name"}
                    </label>
                    <input
                      type="text"
                      name={isBuyer ? "companyName" : "businessName"}
                      defaultValue={
                        getBusinessName() !== "Not provided"
                          ? getBusinessName()
                          : ""
                      }
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Business Type Field */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      defaultValue={
                        getBusinessType() !== "Not provided"
                          ? getBusinessType()
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

                  {/* Tax ID Field */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Tax ID / TIN
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      defaultValue={
                        getTaxId() !== "Not provided" ? getTaxId() : ""
                      }
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Industry Sector Field */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Industry Sector
                    </label>
                    <select
                      name="industrySector"
                      defaultValue={getIndustrySector() || ""}
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
                      <option>Transportation</option>
                    </select>
                  </div>

                  {/* Address Field */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={getAddress() || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Role-specific fields */}
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
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {isBuyer && (
                    <>
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
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Name Display */}
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    {isBuyer ? "Company Name" : "Business Name"}
                  </label>
                  <p className="text-foreground text-lg font-medium">
                    {getBusinessName()}
                  </p>
                </div>

                {/* Business Type Display */}
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Business Type
                  </label>
                  <p className="text-foreground">{getBusinessType()}</p>
                </div>

                {/* Tax ID Display */}
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Tax ID / TIN
                  </label>
                  <p className="text-foreground">{getTaxId()}</p>
                </div>

                {/* Industry Sector Display */}
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Industry Sector
                  </label>
                  <p className="text-foreground">
                    {getIndustrySector() || "—"}
                  </p>
                </div>

                {/* Address Display */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-muted-foreground mb-1">
                    Address
                  </label>
                  <p className="text-foreground">{getAddress() || "—"}</p>
                </div>

                {/* Role-specific displays */}
                {isSupplier && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Registration Number
                      </label>
                      <p className="text-foreground">
                        {user.supplier?.registrationNumber || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Years in Business
                      </label>
                      <p className="text-foreground">
                        {user.supplier?.yearsInBusiness || "—"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Categories
                      </label>
                      <p className="text-foreground">
                        {user.supplier?.categories?.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Bio
                      </label>
                      <p className="text-foreground">
                        {user.supplier?.bio || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Verification Status
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            user.supplier?.status === "APPROVED"
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                        ></div>
                        <p className="text-foreground">
                          {user.supplier?.status || "PENDING"}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {isBuyer && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Department
                      </label>
                      <p className="text-foreground">
                        {user.buyer?.department || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">
                        Position
                      </label>
                      <p className="text-foreground">
                        {user.buyer?.position || "—"}
                      </p>
                    </div>
                  </>
                )}
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
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Change Password
                </label>
                <div className="space-y-3 max-w-md">
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Two-Factor Authentication
                </label>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="text-muted-foreground text-sm">
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
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-foreground text-sm">
                    Submitted a bid for RFP #RFQ-2024-001
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-foreground text-sm">
                    Won contract: Construction Materials Supply
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 week ago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-foreground text-sm">
                    Profile verification completed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 weeks ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
