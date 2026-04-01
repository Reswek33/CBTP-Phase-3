import { z } from "zod";

const ROLE = ["SUPERADMIN", "ADMIN", "SUPLIER", "BUYER"] as const;

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

export const userLoginInputSchema = z.object({
  identifier: z.string().min(1, "Please Enter Username"),
  password: z.string().min(1, "Please Enter Password"),
});

export const userUpdateSchema = z
  .object({
    employeeId: z.uuid().optional().nullable(),
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
    message: "Error: 'id' or 'username' must be provided for uinique lookup",
  });

export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateInputSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserwhereUnique = z.infer<typeof userWhereUniqueInputSchema>;

export const UserSchema = {
  modelName: "user",
  modelTag: "User",
  loginSchema: userLoginInputSchema,
  createSchema: userCreateInputSchema,
  updateSchema: userUpdateSchema,
  whereUniqueSchema: userWhereUniqueInputSchema,

  searchableFields: ["username"],
};
