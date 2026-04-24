import { api } from "./api-client";

export const getNotification = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

export const updateIsRead = async (notificationId: string) => {
  const response = await api.patch(`/notifications/${notificationId}`);
  return response.data;
};

export const clearNotifications = async () => {
  const response = await api.delete("/notifications");
  return response.data;
};
