import { Request, Response } from "express";
import { userLoginInputSchema } from "../schemas/user";
import bcrypt from "bcryptjs";
import {
  generateTokens,
  setAuthCookies,
  verifyRefreshToken,
} from "../utils/token";
import handleError from "../utils/error";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { logActivity } from "../utils/logger";
import { prisma } from "../config/prisma";

const saltRound = process.env.SALT_ROUNDS || 10;

/**
 * authController handles all security and session-related operations.
 * It integrates with SystemLog to provide an audit trail for the Owner/Admin.
 */
export const authController = {
  /**
   * Identifies user by email or username, verifies password,
   * and issues HTTP-only JWT cookies.
   */
  login: async (req: Request, res: Response) => {
    try {
      // 1. Validate Input Schema
      const { identifier, password } = userLoginInputSchema.parse(req.body);

      // 2. Fetch User with related Employee data
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
        select: {
          id: true,
          password: true,
          role: true,
          isActive: true,
          employee: { select: { id: true } },
        },
      });

      // 3. Handle Non-existent User
      if (!user) {
        await logActivity(
          `Failed login attempt for identifier: ${identifier}`,
          "WARN",
          undefined,
          "AuthService.login",
        );
        return res
          .status(404)
          .json({ success: false, message: "Invalid Credential" });
      }

      // 4. Handle Deactivated Accounts
      if (!user.isActive) {
        await logActivity(
          "Login blocked: Deactivated account",
          "WARN",
          user.id,
          "AuthService.login",
        );
        return res
          .status(403)
          .json({ success: false, message: "Account is deactivated" });
      }

      // 5. Verify Password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await logActivity(
          "Failed login: Incorrect password",
          "WARN",
          user.id,
          "AuthService.login",
        );
        return res
          .status(401)
          .json({ success: false, message: "Incorrect Credential" });
      }

      // 6. Generate Session and Log Success
      const tokens = generateTokens(user.id, user.role);
      setAuthCookies(res, {
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
      });

      await logActivity(
        "User logged in successfully",
        "INFO",
        user.id,
        "AuthService.login",
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        role: user.role,
        isActive: user.isActive,
      });
    } catch (err) {
      console.error(err);
      handleError("POST /auth/login", err, res);
    }
  },

  /**
   * Clears HTTP-only cookies to terminate the session.
   */
  logout: async (req: Request, res: Response) => {
    try {
      // Note: We use type casting as logout might be called without full auth context
      const userId = (req as any).user?.id;

      res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(200)
        .json({ success: true, message: "Logged Out" });

      if (userId) {
        await logActivity(
          "User logged out",
          "INFO",
          userId,
          "AuthService.logout",
        );
      }
    } catch (err) {
      handleError("DELETE /auth/logout", err, res);
    }
  },

  /**
   * Retrieves the current authenticated user's profile, branch,
   * and teacher assignments if applicable.
   */
  me: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const user = await prisma.user.findUnique({
        where: { id: req.user.id, isActive: true },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // Format response to separate profile data from academic assignments

      return res.status(200).json({ success: true, user: user });
    } catch (err) {
      handleError("GET /auth/me", err, res);
    }
  },

  /**
   * Uses the Refresh Token to rotate Access Tokens without requiring re-login.
   */
  refreshTokenHandler: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken)
        return res.status(401).json({ message: "No refresh token provided" });

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded || typeof decoded === "string") {
        return res
          .status(401)
          .json({ message: "Invalid or expired refresh token" });
      }

      const { id } = decoded as { id: string };
      const user = await prisma.user.findFirst({
        where: { id, isActive: true },
        select: { id: true, role: true },
      });

      if (!user)
        return res
          .status(403)
          .json({ message: "User is inactive or not found" });

      const newTokens = generateTokens(user.id, user.role);
      setAuthCookies(res, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });

      return res.json({ message: "Token refreshed successfully" });
    } catch (err) {
      handleError("POST /auth/refresh", err, res);
    }
  },

  /**
   * Allows users to update their username or password.
   * Requires confirmation of current password.
   */
  updateCredentials: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, tempPassword, newPassword } = req.body;
      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { password: true },
      });

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // Verify current password before allowing change
      if (
        !tempPassword ||
        !(await bcrypt.compare(tempPassword, user.password))
      ) {
        await logActivity(
          "Failed credential update: Invalid current password",
          "WARN",
          req.user.id,
          "AuthService.updateCredentials",
        );
        return res
          .status(401)
          .json({ success: false, message: "Invalid credential" });
      }

      const updateData: { username?: string; password?: string } = {};
      if (username) updateData.username = username;
      if (newPassword)
        updateData.password = await bcrypt.hash(newPassword, saltRound);

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No update fields provided" });
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
      });

      await logActivity(
        "Credentials updated (username/password)",
        "INFO",
        req.user.id,
        "AuthService.updateCredentials",
      );

      res
        .status(200)
        .json({ success: true, message: "Credentials updated successfully" });
    } catch (error) {
      handleError("PATCH /auth/update", error, res);
    }
  },
};
