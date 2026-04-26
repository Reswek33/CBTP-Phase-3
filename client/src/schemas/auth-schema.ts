import { z } from "zod";

export const loginSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  role: z.enum(["SUPERADMIN", "ADMIN", "BUYER", "SUPLIER"]),
  isActive: z.boolean(),
});

export const loginInputSchema = z.object({
  identifier: z.string().min(1, "Username is required!!"),
  password: z.string().min(1, "Password is required!!"),
});

const baseUserSchema = {
  id: z.uuid(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
};

const supplierProfileSchema = z.object({
  status: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  businessName: z.string().nullable(),
  taxId: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  verificationStatus: z.boolean().nullable(),
  businessType: z.string().nullable(),
  acceptLegalTerms: z.boolean().nullable().optional(),
  yearsInBusiness: z.number().nullable(),
  categories: z.array(z.string()).nullable(),
  bio: z.string().nullable(),
  rejectedReason: z.string().nullable(),
  documents: z.array(z.any()).optional().nullable(),
});

const buyerProfileSchema = z.object({
  companyName: z.string().nullable(),
  companyType: z.string().nullable(),
  industrySector: z.string().nullable(),
  status: z.string().nullable(),
  taxId: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  department: z.string().nullable(),
  position: z.string().nullable(),
  documents: z.array(z.any()).optional().nullable(),
});

const supplierUserSchema = z.object({
  ...baseUserSchema,
  role: z.literal("SUPPLIER"),
  supplier: supplierProfileSchema,
  buyer: z.null().optional(),
});

const buyerUserSchema = z.object({
  ...baseUserSchema,
  role: z.literal("BUYER"),
  buyer: buyerProfileSchema,
  supplier: z.null().optional(),
});

const adminUserSchema = z.object({
  ...baseUserSchema,
  role: z.enum(["SUPERADMIN", "ADMIN"]),
  supplier: z.null().optional(),
  buyer: z.null().optional(),
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
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["BUYER", "SUPPLIER"]), // Usually, ADMINs aren't created via public registration

    // Conditional Profile Data
    // If role is BUYER, these might be required
    companyName: z.string().optional(),

    // If role is SUPPLIER, these might be required
    businessName: z.string().optional(),
    taxId: z.string().optional(),
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

// 2. Response Schema: What the server returns after successful registration
export const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.uuid(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: z.enum(["ADMIN", "SUPERADMIN", "BUYER", "SUPPLIER"]),
    isActive: z.boolean(),
  }),
});

export const otpVerificationInputSchema = z.object({
  email: z.email(),
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
