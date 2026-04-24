/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./api-client";

export interface LogFilters {
  page?: number;
  limit?: number;
  logType?: "activity" | "system";
  level?: "INFO" | "WARN" | "ERROR";
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const getAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};
export const getUserDetails = async (id: string) => {
  const response = await api.get(`/admin/users/${id}`);
  console.log(response.data);
  return response.data;
};
export const getPendingSuppliers = async () => {
  const response = await api.get("/admin/suppliers/pending");
  return response.data;
};

export const verifySupplier = async (
  id: string,
  status: string,
  reason?: string,
) => {
  const response = await api.patch(`/admin/suppliers/${id}/verify`, {
    status,
    rejectionReason: reason,
  });
  return response.data;
};

export const verifyBuyer = async (
  id: string,
  status: string,
  reason?: string,
) => {
  const response = await api.patch(`/admin/buyer/${id}/verify`, {
    status,
    rejectionReason: reason,
  });
  return response.data;
};

export const getActivityLogs = async (filters: LogFilters) => {
  // Converts { page: 1, logType: 'system' } to ?page=1&logType=system
  const params = new URLSearchParams(filters as any).toString();
  const response = await api.get(`/admin/logs?${params}`);
  return response.data;
};

export const getAllConversationsForAdmin = async () => {
  const response = await api("/admin/audit");
  return response.data;
};

export const blockUser = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/admin/users/${id}/status`, {
    isActive: isActive,
  });
  return response.data;
};
