import { z } from "zod";

export const bidRoomSchema = z.object({
  id: z.string().uuid(),
  rfpId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  biddingType: z.enum(["PUBLIC", "CLOSED"]),
  status: z.enum(["PENDING", "ACTIVE", "CLOSED", "AWARDED"]),
  currentHighestBid: z.number().nullable(),
  winningBidId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  rfp: z.object({
    title: z.string(),
    description: z.string().nullable(),
    budget: z.number(),
    currency: z.string(),
    buyer: z.object({
      companyName: z.string(),
      user: z.object({
        firstName: z.string(),
        lastName: z.string(),
      }),
    }),
  }),
  participants: z.array(
    z.object({
      id: z.string().uuid(),
      supplierId: z.string().uuid(),
      status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]),
      supplier: z.object({
        businessName: z.string(),
        user: z.object({
          firstName: z.string(),
          lastName: z.string(),
        }),
      }),
    }),
  ),
  bids: z.array(
    z.object({
      id: z.string().uuid(),
      amount: z.number(),
      supplierId: z.string().uuid(),
      createdAt: z.coerce.date(),
      supplier: z.object({
        businessName: z.string(),
      }),
    }),
  ),
});

export const invitationSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  supplierId: z.string().uuid(),
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  room: bidRoomSchema.optional(),
  supplier: z.object({
    businessName: z.string(),
    user: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    }),
  }),
});

export type BidRoom = z.infer<typeof bidRoomSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
