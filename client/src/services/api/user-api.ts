import { z } from "zod";
import { api } from "./api-client";

export const updateUserInputSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().optional(),
});

export const updateUserNameInputSchema = z
  .string()
  .min(4, { error: "Username need to be 4 letters or more" });
export type UserUpdateInput = z.infer<typeof updateUserInputSchema>;
export type UsernameUpdateInput = z.infer<typeof updateUserNameInputSchema>;

export const updateProfile = async (data: UserUpdateInput) => {
  const response = await api.patch("/users", data);
  return response.data;
};

export const updateUserName = async (data: UsernameUpdateInput) => {
  const parsedData = updateUserNameInputSchema.parse(data);
  const response = await api.patch("/users/username", { username: parsedData });
  return response.data;
};
