import { z } from "zod";

// Bid schema for validation
export const bidSchema = z.object({
  id: z.string().uuid(),
  rfpId: z.string().uuid(),
  supplierId: z.string().uuid(),
  amount: z.number().nullable().optional(),
  proposal: z.string(),
  proposalPath: z.string().nullable(),
  status: z.enum([
    "PENDING_APPROVAL",
    "ACTIVE",
    "AWARDED",
    "WITHDRAWN",
    "CLOSED",
    "REJECTED",
  ]),
  rejectionReason: z.string().default(""),
  createdAt: z.string().datetime(),
  rfp: z.object({
    id: z.string().uuid(),
    title: z.string(),
    category: z.string(),
    budget: z.string(),
    currency: z.string(),
    deadline: z.string().datetime(),
    status: z.string(),
    buyer: z.object({
      companyName: z.string(),
    }),
  }),
});

// API Response schema
export const bidsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(bidSchema).optional(),
  message: z.string().optional(),
});

// Financial bid submission schema
export const financialBidSchema = z.object({
  bidId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
});

// Withdraw bid schema
export const withdrawBidSchema = z.object({
  bidId: z.string().uuid(),
  reason: z.string().optional(),
});

export type Bid = z.infer<typeof bidSchema>;
export type BidsResponse = z.infer<typeof bidsResponseSchema>;
export type FinancialBidInput = z.infer<typeof financialBidSchema>;
export type WithdrawBidInput = z.infer<typeof withdrawBidSchema>;
