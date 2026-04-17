import { Router } from "express";
import { upload } from "../../config/multer";
import { supplierController } from "./supplier.controller";
import {
  authenticateUser,
  requireRole,
} from "../../shared/middleware/authMiddleware";

const router = Router();
router
  .use(authenticateUser, requireRole(["SUPPLIER"]))
  .post(
    "/documents",
    upload.single("business_doc"), // The field name the frontend must use
    supplierController.uploadDocument,
  )
  .patch("/profile", supplierController.updateProfile)
  .get("/bids", supplierController.getMyBids)
  .delete("/documents/:docId/delete", supplierController.deleteDocument);

export default router;
