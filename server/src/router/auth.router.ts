import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router
  // public route
  .post("/login", authController.login)
  // cookies are needed
  .post("/refresh", authController.refreshTokenHandler)
  .post("/logout", authController.logout)
  // auth middleware is needed
  .get("/me", authenticateUser, authController.me)
  .patch("/update", authenticateUser, authController.updateCredentials);

export default router;
