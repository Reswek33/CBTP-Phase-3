import { z } from "zod";
import {
  RfpPriority,
  RfpStatus,
  RfpWorkflow,
} from "../../../generated/prisma/index.js";

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

export const rfpsCreateInputSchema = z.object({
  title: z.string().min(5, { error: "Title need atleast 5 letters!" }),
  description: z.string().optional(),
  category: z.string(),
  budget: z.coerce.number(),
  status: z.enum(RfpStatus),
  deadline: z.coerce.date(),
  priority: z.enum(RfpPriority),
  workflow: z.enum(RfpWorkflow).optional(),
});

export type RFPS = z.infer<typeof rfpsSchema>;
export type RfpsCreateInput = z.infer<typeof rfpsCreateInputSchema>;
