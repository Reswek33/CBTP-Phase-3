 
import { api } from "./api-client";
import { z } from "zod";

export const roomCreateInputSchema = z.object({
  rfpId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  biddingType: z.enum(["PUBLIC", "CLOSED"]),
  invitedSupplierIds: z.array(z.string().uuid()),
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
export type RoomCreateInput = z.infer<typeof roomCreateInputSchema>;
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

export const createRoom = async (data: RoomCreateInput) => {
  const response = await api.post("/rooms/create", data);
  return response.data;
};

export const awardBidById = async (id: string, winningBidId: string) => {
  const response = await api.patch(`/rooms/${id}/award`, { winningBidId });
  return response.data;
};

export const getMyInvitations = async () => {
  const response = await api.get("/rooms/my-invitations");
  return response.data;
};

export const updateInvitationStatus = async (
  id: string,
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED",
) => {
  const response = await api.patch(`/rooms/invitations/${id}`, {
    status,
  });
  return response.data;
};

export const updateBidAmount = async (id: string, amount: BidAmountInput) => {
  const response = await api.post(`/rooms/${id}/bids`, amount);
  return response.data;
};

export const joinRoom = async (roomId: string, socketId?: string) => {
  const response = await api.post(
    `/rooms/${roomId}/join`,
    {},
    socketId ? { headers: { "x-socket-id": socketId } } : undefined,
  );
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
