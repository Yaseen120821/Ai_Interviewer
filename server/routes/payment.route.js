import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { getPlans, createOrder, verifyPayment } from "../controllers/payment.controller.js";

const paymentRouter = express.Router();

paymentRouter.get("/plans", isAuth, getPlans);
paymentRouter.post("/order", isAuth, createOrder);
paymentRouter.post("/orders", isAuth, createOrder);
paymentRouter.post("/verify", isAuth, verifyPayment);

export default paymentRouter;
