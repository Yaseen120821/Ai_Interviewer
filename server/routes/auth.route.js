// Ai_Interviewer - Authentication Routes (Firebase Sync & Profile Session)
import express from "express";
import { firebaseSync, instantSync, getMe, logOut } from "../controllers/auth.controller.js";
import isAuth from "../middlewares/isAuth.js";

const authRouter = express.Router();

authRouter.post("/firebase-sync", firebaseSync);
authRouter.post("/sync", firebaseSync);
authRouter.post("/instant-sync", instantSync); // backwards-compatible alias
authRouter.get("/me", isAuth, getMe);
authRouter.get("/logout", logOut);
authRouter.post("/logout", logOut);

export default authRouter;
