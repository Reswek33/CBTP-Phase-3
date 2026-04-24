import { api } from "./api-client";

export const getUserConversations = async () => {
  const response = await api.get("/chat");
  return response.data;
};

export const getOrCreateConversation = async (data: { rfpId: string }) => {
  const response = await api.post("/chat/initialize", data);
  return response.data;
};

export const sendMessage = async (data: {
  conversationId: string;
  content: string;
}) => {
  const response = await api.post("/chat/message", data);
  return response.data;
};

export const getMessages = async (conversationId: string) => {
  const response = await api.get(`/chat/${conversationId}/messages`);
  return response.data;
};

export const markMessageAsRead = async (conversationId: string) => {
  const response = await api.post(`/chat/mark/${conversationId}`);
  return response.data;
};

export const getUnreadMessageCount = async () => {
  const response = await api.get("/chat/unread-count");
  return response.data;
};
