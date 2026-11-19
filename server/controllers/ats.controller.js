// Ai_Interviewer - ATS Resume Controller
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

import { analyzeResumeATS } from "../services/ai/atsAnalyzer.js";
import prisma from "../config/prisma.js";

export const analyzeResume = async (req, res) => {
  let tempFilePath = null;
  try {
    const { targetRole = "Full Stack Developer", jobDescription = "" } = req.body;
    let resumeText = req.body.resumeText || "";

    if (req.file) {
      tempFilePath = req.file.path;
      const fileBuffer = fs.readFileSync(tempFilePath);
      let parser = null;
      try {
        parser = new PDFParse({ data: fileBuffer, verbosity: 0 });
        const parsedPdf = await parser.getText();
        resumeText = (parsedPdf?.text || "").trim();
      } finally {
        if (parser) {
          try { await parser.destroy(); } catch (_) {}
        }
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "No readable resume content found. Please upload a valid PDF or paste resume text.",
      });
    }

    // Analyze via Google Gemini ATS engine
    const analysis = await analyzeResumeATS({
      resumeText,
      targetRole,
      jobDescription,
    });

    try {
      await prisma.atsAnalysis.create({
        data: {
          userId: req.userId || "guest",
          targetRole,
          jobDescription,
          atsScore: analysis.atsScore,
          matchingKeywords: analysis.matchingKeywords,
          missingKeywords: analysis.missingKeywords,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          sectionFeedback: analysis.sectionFeedback,
          suggestions: analysis.suggestions,
          optimizedResumeText: analysis.optimizedResumeText,
        },
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      analysis,
      optimizedResumeText: analysis.optimizedResumeText,
    });
  } catch (error) {
    console.error("[ats.controller] analyzeResume error:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to analyze resume: ${error.message}`,
    });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {}
    }
  }
};

export const getHistory = async (req, res) => {
  try {
    let records = [];
    try {
      records = await prisma.atsAnalysis.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      history: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch ATS history: ${error.message}`,
    });
  }
};

export default {
  analyzeResume,
  getHistory,
};

