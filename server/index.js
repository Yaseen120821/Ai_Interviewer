import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

import connectDb from "./config/connectDb.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import codingRouter from "./routes/coding.route.js";
import atsRouter from "./routes/ats.route.js";
import paymentRouter from "./routes/payment.route.js";
import resumeRouter from "./routes/resume.route.js";
import reportRouter from "./routes/report.route.js";
import roadmapRouter from "./routes/roadmap.route.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://elevo-interview.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching allowedOrigins
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Ai_Interviewer server is running with Google Gemini AI & Firebase.",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (supporting both /api and /api/v1 prefixes)
const mountRouters = (prefix) => {
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/users`, userRouter);
  app.use(`${prefix}/user`, userRouter);
  app.use(`${prefix}/interviews`, interviewRouter);
  app.use(`${prefix}/interview`, interviewRouter);
  app.use(`${prefix}/coding`, codingRouter);
  app.use(`${prefix}/ats`, atsRouter);
  app.use(`${prefix}/resumes`, resumeRouter);
  app.use(`${prefix}/resume`, resumeRouter);
  app.use(`${prefix}/payments`, paymentRouter);
  app.use(`${prefix}/payment`, paymentRouter);
  app.use(`${prefix}/reports`, reportRouter);
  app.use(`${prefix}/report`, reportRouter);
  app.use(`${prefix}/roadmaps`, roadmapRouter);
  app.use(`${prefix}/roadmap`, roadmapRouter);
};

mountRouters("/api");
mountRouters("/api/v1");

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Ai_Interviewer Error]:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Ai_Interviewer] Server running on port ${PORT}`);
  if (process.env.MONGODB_URL) {
    connectDb().catch(() => {});
  }
});

export default app;
