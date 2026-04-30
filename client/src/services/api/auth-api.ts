/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  meSchema,
  type Login,
  type LoginInput,
  type Logout,
  type Me,
  type OtpInput,
  type ResendOtpInput,
} from "../../schemas/auth-schema";
import { errorHandler } from "../../util/errorHandler";
import { api } from "./api-client";

export const postLogin = async (data: LoginInput): Promise<Login> => {
  try {
    const response = await api.post("/auth/login", data);
    return response.data;
  } catch (error) {
    errorHandler("Auth", error);
    throw new Error("smtg wrong");
  }
};

export const postOtp = async (data: OtpInput) => {
  const response = await api.post("/auth/verify-email", data);
  return response.data;
};

export const resendOtp = async (data: ResendOtpInput) => {
  const response = await api.post("/auth/resend-otp", data);
  return response.data;
};

export const postLogout = async (): Promise<Logout> => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    errorHandler("Logout: ", error);
    throw new Error("smtg wrong");
  }
};

export const getMe = async (): Promise<Me> => {
  try {
    const response = await api.get("/auth/me");
    const parsedResponse = meSchema.parse(response.data);

    return parsedResponse;
  } catch (error) {
    errorHandler("Me: ", error);
    throw new Error("smtg wrong");
  }
};

export const postRefresh = async () => {
  await api.post("/auth/refresh");
};

export const postRegister = async (data: unknown) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const updateCredentials = async (data: {
  tempPassword: string;
  newPassword: string;
}) => {
  const response = await api.patch("/auth/update", data);
  return response.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.patch("/users", data);
  return response.data;
};
