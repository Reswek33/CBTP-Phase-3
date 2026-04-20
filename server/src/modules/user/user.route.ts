import { Router } from "express";
import { authenticateUser } from "../../shared/middleware/authMiddleware.js";
import { userController } from "./user.controller.js";

const router = Router();

router
  .use(authenticateUser)
  .patch("/username", userController.updateUserName)
  .patch("/", userController.updateProfile);

export default router;
