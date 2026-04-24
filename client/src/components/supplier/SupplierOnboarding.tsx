/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  updateSupplierProfile,
  uploadSupplierDocument,
} from "../../services/api/supplier-api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Phone,
  MapPin,
  FileText,
  Calendar,
  Briefcase,
  Upload,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Building2,
  User,
} from "lucide-react";
import { uploadDoc, updateProfile } from "@/services/api/buyer-api";

// ============ Zod Validation Schemas ============

// Base schema for common fields
const baseProfileSchema = {
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  bio: z.string().optional(),
};

// Supplier specific schema
const supplierProfileSchema = z.object({
  ...baseProfileSchema,
  taxId: z.string().min(1, "Tax ID is required"),
  registrationNumber: z.string().optional(),
  yearsInBusiness: z.number().min(0, "Years must be 0 or more").optional(),
  bio: z.string().optional(),
});

// Buyer specific schema
const buyerProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
});

// Type inference
type SupplierProfileData = z.infer<typeof supplierProfileSchema>;
type BuyerProfileData = z.infer<typeof buyerProfileSchema>;

// Combined type for the form
type ProfileFormData = SupplierProfileData & BuyerProfileData;

export const SupplierOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const isSupplier = user?.role === "SUPPLIER";
  const isBuyer = user?.role === "BUYER";

  // Select the appropriate schema based on role
  const getFormSchema = () => {
    if (isSupplier) return supplierProfileSchema;
    if (isBuyer) return buyerProfileSchema;
    return z.object({});
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(getFormSchema() as any),
    defaultValues: {
      phone: "",
      address: "",
      taxId: "",
      registrationNumber: "",
      yearsInBusiness: 0,
      bio: "",
      companyName: "",
      department: "",
      position: "",
    },
  });

  useEffect(() => {
    if (user) {
      if (isSupplier && user.supplier) {
        reset({
          phone: user.supplier.phone || "",
          address: user.supplier.address || "",
          taxId: user.supplier.taxId || "",
          registrationNumber: user.supplier.registrationNumber || "",
          yearsInBusiness: user.supplier.yearsInBusiness || 0,
          bio: user.supplier.bio || "",
        });
      } else if (isBuyer && user.buyer) {
        reset({
          companyName: user.buyer.companyName || "",
          phone: user.buyer.phone || "",
          address: user.buyer.address || "",
          department: user.buyer.department || "",
          position: user.buyer.position || "",
        });
      }
    }
  }, [user, reset, isSupplier, isBuyer]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      if (isSupplier) {
        const supplierData = data as SupplierProfileData;
        await updateSupplierProfile({
          phone: supplierData.phone,
          address: supplierData.address,
          taxId: supplierData.taxId,
          registrationNumber: supplierData.registrationNumber,
          yearsInBusiness: supplierData.yearsInBusiness,
          bio: supplierData.bio,
          categories: user?.supplier?.categories || ["General"],
        });
      } else if (isBuyer) {
        const buyerData = data as BuyerProfileData;
        await updateProfile({
          companyName: buyerData.companyName,
          phone: buyerData.phone,
          address: buyerData.address,
          department: buyerData.department,
          position: buyerData.position,
        });
      }

      // Refresh user data to show updated info
      await refreshUser();
      setStep(2);
    } catch (err: any) {
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("business_doc", file);
    formData.append("documentType", "BUSINESS_LICENSE");

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      if (isBuyer) {
        await uploadDoc(formData);
      } else if (isSupplier) {
        await uploadSupplierDocument(formData);
      }

      clearInterval(interval);
      setUploadProgress(100);

      // Refresh user data
      await refreshUser();

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err: any) {
      console.error("Document upload error:", err);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const getCurrentStatus = () => {
    if (isSupplier) {
      const status = user?.supplier?.status;
      switch (status) {
        case "VERIFIED":
          return {
            label: "Verified",
            color: "text-green-500 bg-green-500/10 border-green-500/20",
            icon: CheckCircle,
          };
        case "PENDING":
          return {
            label: "Pending Review",
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            icon: AlertCircle,
          };
        case "REJECTED":
          return {
            label: "Rejected",
            color: "text-destructive bg-destructive/10 border-destructive/20",
            icon: AlertCircle,
          };
        default:
          return {
            label: "Not Started",
            color: "text-muted-foreground bg-muted/50 border-border",
            icon: AlertCircle,
          };
      }
    } else if (isBuyer) {
      const status = user?.buyer?.status;
      switch (status) {
        case "VERIFIED":
          return {
            label: "Verified",
            color: "text-green-500 bg-green-500/10 border-green-500/20",
            icon: CheckCircle,
          };
        case "PENDING":
          return {
            label: "Pending Review",
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            icon: AlertCircle,
          };
        case "REJECTED":
          return {
            label: "Rejected",
            color: "text-destructive bg-destructive/10 border-destructive/20",
            icon: AlertCircle,
          };
        default:
          return {
            label: "Not Started",
            color: "text-muted-foreground bg-muted/50 border-border",
            icon: AlertCircle,
          };
      }
    }
    return {
      label: "Unknown",
      color: "text-muted-foreground bg-muted/50 border-border",
      icon: AlertCircle,
    };
  };

  const status = getCurrentStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Step Indicator */}
      <div className="border-b border-border bg-muted/30">
        <div className="flex">
          <button
            onClick={() => setStep(1)}
            className={`
              flex-1 px-6 py-4 text-left transition-all duration-200
              ${
                step === 1
                  ? "bg-card text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${
                  step === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}
              >
                1
              </div>
              <div>
                <p className="font-semibold">
                  {isSupplier ? "Business Details" : "Company Details"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSupplier ? "Company information" : "Organization info"}
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setStep(2)}
            className={`
              flex-1 px-6 py-4 text-left transition-all duration-200
              ${
                step === 2
                  ? "bg-card text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${
                  step === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }
              `}
              >
                2
              </div>
              <div>
                <p className="font-semibold">Verification</p>
                <p className="text-xs text-muted-foreground">
                  Upload documents
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Step 1: Business/Company Details */}
      {step === 1 && (
        <form
          onSubmit={handleSubmit(onProfileSubmit)}
          className="p-6 space-y-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {isSupplier ? "Business Profile" : "Company Profile"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Hello, {user?.firstName}. Complete your{" "}
              {isSupplier ? "business" : "company"} details below.
            </p>
          </div>

          {/* Supplier Form */}
          {isSupplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("phone")}
                    placeholder="+251..."
                    className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.phone ? "border-destructive" : "border-border"}
                    `}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Tax ID (TIN) *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("taxId")}
                    placeholder="10-digit TIN"
                    className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.taxId ? "border-destructive" : "border-border"}
                    `}
                  />
                </div>
                {errors.taxId && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.taxId.message}
                  </p>
                )}
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Registration Number
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("registrationNumber")}
                    placeholder="Business registration number"
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Years in Business */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Years in Business
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    {...register("yearsInBusiness", { valueAsNumber: true })}
                    placeholder="Years"
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Buyer Form */}
          {isBuyer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("companyName")}
                    placeholder="Enter your company name"
                    className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.companyName ? "border-destructive" : "border-border"}
                    `}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("phone")}
                    placeholder="+251..."
                    className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                      ${errors.phone ? "border-destructive" : "border-border"}
                    `}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Department
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("department")}
                    placeholder="e.g., Procurement"
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  Position
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    {...register("position")}
                    placeholder="e.g., Procurement Manager"
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address - Common for both */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              {isSupplier ? "Business Address" : "Company Address"}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                {...register("address")}
                rows={3}
                placeholder={
                  isSupplier ? "Full business address" : "Full company address"
                }
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Bio - Only for Suppliers */}
          {isSupplier && (
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-2">
                Business Bio
              </label>
              <textarea
                {...register("bio")}
                rows={4}
                placeholder="Tell us about your services, expertise, and what makes your business unique..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Continue
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Document Upload */}
      {step === 2 && (
        <form onSubmit={onDocumentSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Verify Your {isSupplier ? "Business" : "Company"}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}
              >
                <StatusIcon className="w-3 h-3" />
                Current Status: {status.label}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-6 border border-border">
            <div className="text-center mb-4">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                Upload {isSupplier ? "Business License" : "Company License"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Please upload your {isSupplier ? "business" : "company"} license
                or registration document (PDF, JPG, or PNG)
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.jpg,.png,.jpeg"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                      setShowPreview(true);
                    }
                  }}
                  className="hidden"
                />
                <div className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Choose File</span>
                </div>
              </label>

              {file && (
                <div className="w-full max-w-md">
                  <div className="bg-background border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setShowPreview(false);
                          setUploadProgress(0);
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    {showPreview && file.type.startsWith("image/") && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="max-h-32 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full max-w-md">
                  <div className="bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Complete Submission
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Your document will be reviewed by our team. You'll be notified
              once verified.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
