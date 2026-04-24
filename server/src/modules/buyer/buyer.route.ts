import { Router } from "express";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";
import { buyerController } from "./buyer.controller.js";
import { upload, multerErrorHandler } from "../../config/multer.js";

const router = Router();

router
  .use(authenticateUser, requireRole(["BUYER"]))
  .patch("/profile", buyerController.updateProfile)
  .post(
    "/documents",
    (req, res, next) => {
      upload.single("business_doc")(req, res, (err) => {
        if (err) {
          return multerErrorHandler(err, req, res, next);
        }
        next();
      });
    },
    buyerController.uploadDoc,
  )
  .post("/", buyerController.deleteAccount)
  .delete("/", buyerController.deleteDoc);

export default router;
