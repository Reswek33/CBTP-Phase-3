import multer from "multer";
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
// If production, use Cloudinary. Otherwise, use Local Disk.
const selectedStorage = isProduction ? cloudinaryStorage : localStorage;

export const upload = multer({
  storage: selectedStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const isValid =
      allowedTypes.test(file.mimetype) ||
      allowedTypes.test(file.originalname.toLowerCase());

    if (isValid) return cb(null, true);
    cb(new Error("Only .png, .jpg and .pdf format allowed!") as any);
  },
});
