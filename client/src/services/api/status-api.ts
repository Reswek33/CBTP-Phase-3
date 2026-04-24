import { api } from "./api-client";

export const getDashboardStatus = async () => {
  const response = await api.get("/stats");
  return response.data;
};
