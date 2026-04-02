import {
  meSchema,
  type Login,
  type LoginInput,
  type Logout,
  type Me,
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
