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

export type Logout = z.infer<typeof logoutSchema>;
export type Me = z.infer<typeof meSchema>;
export type Login = z.infer<typeof loginSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

export type User = Me["user"];
