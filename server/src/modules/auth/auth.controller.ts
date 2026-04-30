import type { Request, Response } from "express";
import { registerInputSchema, userLoginInputSchema } from "./auth.schema.js";
import bcrypt from "bcryptjs";
import {
  generateTokens,
  setAuthCookies,
  verifyRefreshToken,
} from "../../shared/utils/token.js";
import handleError from "../../shared/utils/error.js";
import { logActivity } from "../../shared/utils/logger.js";
import { prisma } from "../../config/prisma.js";
import { Prisma } from "@prisma/client/extension";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { getIO } from "../../config/socket.js";
import { sendNotification } from "../../shared/utils/notification.js";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import {
  sendWellcomeEmail,
  sendVerificationEmailWithRetry,
  sendWellcomeEmailRetry,
} from "../../shared/utils/mail.js";

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
          email: data.email,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email or Username already in use",
        });
      }

      const generateUsername =
        data.firstName + Math.round(Math.random() * 10000);

      // 3. Hash Password
      const hashedPassword = await bcrypt.hash(data.password, saltRound);
      const regNumber = `SUP-${uuid()}/${new Date().getFullYear()}`;
      const otp = crypto.randomInt(100000, 999999).toString();

      // 4. Atomic Transaction: Create User + Profile
      const newUser = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const user = await tx.user.create({
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              username: generateUsername,
              email: data.email,
              passwordHash: hashedPassword,
              role: data.role,
              isActive: false,
            },
          });

          await tx.verificationToken.create({
            data: {
              email: data.email,
              token: otp,
              expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
              type: "EMAIL_VERIFICATION",
            },
          });

          // Create the specific profile based on role
          if (data.role === "BUYER") {
            await tx.buyer.create({
              data: {
                id: user.id, // Shared UUID from User
                companyName: data.companyName || "New Company",
                acceptLegalTerms: data.acceptLegalTerms,
                address: data.companyAddress,
                companyType: data.companyType,
                position: data.position,
                phone: data.phone,
                industrySector: data.industrySector,
                department: data.companyType,
              },
            });
          } else if (data.role === "SUPPLIER") {
            await tx.supplier.create({
              data: {
                id: user.id, // Shared UUID from User
                businessName: data.businessName || "New Business",
                status: "PENDING",
                acceptLegalTerms: data.acceptLegalTerms,
                registrationNumber: regNumber,
                phone: data.phone,
                taxId: data.taxId,
              },
            });
          }

          return user;
        },
      );

      let emailSent = false;
      let emailError: string | null = null;
      try {
        await sendVerificationEmailWithRetry(newUser.email, otp, 3);
        emailSent = true;

        await logActivity(
          `Verification email sent to ${newUser.email}`,
          "INFO",
          newUser.id,
          "AuthService.register",
          { email: newUser.email, otpSent: true },
        );
      } catch (emailErr) {
        emailError =
          emailErr instanceof Error ? emailErr.message : "Unknown email error";
        console.error("[EMAIL_SERVICE_FAILURE]", emailErr);

        await logActivity(
          `Failed to send verification email to ${newUser.email}: ${emailError}`,
          "CRITICAL",
          newUser.id,
          "AuthService.register",
          { email: newUser.email, error: emailError, retriesAttempted: 3 },
        );

        await prisma.systemLog.create({
          data: {
            level: "CRITICAL",
            message: `Email service failure during registration`,
            context: "AuthService.register",
            payload: {
              userId: newUser.id,
              email: newUser.email,
              error: emailError,
            },
          },
        });

        const admins = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
          select: { id: true },
        });

        await Promise.allSettled(
          admins.map((admin) =>
            sendNotification({
              userId: admin.id,
              type: "SYSTEM_ALERT",
              content: `⚠️ Email service failed for user registration: ${newUser.email}`,
              link: `/dashboard/admin/users/${newUser.id}`,
              room: admin.id,
            }),
          ),
        );
      }

      // 5. Generate Session

      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
        select: { id: true },
      });

      // 6. Log Success
      await logActivity(
        `New ${newUser.role} registered: ${newUser.username}`,
        "INFO",
        newUser.id,
        "AuthService.register",
      );

      await Promise.allSettled([
        logActivity(
          `New ${newUser.role} registered: ${newUser.username}`,
          "INFO",
          newUser.id,
          "AuthService.register",
        ),
        logActivity(
          `Pending registration: ${newUser.email}`,
          "INFO",
          newUser.id,
          "AuthService.register",
        ),
        ...admins.map((admin) =>
          sendNotification({
            userId: admin.id,
            type: "USER_REGISTRATION",
            content: `New ${newUser.role} sign-up (Pending): ${newUser.firstName}`,
            link: `/dashboard/admin/users/${newUser.id}`,
            room: admin.id,
          }),
        ),
      ]);

      if (emailSent) {
        return res.status(201).json({
          success: true,
          message: "Registration initiated. Please verify your email.",
          email: newUser.email,
          requiresVerification: true,
        });
      } else {
        // Email failed but user is created - provide alternative flow
        return res.status(201).json({
          success: true,
          message:
            "Account created but verification email could not be sent. Please contact support or request a new verification code.",
          email: newUser.email,
          requiresVerification: true,
          emailFailed: true,
          canResend: true,
        });
      }
    } catch (err) {
      console.error("[AUTH_CONTROLLER_REGISTER]", err);
      handleError("POST /auth/register", err, res);
    }
  },

  resendOtp: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isActive) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const otp = crypto.randomInt(100000, 999999).toString();

      await prisma.verificationToken.upsert({
        where: { email_token: { email, token: otp } }, // Need to adjust unique constraint
        update: {
          token: otp,
          expires: new Date(Date.now() + 10 * 60 * 1000),
        },
        create: {
          email,
          token: otp,
          expires: new Date(Date.now() + 10 * 60 * 1000),
          type: "EMAIL_VERIFICATION",
        },
      });
      await sendVerificationEmailWithRetry(email, otp, 3);

      res.json({ success: true, message: "New verification code sent" });
    } catch (err) {
      console.error("[RESEND_OTP]", err);
      handleError("POST /auth/resend-otp", err, res);
    }
  },
  verifyEmail: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, otp } = req.body;

      console.log(req.body);

      if (!email || !otp) {
        return res
          .status(400)
          .json({ success: false, message: "Email and OTP are required" });
      }
      const result = await prisma.$transaction(async (tx) => {
        const valideToken = await tx.verificationToken.findFirst({
          where: {
            email: email,
            token: otp,
            type: "EMAIL_VERIFICATION",
            expires: { gt: new Date() },
          },
        });

        if (!valideToken) throw new Error("INVALID_TOKEN");

        const user = await tx.user.update({
          where: { email },
          data: { isActive: true },
        });

        await tx.verificationToken.delete({
          where: { id: valideToken.id },
        });
        return user;
      });

      const tokens = generateTokens(result.id, result.role, result.adminRole);
      setAuthCookies(res, {
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
      });

      await sendNotification({
        userId: result.id,
        type: "WELCOME",
        content: `Verification successful! Welcome to Bid-Sync, ${result.firstName}.`,
        link: "/dashboard",
        room: result.id,
      });

      if (result.role === "BUYER" || result.role === "SUPPLIER") {
        await sendWellcomeEmailRetry(
          5,
          1000,
          result.email,
          result.firstName,
          result.role,
          "https://bidsync-app.ezedin.me/dashboard",
        );
      }

      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        user: {
          id: result.id,
          username: result.username,
          role: result.role,
          isActive: result.isActive,
        },
      });
    } catch (err) {
      handleError("POST /auth/otp", err, res);
    }
  },
  /**
   * Identifies user by email or username, verifies password,
   * and issues HTTP-only JWT cookies.
   */
  login: async (req: Request, res: Response) => {
    try {
      console.log(req.body);
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
          adminRole: true,
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
      const tokens = generateTokens(user.id, user.role, user.adminRole);
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
      console.error("[AUTH_CONTROLLER_LOGIN]", err);
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
      console.log("[AUTH_CONTROLLER_LOGOUT]", err);
      handleError("DELETE /auth/logout", err, res);
    }
  },

  /**
   * Retrieves the current authenticated user's profile, branch,
   * and teacher assignments if applicable.
   */
  me: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          supplier: {
            select: {
              businessName: true,
              phone: true,
              address: true,
              businessType: true,
              taxId: true,
              registrationNumber: true,
              yearsInBusiness: true,
              categories: true,
              bio: true,
              status: true,
              verificationStatus: true,
              verifiedAt: true,
              rejectedReason: true,
              createdAt: true,
              updatedAt: true,
              documents: {
                select: {
                  id: true,
                  fileName: true,
                  filePath: true,
                  documentType: true,
                  uploadedAt: true,
                  verifiedAt: true,
                  verifiedBy: true,
                },
                orderBy: { uploadedAt: "desc" },
              },
            },
          },
          buyer: {
            select: {
              companyName: true,
              companyType: true,
              taxId: true,
              phone: true,
              industrySector: true,
              address: true,
              department: true,
              position: true,
              status: true,
              verificationStatus: true,
              verifiedAt: true,
              rejectedReason: true,
              createdAt: true,
              updatedAt: true,
              documents: {
                select: {
                  id: true,
                  fileName: true,
                  filePath: true,
                  documentType: true,
                  uploadedAt: true,
                  verifiedAt: true,
                  verifiedBy: true,
                },
                orderBy: { uploadedAt: "desc" },
              },
            },
          },
          activityLogs: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              action: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        await logActivity(
          `User profile not found for ID: ${req.user.id}`,
          "WARN",
          req.user.id,
          "AuthService.me",
        );
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check for inconsistent state
      if (user.role === "SUPPLIER" && !user.supplier) {
        console.error(
          `[INCONSISTENT STATE] User ${user.id} has SUPPLIER role but no supplier profile`,
        );
        await logActivity(
          `Inconsistent state: SUPPLIER role without supplier profile`,
          "ERROR",
          user.id,
          "AuthService.me",
          { userId: user.id, role: user.role },
        );
        await prisma.systemLog.create({
          data: {
            level: "ERROR",
            message: "Inconsistent user state",
            context: "User has SUPPLIER role but missing supplier record",
            userId: user.id,
            payload: { userId: user.id, role: user.role },
          },
        });
      }

      const responseUser = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        supplier: user.role === "SUPPLIER" ? user.supplier : null,
        buyer: user.role === "BUYER" ? user.buyer : null,
      };

      return res.status(200).json({
        success: true,
        user: responseUser,
      });
    } catch (err) {
      console.error("[AUTH_ME_ERROR]", err);
      handleError("GET /auth/me", err, res);
    }
  },

  /**
   * Uses the Refresh Token to rotate Access Tokens without requiring re-login.
   */
  refreshTokenHandler: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        await logActivity(
          "Refresh token attempt: No token provided",
          "WARN",
          undefined,
          "AuthService.refreshToken",
        );
        return res.status(401).json({ message: "No refresh token provided" });
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded || typeof decoded === "string") {
        return res
          .status(401)
          .json({ message: "Invalid or expired refresh token" });
      }

      const { id } = decoded as { id: string };
      const user = await prisma.user.findFirst({
        where: { id, isActive: true },
        select: { id: true, role: true, adminRole: true },
      });

      if (!user) {
        return res
          .status(403)
          .json({ message: "User is inactive or not found" });
      }

      const newTokens = generateTokens(user.id, user.role, user.adminRole);
      setAuthCookies(res, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });

      return res.json({ message: "Token refreshed successfully" });
    } catch (err) {
      console.log("[AUTH_CONTROLLER_REFRESH_TOKEN]", err);
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
      const io = getIO();

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true },
      });

      if (!user) {
        await logActivity(
          `Update credentials failed: User ${req.user.id} not found`,
          "ERROR",
          req.user.id,
          "AuthService.updateCredentials",
        );
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

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

      const updateData: { username?: string; passwordHash?: string } = {};
      if (username) updateData.username = username;
      if (newPassword) {
        updateData.passwordHash = await bcrypt.hash(newPassword, saltRound);
      }

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No update fields provided" });
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
      });

      const fieldUpdated = newPassword ? "password" : "username";

      await sendNotification({
        userId: req.user.id,
        type: "SECURITY_UPDATE",
        content: `Your ${fieldUpdated} was successfully updated. If this wasn't you, contact support immediately.`,
        room: req.user.id,
      });

      // Emit a security event (can be used on frontend to show a specific alert)
      io.to(req.user.id).emit("security_alert", {
        message: `${fieldUpdated} changed successfully`,
      });

      await logActivity(
        `Credentials updated: ${username ? "username" : ""} ${newPassword ? "password" : ""}`,
        "INFO",
        req.user.id,
        "AuthService.updateCredentials",
        { updatedFields: Object.keys(updateData) },
      );

      res
        .status(200)
        .json({ success: true, message: "Credentials updated successfully" });
    } catch (error) {
      console.error("[AUTH_CONTROLLER_UPDATE_CREDENTIAL]", error);

      handleError("PATCH /auth/update", error, res);
    }
  },
};
