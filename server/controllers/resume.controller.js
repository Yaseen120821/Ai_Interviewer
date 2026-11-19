// Ai_Interviewer - Dedicated Secure Resume Controller
// Manages PDF resume upload, parsing, persistent disk storage in uploads/resumes/,
// and authenticated file access with directory traversal prevention.

import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

import prisma from "../config/prisma.js";
import { uploadDir } from "../middlewares/multer.js";

// In-memory fallback cache when PostgreSQL/Prisma is offline
const inMemoryResumes = new Map();

// Helper to extract common technical skills from text
const extractSkillsFromText = (text) => {
  const commonSkills = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
    "React", "Vue", "Angular", "Next.js", "Node.js", "Express", "Django", "FastAPI", "Spring Boot",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "Firestore", "SQLite", "DynamoDB",
    "Docker", "Kubernetes", "AWS", "Google Cloud", "GCP", "Azure", "CI/CD", "Git", "GitHub",
    "REST API", "GraphQL", "Microservices", "System Design", "Agile", "Scrum", "Tailwind CSS",
    "HTML", "CSS", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Pandas",
  ];
  const found = new Set();
  const lowerText = text.toLowerCase();
  for (const skill of commonSkills) {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(lowerText)) {
      found.add(skill);
    }
  }
  return Array.from(found);
};

/**
 * POST /api/v1/resumes/upload
 * Accepts single file with field name "resume" (PDF up to 5MB)
 * Saves persistently in uploads/resumes/ and returns structured metadata
 */
export const uploadResume = async (req, res) => {
  let storedFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No resume file uploaded. Please attach a PDF file.",
      });
    }

    storedFilePath = req.file.path;
    const originalName = req.file.originalname;
    const uniqueFileName = req.file.filename;
    const fileSize = req.file.size;

    // Validate PDF extension
    if (!originalName.toLowerCase().endsWith(".pdf")) {
      // Remove invalid uploaded file
      if (fs.existsSync(storedFilePath)) fs.unlinkSync(storedFilePath);
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PDF documents are supported.",
      });
    }

    // Read buffer and extract text via pdf-parse v2
    const fileBuffer = fs.readFileSync(storedFilePath);
    let parsedText = "";
    let parser = null;
    try {
      parser = new PDFParse({ data: fileBuffer, verbosity: 0 });
      const parsedPdf = await parser.getText();
      parsedText = (parsedPdf?.text || "").trim();
    } catch (parseErr) {
      console.warn("[resume.controller] pdf-parse warning:", parseErr.message);
    } finally {
      if (parser) {
        try { await parser.destroy(); } catch (_) {}
      }
    }

    if (!parsedText || parsedText.length < 20) {
      return res.status(422).json({
        success: false,
        message: "Could not extract text from the PDF. The file may be image-based or protected.",
      });
    }

    const userId = req.userId || "candidate_default";
    const extractedSkills = extractSkillsFromText(parsedText);

    let savedResume = null;
    try {
      // Deactivate older active resumes for this user
      await prisma.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      // Save new active resume with persistent disk path
      savedResume = await prisma.resume.create({
        data: {
          userId,
          fileName: originalName,
          filePath: storedFilePath,
          parsedText,
          isActive: true,
        },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (dbErr) {
      console.warn("[resume.controller] Prisma fallback to in-memory resume:", dbErr.message);
      const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Deactivate in-memory
      const userResumes = inMemoryResumes.get(userId) || [];
      userResumes.forEach((r) => { r.isActive = false; });

      savedResume = {
        id: resumeId,
        userId,
        fileName: originalName,
        uniqueFileName,
        filePath: storedFilePath,
        fileSize,
        parsedText,
        extractedSkills,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      userResumes.unshift(savedResume);
      inMemoryResumes.set(userId, userResumes);
    }

    return res.status(201).json({
      success: true,
      message: "Resume uploaded, parsed, and saved persistently.",
      data: {
        id: savedResume.id,
        fileName: originalName,
        fileSize,
        isActive: true,
        extractedSkills,
        parsedTextLength: parsedText.length,
        createdAt: savedResume.createdAt,
      },
    });
  } catch (error) {
    console.error("[resume.controller] uploadResume error:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to upload resume: ${error.message}`,
    });
  }
};

/**
 * GET /api/v1/resumes
 * Returns all resumes for current authenticated user
 */
export const getUserResumes = async (req, res) => {
  try {
    const userId = req.userId || "candidate_default";
    let list = [];
    try {
      list = await prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (_) {
      list = inMemoryResumes.get(userId) || [];
    }

    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch resumes: ${error.message}`,
    });
  }
};

/**
 * GET /api/v1/resumes/active
 * Returns currently active resume for authenticated user
 */
export const getActiveResume = async (req, res) => {
  try {
    const userId = req.userId || "candidate_default";
    let active = null;
    try {
      active = await prisma.resume.findFirst({
        where: { userId, isActive: true },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          parsedText: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch (_) {
      const userResumes = inMemoryResumes.get(userId) || [];
      active = userResumes.find((r) => r.isActive) || null;
    }

    if (!active) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No active resume found.",
      });
    }

    const extractedSkills = extractSkillsFromText(active.parsedText || "");

    return res.status(200).json({
      success: true,
      data: {
        id: active.id,
        fileName: active.fileName,
        isActive: active.isActive,
        extractedSkills,
        createdAt: active.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch active resume: ${error.message}`,
    });
  }
};

