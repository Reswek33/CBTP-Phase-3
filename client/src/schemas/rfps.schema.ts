import { z } from "zod";
const RfpPriority = ["NORMAL", "URGENT"];

const RfpStatus = ["OPEN", "CLOSED", "AWARDED", "CANCELLED"];
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
  currency: z.enum(["USD", "ETB"]),
  deadline: z.coerce.date(),
  priority: z.enum(RfpPriority),
});

export type RFPS = z.infer<typeof rfpsSchema>;
export type CreateRfpsInput = z.infer<typeof createRfpsInputSchema>;
