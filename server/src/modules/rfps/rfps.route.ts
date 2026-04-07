import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware";
import { rfpsController } from "./rfps.controller";
import { upload } from "../../config/multer";

const router = Router();

router.get("/", rfpsController.list).get("/:id", rfpsController.listById);

router
  .use(authenticateUser)
  .post(
    "/",
    requireRole(["BUYER"]),
    upload.single("rfp_doc"),
    rfpsController.create,
  );

export default router;
