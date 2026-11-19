# Ai_Interviewer — Complete Manual Execution & Setup Guide

This guide provides full instructions to run, configure, and verify the primary development project: **`Ai_Interviewer`**.

---

## 1. Directory Roles & Architecture

- **`Ai_Interviewer`** (**ONLY PRIMARY WORKING PROJECT**): The unified application combining InterviewPilot's design system, Elevo's interview workflows, Firebase Authentication & Cloud Firestore, and Google Gemini AI.
- **`Elevo-main`** (**READ-ONLY REFERENCE**): Reference for original Elevo feature logic.
- **`InterviewPilot-AI-main`** (**READ-ONLY REFERENCE**): Reference for original InterviewPilot UI/UX styling.

---

## 2. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **PostgreSQL**: v14 or higher (local or cloud instance like Supabase / Neon / Render)
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)
- **Firebase Project**: Web App in **clinic appointment** (Spark Free plan)

---

## 3. Environment Configuration

### Backend (`Ai_Interviewer/server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Connection (Prisma 7)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interviewpilot?schema=public"

# Optional MongoDB Connection String
MONGODB_URL=mongodb://127.0.0.1:27017/elevo

# Firebase Authentication & Firestore (Project: clinic-appointment)
FIREBASE_PROJECT_ID=clinic-appointment

# Google Gemini AI (Exclusive Provider)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# JWT Session Secret
JWT_SECRET=interviewpilot_super_secret_jwt_key_2026_dev_secure

# Judge0 Sandboxed Execution (Coding Round)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_or_judge0_key_here

# Razorpay Credentials (Optional)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend (`Ai_Interviewer/client/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id

# Firebase Configuration (Modular SDK — Project: clinic appointment)
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=clinic-appointment.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=clinic-appointment
VITE_FIREBASE_STORAGE_BUCKET=clinic-appointment.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
```

---

## 4. Installation & Startup Steps

### Step 1: Install Dependencies
```powershell
cd Ai_Interviewer\server
npm install

cd ..\client
npm install
```

### Step 2: Run Prisma Migrations
```powershell
cd Ai_Interviewer\server
npx prisma db push
```

### Step 3: Start the Backend Server (Port 5000)
```powershell
cd Ai_Interviewer\server
node index.js
```

### Step 4: Start the Frontend Client (Port 5173)
```powershell
cd Ai_Interviewer\client
npm run dev
```

---

## 5. Verification Checklist

1. **Backend Health**: `GET http://localhost:5000/api/health` returns status `200 OK` with Gemini & Firebase confirmation.
2. **Firebase Auth**: Sign up with email/password or use the one-click demo account on `http://localhost:5173/login`.
3. **Firestore Synchronization**: Real-time subscriptions update the Dashboard upon interview creation and completion.
4. **Interactive Mock Interview**: Complete a role session with AI voice synthesis, timer, and Gemini evaluation.
5. **Coding Round**: Monaco editor with Judge0 execution.
6. **ATS Resume Analysis**: Upload resume PDF/text to evaluate ATS score and keyword gaps.
