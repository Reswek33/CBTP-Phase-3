import { z } from "zod";

const RfpPriority = ["NORMAL", "URGENT", "HIGH"] as const;
const RfpStatus = ["OPEN", "CLOSED", "AWARDED", "CANCELLED"] as const;
const RfpWorkflow = ["STANDARD", "TWO_ENVELOPE"] as const;

export const rfpsSchema = z.object({
  id: z.uuid(),
  buyerId: z.uuid(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  budget: z.number(),
  deadline: z.date(),
  priority: z.enum(RfpPriority),
  status: z.enum(RfpStatus),
  workflow: z.enum(RfpWorkflow),
  createdAt: z.date(),
  updatedAt: z.date(),
  buyer: z.object({
    companyName: z.string(),
  }),
  _count: z.object({
    bids: z.number(),
  }),
});

export const createRfpsInputSchema = z.object({
  title: z.string().min(5, { error: "Title need atleast 5 letters!" }),
  description: z.string().optional(),
  category: z.string(),
  budget: z.coerce.number().default(0),
  status: z.enum(RfpStatus).default("OPEN"),
  currency: z.enum(["USD", "ETB", "EUR", "GBP"]),
  deadline: z.coerce.date(),
  priority: z.enum(RfpPriority),
  workflow: z.enum(RfpWorkflow).default("STANDARD"),
});

export type RFPS = z.infer<typeof rfpsSchema>;
export type CreateRfpsInput = z.infer<typeof createRfpsInputSchema>;
