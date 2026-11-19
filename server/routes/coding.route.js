import express from "express";
import { getProblems, getProblemById, runCode, submitCode } from "../controllers/coding.controller.js";
import isAuth from "../middlewares/isAuth.js";

const codingRouter = express.Router();

// Public problem browsing
codingRouter.get("/problems", getProblems);
codingRouter.get("/questions", getProblems);
codingRouter.get("/problems/:id", getProblemById);
codingRouter.get("/questions/:id", getProblemById);

// Execution and submission (accepts both /run and /execute)
codingRouter.post("/run", runCode);
codingRouter.post("/execute", runCode);
codingRouter.post("/submit", submitCode);

export default codingRouter;


