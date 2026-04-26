import { z } from "zod";

export const loginSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  role: z.enum(["SUPERADMIN", "ADMIN", "BUYER", "SUPPLIER"]),
  isActive: z.boolean(),
});

export const loginInputSchema = z.object({
  identifier: z.string().min(1, "Username is required!!"),
  password: z.string().min(1, "Password is required!!"),
});

// Activity Log Schema
const activityLogSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  action: z.string(),
  createdAt: z.coerce.date(),
});

const baseUserSchema = {
  id: z.uuid(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
};

// Document Schema
const documentSchema = z.object({
  id: z.uuid().optional(),
  documentType: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  uploadedAt: z.coerce.date(),
  verifiedBy: z.uuid().optional(),
  verifiedAt: z.coerce.date().optional(),
});

// Bid Schema for Supplier
const bidSchema = z.object({
  id: z.uuid().optional(),
  rfpId: z.uuid(),
  amount: z.number().nullable(),
  proposal: z.string().nullable(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  rfp: z
    .object({
      title: z.string(),
      status: z.string(),
    })
    .optional(),
});

// RFP Schema for Buyer
const rfpSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  budget: z.string(),
  currency: z.string(),
  deadline: z.coerce.date(),
  priority: z.string(),
  status: z.string(),
  awardedBidId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  _count: z
    .object({
      bids: z.number(),
    })
    .optional(),
});

const supplierProfileSchema = z.object({
  id: z.uuid().optional(),
  businessName: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  businessType: z.string().nullable(),
  acceptLegalTerms: z.boolean().nullable().optional(),
  taxId: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  yearsInBusiness: z.number().nullable(),
  categories: z.array(z.string()).nullable(),
  bio: z.string().nullable(),
  verificationStatus: z.boolean().nullable(),
  status: z.string().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  rejectedReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  documents: z.array(documentSchema).optional(),
  bids: z.array(bidSchema).optional(),
});

const buyerProfileSchema = z.object({
  id: z.uuid().optional(),
  companyName: z.string().nullable(),
  companyType: z.string().nullable(),
  industrySector: z.string().nullable(),
  status: z.string().nullable(),
  taxId: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  department: z.string().nullable(),
  position: z.string().nullable(),
  acceptLegalTerms: z.boolean().nullable().optional(),
  verificationStatus: z.boolean().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  rejectedReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  documents: z.array(documentSchema).optional(),
  rfps: z.array(rfpSchema).optional(),
});

const supplierUserSchema = z.object({
  ...baseUserSchema,
  role: z.literal("SUPPLIER"),
  supplier: supplierProfileSchema,
  buyer: z.null().optional(),
  activityLogs: z.array(activityLogSchema).optional(),
});

const buyerUserSchema = z.object({
  ...baseUserSchema,
  role: z.literal("BUYER"),
  buyer: buyerProfileSchema,
  supplier: z.null().optional(),
  activityLogs: z.array(activityLogSchema).optional(),
});

const adminUserSchema = z.object({
  ...baseUserSchema,
  role: z.enum(["SUPERADMIN", "ADMIN"]),
  supplier: z.null().optional(),
  buyer: z.null().optional(),
  activityLogs: z.array(activityLogSchema).optional(),
});

export const meSchema = z.object({
  success: z.boolean(),
  user: z.discriminatedUnion("role", [
    supplierUserSchema,
    buyerUserSchema,
    adminUserSchema,
  ]),
});

export const logoutSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const registerInputSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["BUYER", "SUPPLIER"]),
    companyName: z.string().optional(),
    businessName: z.string().optional(),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    companyType: z.string().optional(),
    industrySector: z.string().optional(),
    position: z.string().optional(),
    companyAddress: z.string().optional(),
    acceptLegalTerms: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "BUYER" && !data.companyName) return false;
      if (data.role === "SUPPLIER" && !data.businessName) return false;
      return true;
    },
    {
      message: "Company/Business name is required based on your role",
      path: ["companyName"],
    },
  );

export const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    role: z.enum(["ADMIN", "SUPERADMIN", "BUYER", "SUPPLIER"]),
    isActive: z.boolean(),
  }),
});

export const otpVerificationInputSchema = z.object({
  email: z.string().email(),
  otp: z.string(),
});

export const resendOtpSchema = z.object({
  email: z.email(),
});

// Types
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type OtpInput = z.infer<typeof otpVerificationInputSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type Logout = z.infer<typeof logoutSchema>;
export type Me = z.infer<typeof meSchema>;
export type Login = z.infer<typeof loginSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type User = Me["user"];
export type ActivityLog = z.infer<typeof activityLogSchema>;
export type Document = z.infer<typeof documentSchema>;
export type Bid = z.infer<typeof bidSchema>;
export type RFP = z.infer<typeof rfpSchema>;
