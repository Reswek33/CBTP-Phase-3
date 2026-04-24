import multer, { MulterError } from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const isProduction = process.env.NODE_ENV === "production";

// --- 1. LOCAL STORAGE CONFIGURATION ---
const createDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder =
      file.fieldname === "rfp_doc" ? "uploads/rfps" : "uploads/documents";
    createDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

// --- 2. CLOUDINARY STORAGE CONFIGURATION ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder:
      file.fieldname === "rfp_doc" ? "kaf_portal/rfps" : "kaf_portal/documents",
    resource_type: "auto",
    public_id: `${file.fieldname}-${Date.now()}`,
  }),
});

// --- 3. HYBRID LOGIC ---
const selectedStorage = isProduction ? cloudinaryStorage : localStorage;

// Custom error handler for multer
export const multerErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof MulterError) {
    // Multer-specific errors
    const errorMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
      LIMIT_FIELD_KEY: "Invalid field name.",
      LIMIT_FIELD_VALUE: "Invalid field value.",
      LIMIT_FIELD_COUNT: "Too many fields.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
    };

    const message = errorMessages[err.code] || err.message;

    return res.status(400).json({
      success: false,
      message,
      code: err.code,
      field: err.field,
    });
  }

  // Handle file filter errors (custom validation)
  if (err && err.message === "Only .png, .jpg and .pdf format allowed!") {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: "INVALID_FILE_TYPE",
    });
  }

  // Pass other errors to next middleware
  next(err);
};

export const upload = multer({
  storage: selectedStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const isValid =
      allowedTypes.test(file.mimetype) ||
      allowedTypes.test(file.originalname.toLowerCase());

    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg and .pdf format allowed!") as any);
    }
  },
});
