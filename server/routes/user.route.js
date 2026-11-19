import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getCurrentUser, getDashboardMetrics } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/dashboard", isAuth, getDashboardMetrics);
userRouter.get("/current-user", isAuth, getCurrentUser);
userRouter.get("/profile", isAuth, getCurrentUser);

export default userRouter;
