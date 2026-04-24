import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";
import { buyerController } from "./buyer.controller.js";
import { handleFileUpload } from "../../config/multer.js";

const router = Router();

router
  .use(authenticateUser, requireRole(["BUYER"]))
  .patch("/profile", buyerController.updateProfile)
  .post(
    "/documents",
    handleFileUpload("business_doc"),
    buyerController.uploadDoc,
  )
  .post("/", buyerController.deleteAccount)
  .delete("/", buyerController.deleteDoc);

export default router;
