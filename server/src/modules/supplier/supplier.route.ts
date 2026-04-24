import { Router } from "express";
import { upload, multerErrorHandler } from "../../config/multer.js";
import { supplierController } from "./supplier.controller.js";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware.js";

const router = Router();
router
  .use(authenticateUser, requireRole(["SUPPLIER"]))
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
    supplierController.uploadDocument,
  )
  .patch("/profile", supplierController.updateProfile)
  .get("/bids", supplierController.getMyBids)
  .delete("/documents/:docId/delete", supplierController.deleteDocument);

export default router;
