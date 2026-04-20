import { Router } from "express";
import { authenticateUser } from "../../shared/middleware/authMiddleware.js";
import { statController } from "./stats.controller.js";

const router = Router();

router.use(authenticateUser).get("/", statController.getStats);

export default router;
