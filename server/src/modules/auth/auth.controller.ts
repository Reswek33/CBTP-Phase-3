import { Request, Response } from "express";
import { registerInputSchema, userLoginInputSchema } from "./auth.schema";
import bcrypt from "bcryptjs";
import {
  generateTokens,
  setAuthCookies,
  verifyRefreshToken,
} from "../../shared/utils/token";
import handleError from "../../shared/utils/error";
import { logActivity } from "../../shared/utils/logger";
import { prisma } from "../../config/prisma";
import { Prisma } from "@prisma/client/extension";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";

const saltRound = Number(process.env.SALT_ROUNDS) || 10;
type TransactionClient = Prisma.TransactionClient;

/**
 * authController handles all security and session-related operations.
 * It integrates with SystemLog to provide an audit trail for the Owner/Admin.
 */
export const authController = {
  /**
   * Registers a new user and creates their specific profile (Buyer or Supplier)
   * in a single atomic transaction.
   */
  register: async (req: Request, res: Response) => {
    try {
      // 1. Validate Input
      const data = registerInputSchema.parse(req.body);

      // 2. Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email or Username already in use",
        });
      }

      // 3. Hash Password
      const hashedPassword = await bcrypt.hash(data.password, saltRound);

      // 4. Atomic Transaction: Create User + Profile
      const newUser = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const user = await tx.user.create({
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              username: data.username,
              email: data.email,
              passwordHash: hashedPassword,
              role: data.role,
            },
          });

          // Create the specific profile based on role
          if (data.role === "BUYER") {
            await tx.buyer.create({
              data: {
                id: user.id, // Shared UUID from User
                companyName: data.companyName || "New Company",
              },
            });
          } else if (data.role === "SUPPLIER") {
            await tx.supplier.create({
              data: {
                id: user.id, // Shared UUID from User
                businessName: data.businessName || "New Business",
                status: "PENDING",
              },
            });
          }

          return user;
        },
      );

      // 5. Generate Session
      const tokens = generateTokens(newUser.id, newUser.role);
      setAuthCookies(res, {
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
      });

      // 6. Log Success
      await logActivity(
        `New ${newUser.role} registered: ${newUser.username}`,
        "INFO",
        newUser.id,
        "AuthService.register",
      );

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          isActive: newUser.isActive,
        },
      });
    } catch (err) {
      console.error(err);
      handleError("POST /auth/register", err, res);
    }
  },
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
          passwordHash: true,
          role: true,
          isActive: true,
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
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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
          firstName: true,
          lastName: true,
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
        select: { passwordHash: true },
      });

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // Verify current password before allowing change
      if (
        !tempPassword ||
        !(await bcrypt.compare(tempPassword, user.passwordHash))
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
