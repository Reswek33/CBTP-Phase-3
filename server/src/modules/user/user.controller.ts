import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import handleError from "../../shared/utils/error.js";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";

const updateUserInputSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().optional(),
});
const updateUserNameInputSchema = z.object({
  username: z
    .string()
    .min(4, { error: "Username need to be 4 letters or more" }),
});

export type UserUpdateInput = z.infer<typeof updateUserInputSchema>;

export const userController = {
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.user!;
    try {
      const { firstName, lastName, email } = updateUserInputSchema.parse(
        req.body,
      );

      const user = prisma.user.findUnique({
        where: { id: id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await prisma.user.update({
        where: { id: id },
        data: {
          firstName: firstName,
          lastName: lastName,
          email: email,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Updated Successfully",
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
