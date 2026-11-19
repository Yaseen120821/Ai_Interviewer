import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  getInterviewReport,
  finishInterview,
  getMyInterviews,
} from "../controllers/interview.controller.js";

const reportRouter = express.Router();

// Generate / finalize report for an interview session
reportRouter.post("/generate/:sessionId", isAuth, (req, res, next) => {
  req.params.id = req.params.sessionId;
  return finishInterview(req, res, next);
});

// List all reports / interviews
reportRouter.get("/", isAuth, getMyInterviews);

// Get single report by session ID or report ID
reportRouter.get("/:id", isAuth, getInterviewReport);

export default reportRouter;

