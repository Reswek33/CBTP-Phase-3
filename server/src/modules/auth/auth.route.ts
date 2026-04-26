import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticateUser } from "../../shared/middleware/authMiddleware.js";

const router = Router();

router
  // public route
  .post("/register", authController.register)
  .post("/verify-email", authController.verifyEmail)
  .post("/resend-otp", authController.resendOtp)
  .post("/login", authController.login)
  // cookies are needed
  .post("/refresh", authController.refreshTokenHandler)
  .post("/logout", authController.logout)
  // auth middleware is needed
  .get("/me", authenticateUser, authController.me)
  .patch("/update", authenticateUser, authController.updateCredentials);

export default router;
