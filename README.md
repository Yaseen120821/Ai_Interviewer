# MockMate AI — Business-Grade AI Mock Interview & Developer Platform

**MockMate AI** — "Practice Smarter. Interview Better. Get Hired."

An end-to-end, business-grade AI mock interview, developer analytics, and career preparation platform featuring **fullscreen AI avatar interview simulations, question-first narration, deep analytics dashboard, developer GitHub progress tracking, LeetCode profile linking, and open-source coding practice**, standardized on **Google Gemini AI** and **Firebase Authentication & Cloud Firestore (Spark Free Plan)**.

Primary working directory: `Ai_Interviewer/`

---

## 🌟 Key Features

1. **MockMate AI Design System**: Warm cream background (`#F2EEE6`), deep typography (`#0A0A0A`), crisp cards (`#FFFFFF`), butter yellow (`#F4CF63`), electric coral (`#FF5A1F`), Space Grotesk, Anton, Instrument Serif, collapsible sidebar, and responsive mobile drawers.
2. **Question-First AI Avatar Narration**: Complete question spoken aloud via Speech Synthesis before the response timer or candidate input unlocks, with a strict avatar state machine (`IDLE`, `LOADING`, `SPEAKING`, `LISTENING`, `PROCESSING`, `ERROR`, `COMPLETED`).
3. **Mandatory Fullscreen Interview Simulation**: Browser Fullscreen API integration requested on setup start, with active fullscreen-loss detection that pauses timers and preserves responses.
4. **Business-Grade Analytics Dashboard**: 8 key operational metrics (Total, Completed, In-Progress, Average Score, Highest Score, Practice Time, Completion Rate, Score Improvement), interactive performance trend lines (7d/30d/90d/All), skill radar charts, and recent activity logs.
5. **Candidate Profile System**: Comprehensive user profile with technical skill proficiency levels, LinkedIn, GitHub, LeetCode, portfolio links, and local PDF resume lifecycle management.
6. **GitHub Integration & Progress Tracking**: Real-time integration with GitHub Public REST API displaying repositories, stars, forks, primary languages, and recent public activity.
7. **Open-Source Coding Practice & LeetCode Linking**: Curated algorithmic problem bank across 15+ topics with difficulty filters, in-browser Monaco code workspace, test case verification, and external LeetCode progress linking.
8. **Firebase Authentication & Cloud Firestore (Spark Free Plan)**: Official Firebase Modular SDK providing persistent user isolation via immutable Firebase UID (`users/{uid}`) with zero Firebase Storage dependencies.
9. **Google Gemini AI Integration**: Structured interview questions, real-time rubric evaluations, and personalized learning roadmaps with graceful fallback when API key is unconfigured.
10. **Resume & JD Multi-Mode Interviews**: Support for Resume-based, Job Description-based (no resume needed), and General Role-based interview simulations.

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
