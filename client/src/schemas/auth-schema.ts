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

export const meSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.uuid(),
    username: z.string(),
    role: z
      .enum(["SUPERADMIN", "ADMIN", "BUYER", "SUPLIER"])
      .optional()
      .nullable(),
    isActive: z.boolean().optional().nullable(),

    createdAt: z.string().or(z.date()).nullable().optional(),
  }),
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
    id: z.string().uuid(),
    username: z.string(),
    email: z.string(),
    role: z.enum(["ADMIN", "SUPERADMIN", "BUYER", "SUPPLIER"]),
    isActive: z.boolean(),
  }),
});

// Types
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type Logout = z.infer<typeof logoutSchema>;
export type Me = z.infer<typeof meSchema>;
export type Login = z.infer<typeof loginSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

export type User = Me["user"];
