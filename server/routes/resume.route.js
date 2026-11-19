// Ai_Interviewer - Dedicated Secure Resume Routes
import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import {
  uploadResume,
  getUserResumes,
  getActiveResume,
  getResumeFile,
  setActiveResume,
  deleteResume,
} from "../controllers/resume.controller.js";

const resumeRouter = express.Router();

// Upload new PDF resume (stores persistently in uploads/resumes/)
resumeRouter.post("/upload", isAuth, upload.single("resume"), uploadResume);

// Fetch all resumes for authenticated user
resumeRouter.get("/", isAuth, getUserResumes);

// Fetch active resume
resumeRouter.get("/active", isAuth, getActiveResume);

// Set active resume
resumeRouter.patch("/:id/active", isAuth, setActiveResume);

// Secure authenticated file download/view
resumeRouter.get("/:id/file", isAuth, getResumeFile);
resumeRouter.get("/:id/download", isAuth, getResumeFile);

// Delete specific resume and its disk file
resumeRouter.delete("/:id", isAuth, deleteResume);

export default resumeRouter;
