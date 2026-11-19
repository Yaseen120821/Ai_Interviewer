// server/routes/github.route.js
import express from "express";
import { getGitHubProfile, getLeetCodeProfile } from "../controllers/github.controller.js";

const router = express.Router();

router.get("/user/:username", getGitHubProfile);
router.get("/leetcode/:username", getLeetCodeProfile);

export default router;

