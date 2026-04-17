import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware";
import { rfpsController } from "./rfps.controller";
import { upload } from "../../config/multer";

const router = Router();

router.get("/", rfpsController.list);

router.get(
  "/my-rfps",
  authenticateUser,
  requireRole(["BUYER"]),
  rfpsController.listMyRfps,
);

router.get("/:id", rfpsController.listById);

router
  .use(authenticateUser, requireRole(["BUYER"]))
  .post("/", upload.single("rfp_doc"), rfpsController.create)
  .patch("/:rfpId", rfpsController.cancelRfp)
  .delete("/:rfpId/delete", rfpsController.delete);

export default router;
