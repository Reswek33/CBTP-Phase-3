import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticateUser } from "../../shared/middleware/authMiddleware";

const router = Router();

router
  // public route
  .post("/register", authController.register)
  .post("/login", authController.login)
  // cookies are needed
  .post("/refresh", authController.refreshTokenHandler)
  .post("/logout", authController.logout)
  // auth middleware is needed
  .get("/me", authenticateUser, authController.me)
  .patch("/update", authenticateUser, authController.updateCredentials);

export default router;
