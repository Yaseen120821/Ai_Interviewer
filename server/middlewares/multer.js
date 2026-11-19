// Ai_Interviewer - Dedicated Secure Multer Middleware
// Stores resumes in dedicated uploads/resumes/ directory with 5MB limit and strict PDF validation

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Dedicated uploads directory for PDF resumes
const uploadDir = path.resolve(process.cwd(), "uploads", "resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const finalFilename = `resume-${uniqueSuffix}-${safeBase}${ext}`;
    cb(null, finalFilename);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF documents are supported."), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max limit
  fileFilter,
});

export { uploadDir };
export default upload;
