/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "./api-client";
import { z } from "zod";

export const roomCreateInputSchema = z.object({
  rfpId: z.uuid(),
  startTime: z.date().transform((str) => new Date(str)),
  endTime: z.date().transform((str) => new Date(str)),
  biddingType: z.enum(["PUBLIC", "CLOSED"]),
  invitedSupplierIds: z.array(z.uuid()),
});

export const invitationUpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]),
});

export const bidAmountInputSchema = z.object({
  amount: z.coerce.number().positive(),
});

export type InvitationUpdateState = z.infer<
  typeof invitationUpdateStatusSchema
>;
export type RoomCreateInpute = z.infer<typeof roomCreateInputSchema>;
export type BidAmountInput = z.infer<typeof bidAmountInputSchema>;

export const getRoomDetail = async (id: string) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const cancelRoom = async (id: string, reason?: string) => {
  const response = await api.patch(`/rooms/${id}/cancel`, { reason });
  return response.data;
};

export const getRoomHistory = async (id: string) => {
  const response = await api.get(`/rooms/${id}/history`);
  return response.data;
};

export const createRoom = async (data: RoomCreateInpute) => {
  const response = await api.post("/rooms/create", data);
  return response.data;
};

export const awardBid = async (id: string) => {
  const response = await api.patch(`/rooms/${id}/award`);
  return response.data;
};

export const getMyInvitations = async () => {
  const response = await api.get("/rooms/my-invitations");
  return response.data;
};

export const updateInvitationStatus = async (id: string, status: any) => {
  const response = await api.patch(`/rooms/invitations/${id}`, {
    status: status,
  });
  return response.data;
};

export const updateBidAmount = async (id: string, amount: BidAmountInput) => {
  const response = await api.post(`/rooms/${id}/bids`, { amount: amount });
  return response.data;
};

export const jointRoom = async (roomId: string) => {
  const response = await api.post(`/rooms/${roomId}/join`);
  return response.data;
};

export const startRoom = async (id: string) => {
  const response = await api.post(`/rooms/${id}/start`);
  return response.data;
};

export const getMyRooms = async () => {
  const response = await api.get("/rooms/my-rooms");
  return response.data;
};
