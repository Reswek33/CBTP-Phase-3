import { z } from "zod";

const ROLE = ["SUPERADMIN", "ADMIN", "SUPPLIER", "BUYER"] as const;

export const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.string().nullable(),
  password: z.string(),
  role: z.enum(ROLE),
  isActive: z.boolean(),
  branchId: z.uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userCreateInputSchema = z.object({
  username: z.string().min(5, "Username must be 5 or more letters"),
  password: z.string().min(6),
  email: z.email().optional().nullable(),
  role: z.enum(ROLE).default("BUYER"),
  branchId: z.uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const registerInputSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["BUYER", "SUPPLIER"]),

    // Conditional Profile Data
    companyName: z.string().optional(),
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

export const registerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.uuid(),
    username: z.string(),
    email: z.string(),
    role: z.enum(ROLE),
    isActive: z.boolean(),
  }),
});

export const userLoginInputSchema = z.object({
  identifier: z.string().min(1, "Please Enter Username"),
  password: z.string().min(1, "Please Enter Password"),
});

export const userUpdateSchema = z
  .object({
    id: z.uuid().optional().nullable(),
    username: z
      .string()
      .min(5, "Username must be 5 or more letters")
      .optional(),
    password: z.string().min(6).optional(),
    email: z.email().optional().nullable(),
    role: z.enum(ROLE).optional(),
    branchId: z.uuid().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .partial();

export const userWhereUniqueInputSchema = z
  .object({
    id: z.uuid(),
    username: z.string(),
  })
  .refine((data) => data.id || data.username, {
    message: "Error: 'id' or 'username' must be provided for unique lookup",
  });

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateInputSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserWhereUnique = z.infer<typeof userWhereUniqueInputSchema>;

export const UserSchema = {
  modelName: "user",
  modelTag: "User",
  loginSchema: userLoginInputSchema,
  createSchema: userCreateInputSchema,
  updateSchema: userUpdateSchema,
  whereUniqueSchema: userWhereUniqueInputSchema,
  searchableFields: ["username", "email"],
};
