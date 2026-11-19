import express from "express";
import { getProblems, getProblemById, runCode, submitCode } from "../controllers/coding.controller.js";
import isAuth from "../middlewares/isAuth.js";

const codingRouter = express.Router();

codingRouter.get("/problems", isAuth, getProblems);
codingRouter.get("/problems/:id", isAuth, getProblemById);
codingRouter.post("/run", isAuth, runCode);
codingRouter.post("/submit", isAuth, submitCode);

export default codingRouter;

