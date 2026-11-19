import express from "express";
import { analyzeResume, getHistory } from "../controllers/ats.controller.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const atsRouter = express.Router();

atsRouter.post("/analyze", isAuth, upload.single("resume"), analyzeResume);
atsRouter.post("/ats-score", isAuth, upload.single("resume"), analyzeResume);
atsRouter.get("/history", isAuth, getHistory);

export default atsRouter;

