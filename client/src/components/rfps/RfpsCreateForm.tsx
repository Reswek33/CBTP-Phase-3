/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  createRfpsInputSchema,
  type CreateRfpsInput,
} from "../../schemas/rfps.schema";
import { createRfps } from "../../services/api/rfp-api";
import {
  FileText,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  Tag,
  File,
  Clock,
  AlertTriangle,
} from "lucide-react";

const RfpPriority = ["NORMAL", "HIGH", "URGENT"] as const;

const RfpsCreateForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateRfpsInput>({
    resolver: zodResolver(createRfpsInputSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budget: 0,
      currency: "ETB",
      deadline: new Date(),
      priority: "NORMAL",
      status: "OPEN",
    },
  });

  const watchPriority = watch("priority");

  const onSubmit = async (data: CreateRfpsInput) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      if (selectedFile) {
        formData.append("rfp_doc", selectedFile);
      }

      await createRfps(formData);
      clearInterval(interval);
      setUploadProgress(100);

      setSubmitSuccess(true);
      reset();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => {
        setSubmitSuccess(false);
        navigate("/dashboard/rfps");
      }, 2000);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create RFP";
      setSubmitError(message);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getPriorityColor = () => {
    switch (watchPriority) {
      case "URGENT":
        return "border-destructive focus:ring-destructive";
      case "HIGH":
        return "border-orange-500 focus:ring-orange-500";
      default:
        return "border-primary focus:ring-primary";
    }
  };

  return (
    <div className="p-6">
      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-500">
                RFP Created Successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                Your RFP is now live and visible to suppliers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">
                Failed to Create RFP
              </p>
              <p className="text-sm text-muted-foreground">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            {...register("title")}
            placeholder="e.g., Annual Office Stationery Supply"
            className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              ${errors.title ? "border-destructive" : "border-border"}
            `}
          />
          {errors.title && (
            <p className="text-xs text-destructive mt-1">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2">
            Detailed Description
          </label>
          <textarea
            {...register("description")}
            rows={5}
            placeholder="Outline your requirements, expectations, and any specific conditions..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Category & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Category <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                {...register("category")}
                placeholder="e.g., IT Services, Construction, Logistics"
                className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  ${errors.category ? "border-destructive" : "border-border"}
                `}
              />
            </div>
            {errors.category && (
              <p className="text-xs text-destructive mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Budget (Estimated)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                {...register("budget", { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Currency & Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Currency
            </label>
            <select
              {...register("currency")}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="ETB">ETB - Ethiopian Birr</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Submission Deadline <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="datetime-local"
                {...register("deadline")}
                className={`w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  ${errors.deadline ? "border-destructive" : "border-border"}
                `}
              />
            </div>
            {errors.deadline && (
              <p className="text-xs text-destructive mt-1">
                {errors.deadline.message}
              </p>
            )}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {RfpPriority.map((priority) => (
              <label
                key={priority}
                className={`
                  relative flex cursor-pointer rounded-lg p-4 border-2 transition-all
                  ${
                    watchPriority === priority
                      ? `${getPriorityColor()} bg-primary/5`
                      : "border-border bg-background hover:bg-muted/50"
                  }
                `}
              >
                <input
                  type="radio"
                  value={priority}
                  {...register("priority")}
                  className="sr-only"
                />
                <div className="flex flex-col items-center gap-1 w-full">
                  {priority === "URGENT" && (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                  {priority === "HIGH" && (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                  {priority === "NORMAL" && (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium">{priority}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2">
            Tender Documents
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center
              ${selectedFile ? "border-primary bg-primary/5" : "border-border bg-muted/30"}
              transition-all duration-200
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {!selectedFile ? (
              <div className="text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, JPG, PNG (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFileRemove}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="text-muted-foreground">{uploadProgress}%</span>
            </div>
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/rfps")}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Publishing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Publish RFP
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
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

export default RfpsCreateForm;