/**
 * GET /api/v1/resumes/:id/file
 * Authenticated and secure file download/view endpoint.
 * Prevents directory traversal attacks via path verification.
 */
export const getResumeFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || "candidate_default";

    let resumeRecord = null;
    try {
      resumeRecord = await prisma.resume.findUnique({
        where: { id },
      });
    } catch (_) {
      const userResumes = inMemoryResumes.get(userId) || [];
      resumeRecord = userResumes.find((r) => r.id === id) || null;
    }

    if (!resumeRecord) {
      return res.status(404).json({
        success: false,
        message: "Resume record not found.",
      });
    }

    // Owner authorization check
    if (resumeRecord.userId !== userId && req.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: you do not have permission to access this resume.",
      });
    }

    const targetPath = resumeRecord.filePath;
    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).json({
        success: false,
        message: "Physical resume file not found on disk.",
      });
    }

    // Directory traversal defense: robust containment check using path.relative()
    const resolvedPath = path.resolve(targetPath);
    const authorizedRoot = path.resolve(uploadDir);
    const rel = path.relative(authorizedRoot, resolvedPath);
    const isContained = !rel.startsWith("..") && !path.isAbsolute(rel);
    if (!isContained) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path traversal detected.",
      });
    }

    const downloadFileName = path.basename(resumeRecord.fileName || "resume.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${downloadFileName}"`);
    return res.sendFile(resolvedPath);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve resume file: ${error.message}`,
    });
  }
};

/**
 * PATCH /api/v1/resumes/:id/active
 * Sets a specific resume as active and deactivates all other resumes for the user
 */
export const setActiveResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || "candidate_default";

    try {
      await prisma.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await prisma.resume.update({
        where: { id },
        data: { isActive: true },
      });
    } catch (_) {
      const userResumes = inMemoryResumes.get(userId) || [];
      userResumes.forEach((r) => {
        r.isActive = (r.id === id);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Resume set as active successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to activate resume: ${error.message}`,
    });
  }
};

/**
 * DELETE /api/v1/resumes/:id
 * Deletes a resume record and its physical file on disk
 */
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || "candidate_default";

    let filePathToDelete = null;
    try {
      const found = await prisma.resume.findUnique({ where: { id } });
      if (found) {
        filePathToDelete = found.filePath;
        await prisma.resume.delete({ where: { id } });
      }
    } catch (_) {
      const userResumes = inMemoryResumes.get(userId) || [];
      const idx = userResumes.findIndex((r) => r.id === id);
      if (idx !== -1) {
        filePathToDelete = userResumes[idx].filePath;
        userResumes.splice(idx, 1);
      }
    }

    // Remove physical file from disk if present
    if (filePathToDelete && fs.existsSync(filePathToDelete)) {
      try {
        fs.unlinkSync(filePathToDelete);
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to delete resume: ${error.message}`,
    });
  }
};
