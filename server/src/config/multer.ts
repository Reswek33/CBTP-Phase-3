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
// Add error handling for Cloudinary config
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "⚠️ Cloudinary credentials missing. Files will use local storage only.",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Test Cloudinary connection (optional but helpful)
if (isProduction) {
  cloudinary.api.ping((error, result) => {
    if (error) {
      console.error("❌ Cloudinary connection failed:", error.message);
    } else {
      console.log("✅ Cloudinary connected successfully");
    }
  });
}

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
      return {
        folder:
          file.fieldname === "rfp_doc"
            ? "kaf_portal/rfps"
            : "kaf_portal/documents",
        resource_type: "auto",
        public_id: `${file.fieldname}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        // Add timeout to prevent hanging
        timeout: 60000,
      };
    } catch (error) {
      console.error("Cloudinary params error:", error);
      throw new Error("Failed to configure cloud storage");
    }
  },
});

// --- 3. HYBRID LOGIC ---
const selectedStorage = isProduction ? cloudinaryStorage : localStorage;

// Enhanced multer error handler
export const multerErrorHandler = (err: any, req: any, res: any, next: any) => {
  // Log the full error for debugging
  console.error("Multer error details:", {
    name: err?.name,
    code: err?.code,
    message: err?.message,
    stack: err?.stack,
    field: err?.field,
    storageErrors: err?.storageErrors,
  });

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

  // Handle Cloudinary storage errors
  if ((err && err.name === "StorageError") || err?.storageErrors) {
    return res.status(500).json({
      success: false,
      message:
        "File upload failed due to storage service error. Please try again.",
      code: "STORAGE_ERROR",
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

  // Handle other errors
  const errorMessage = err?.message || "Unknown upload error";
  const errorCode = err?.code || "UPLOAD_ERROR";

  return res.status(400).json({
    success: false,
    message: errorMessage,
    code: errorCode,
  });
};

// Create upload middleware with better error handling
export const upload = multer({
  storage: selectedStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Only one file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const isValidMime = allowedTypes.test(file.mimetype);
    const isValidExt = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (isValidMime && isValidExt) {
      cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg, .jpeg and .pdf format allowed!"));
    }
  },
});

// Wrapper for multer upload to handle errors properly
export const handleFileUpload = (fieldName: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      await new Promise((resolve, reject) => {
        upload.single(fieldName)(req, res, (err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
      next();
    } catch (error) {
      multerErrorHandler(error, req, res, next);
    }
  };
};
