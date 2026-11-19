# Ai_Interviewer — Unified AI Interview Preparation Platform

An end-to-end, full-stack AI mock interview and career preparation platform combining **InterviewPilot's visual identity & UX design** with **Elevo's mock interview features**, standardized on **Google Gemini AI** and **Firebase Authentication & Cloud Firestore**.

Primary working directory: `Ai_Interviewer/`

---

## 🌟 Key Features

1. **InterviewPilot Design System**: Warm cream background (`#F2EEE6`), deep typography (`#0A0A0A`), crisp cards (`#FFFFFF`), butter yellow (`#F4CF63`), electric coral (`#FF5A1F`), Space Grotesk, Anton, Instrument Serif, and interactive animated SVG robot.
2. **Firebase Authentication & Cloud Firestore**: Official Firebase Modular SDK (Project: `clinic appointment`) providing Email/Password signup & signin, real-time listeners, and document isolation security rules.
3. **Google Gemini AI (Single AI Provider)**: Exclusively powered by `@google/generative-ai` (`gemini-2.5-flash` with multi-candidate fallbacks).
4. **Interactive Multi-Modal Avatar**: Animated SVG robot + video avatars (`male-ai.mp4`, `female-ai.mp4`), dynamic Web Audio visualizer, reactive states, and browser speech synthesis (TTS) & recognition (STT) with active echo prevention.
5. **9-Section Setup Wizard**: Comprehensive, Quick, or Adaptive modes; HR, Technical, Mixed; per-question circular timers (60s–180s) with auto-submit.
6. **Adaptive Interview Engine**: Evaluates answers across 3 metrics (Confidence, Communication, Correctness: 0–10) and dynamically generates personalized follow-up questions.
7. **Monaco Coding Round**: Multi-language editor, Judge0 test execution, and Gemini AI time/space complexity review.
8. **ATS Resume Analysis & Optimizer**: PDF text extraction (`pdf-parse`), match score (0–100), keyword detection, bullet point rewrites, and jsPDF export.
9. **Reports & Learning Roadmaps**: Performance metrics, radar charts, gap analysis, and branded PDF downloads.
10. **Razorpay Credit System**: Credit packs and signature-verified checkout.

---

## 📁 Project Structure

```
Ai_Interviewer/
├── client/                     # React 19 + Vite Frontend (InterviewPilot UI/UX)
│   ├── src/
│   │   ├── assets/videos/      # female-ai.mp4, male-ai.mp4
│   │   ├── components/         # AIInterviewerAvatar, InterviewTimer, Sidebar, Logo
│   │   ├── config/             # firebase.js (Modular SDK config)
│   │   ├── pages/              # LandingPage, LoginPage, RegisterPage, DashboardPage,
│   │   │                       # InterviewSetupPage, InterviewSessionPage, CodingWorkspacePage,
│   │   │                       # AtsResumePage, PricingPage, ReportPage, RoadmapPage
│   │   ├── routes/             # AppRouter, ProtectedRoute
│   │   ├── services/           # firebaseAuthService.js, firestoreService.js, voiceService.js, api.js
│   │   └── store/              # authStore.js (Zustand persistent)
│   ├── .env.example
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # prisma.js, connectDb.js
│   ├── controllers/            # auth, user, interview, coding, ats, payment
│   ├── middlewares/            # isAuth.js, upload.js
│   ├── routes/                 # Express API routes
│   ├── services/ai/            # gemini.service.js (Google Gemini exclusive provider)
│   ├── prisma/                 # PostgreSQL schema
│   ├── .env.example
│   └── package.json
│
├── firestore.rules             # Production Cloud Firestore Security Rules
├── storage.rules               # Firebase Storage access rules
└── firebase.json               # Firebase deployment configuration
```
