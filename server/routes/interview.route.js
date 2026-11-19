import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  generateQuestion,
  submitAnswer,
  finishInterview,
  getInterviewReport,
  getMyInterviews,
  getInterviewById,
  generateQuestionsForSession,
  startInterview,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

// Session creation & question generation
interviewRouter.post("/", isAuth, generateQuestion);
interviewRouter.post("/create", isAuth, generateQuestion);
interviewRouter.post("/generate-questions", isAuth, generateQuestion);

// Session listing & history
interviewRouter.get("/", isAuth, getMyInterviews);
interviewRouter.get("/history", isAuth, getMyInterviews);
interviewRouter.get("/get-interview", isAuth, getMyInterviews);

// Single interview session
interviewRouter.get("/:id", isAuth, getInterviewById);
interviewRouter.post("/:id/questions", isAuth, generateQuestionsForSession);
interviewRouter.patch("/:id/start", isAuth, startInterview);

// Answer submission
interviewRouter.post("/:id/answers", isAuth, submitAnswer);
interviewRouter.post("/submit-answer", isAuth, submitAnswer);
interviewRouter.post("/submit", isAuth, submitAnswer);

// Completion & reports
interviewRouter.patch("/:id/complete", isAuth, finishInterview);
interviewRouter.patch("/:id/finish", isAuth, finishInterview);
interviewRouter.post("/finish", isAuth, finishInterview);
interviewRouter.get("/report/:id", isAuth, getInterviewReport);

export default interviewRouter;
