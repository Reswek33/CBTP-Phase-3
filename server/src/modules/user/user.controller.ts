import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";

const updateUserInputSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  // Buyer fields
  companyName: z.string().optional(),
  companyType: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  industrySector: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  // Supplier fields
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  bio: z.string().optional(),
  categories: z.array(z.string()).optional(),
});
const updateUserNameInputSchema = z.object({
  username: z
    .string()
    .min(4, { error: "Username need to be 4 letters or more" }),
});

export type UserUpdateInput = z.infer<typeof updateUserInputSchema>;

export const userController = {
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    const { id, role } = req.user!;
    try {
      const data = updateUserInputSchema.parse(req.body);

      await prisma.$transaction(async (tx) => {
        // Update basic user info
        await tx.user.update({
          where: { id },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
        });

        // Update role-specific info
        if (role === "BUYER") {
          await tx.buyer.update({
            where: { id },
            data: {
              companyName: data.companyName,
              companyType: data.companyType,
              phone: data.phone,
              address: data.address,
              industrySector: data.industrySector,
              department: data.department,
              position: data.position,
            },
          });
        } else if (role === "SUPPLIER") {
          await tx.supplier.update({
            where: { id },
            data: {
              businessName: data.businessName,
              businessType: data.businessType,
              phone: data.phone,
              address: data.address,
              bio: data.bio,
              categories: data.categories,
            },
          });
        }
      });

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
      });
    } catch (err) {
      console.error("[USER_CONTROLLER_UPDATE_PROFILE]", err);
      handleError("PATCH /users", err, res);
    }
  },

  updateUserName: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id!;
    try {
      const { username } = req.body as { username: string };
      const user = prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const existUsername = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });

      if (existUsername) {
        return res.status(401).json({
          success: false,
          message: "Username is alredy in use",
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { username: username },
      });

      return res.status(200).json({
        success: true,
        message: "username updated successfully",
      });
    } catch (err) {
      console.error("[USER_CONTROLLER_UPDATE_USERNAME]", err);
      handleError("PATCH /users/username", err, res);
    }
  },
};
