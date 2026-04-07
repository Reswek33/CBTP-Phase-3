import { Request, Response } from "express";
import { Role } from "../../../generated/prisma";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import { rfpsCreateInputSchema } from "./rfps.schema";
import { prisma } from "../../config/prisma";
import { logActivity } from "../../shared/utils/logger";
import handleError from "../../shared/utils/error";

export const rfpsController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const role: Role = req.user?.role as Role;
      const userId = req.user?.id;

      const file = req.file;
      const filePath = file ? file.path : null;

      if (role !== "BUYER")
        return res.status(403).json({
          message: "Only buyers can post RFPs",
        });

      const validatedData = rfpsCreateInputSchema.parse(req.body);

      if (new Date(validatedData.deadline) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Deadline must be a future date",
        });
      }

      const rfp = await prisma.rfp.create({
        data: {
          ...validatedData,
          status: "OPEN",
          buyer: {
            connect: { id: userId },
          },
          ...(file && {
            documents: {
              create: [
                {
                  fileName: file.originalname,
                  filePath: filePath || "",
                },
              ],
            },
          }),
        },
        include: {
          documents: true,
        },
      });
      await logActivity(
        `RFP Created: "${rfp.title}" (ID: ${rfp.id})`,
        "INFO",
        userId,
        "rfps.create",
        { rfpId: rfp.id, category: rfp.category },
      );

      return res.status(201).json({
        success: true,
        message: `RFPs is created successfull. rfpsId: ${rfp.id}`,
      });
    } catch (error) {
      console.error("[RFP_CONTROLLER_CREATE]", error);
      handleError("POST /rfps", error, res);
    }
  },
  list: async (req: Request, res: Response) => {
    try {
      const rfps = await prisma.rfp.findMany({
        where: {
          status: "OPEN",
        },
        include: {
          buyer: {
            select: { companyName: true },
          },
          _count: {
            select: { bids: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        message: "List of RFPs",
        count: rfps.length,
        data: rfps,
      });
    } catch (error) {
      console.log("[RFP_CONTROLLER_LIST]", error);
      handleError("GET /rfps", error, res);
    }
  },
  listById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const rfp = await prisma.rfp.findUnique({
        where: { id: id },
        include: {
          documents: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
            },
          },

          buyer: true,
          _count: { select: { bids: true } },
        },
      });

      if (!rfp) {
        return res.status(404).json({
          success: false,
          message: "RFP not found",
        });
      }

      const isOwner = userId === rfp.buyerId;
      const responseData = {
        ...rfp,
        _count: isOwner ? rfp._count : { bids: 0 }, // Or omit it entirely
      };

      return res.status(200).json({
        success: true,
        message: `RFP ${rfp.id}`,
        data: responseData,
      });
    } catch (error) {
      console.log("[RFP_CONTROLLER_LIST_BY_ID]", error);
      handleError("GET /rfps:id", error, res);
    }
  },

  uploadFile: (req: Request, res: Response) => {
    try {
    } catch (error) {
      console.log("[RFP_CONTROLLER_UPLOAD_RFP_FILE]");
      handleError("POST /rfps/upload", error, res);
    }
  },
};
