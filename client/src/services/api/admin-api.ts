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
  const response = await api("/admin/conversations");
  return response.data;
};

export const blockUser = async (id: string, isActive: boolean) => {
  const response = await api.patch(`/admin/users/${id}/status`, {
    isActive: isActive,
  });
  return response.data;
};

export const getSubscriptions = async () => {
  const response = await api.get("/admin/subscriptions");
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get("/admin/transactions");
  return response.data;
};

export const getAdminDashboardStats = async () => {
  const response = await api.get("/admin/dashboard-stats");
  return response.data;
};

export const createAdmin = async (adminData: any) => {
  const response = await api.post("/admin/create-admin", adminData);
  return response.data;
};

export const getAuditStats = async () => {
  const response = await api.get("/admin/audit-stats");
  return response.data;
};

export const getAnalyticsOverview = async () => {
  const response = await api.get("/admin/analytics/overview");
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await api.get("/admin/analytics/health");
  return response.data;
};

export const getDisputes = async (status?: string) => {
  const response = await api.get(`/disputes${status ? `?status=${status}` : ""}`);
  return response.data;
};

export const resolveDispute = async (id: string, data: { status: string; resolution: string }) => {
  const response = await api.patch(`/disputes/${id}/resolve`, data);
  return response.data;
};
