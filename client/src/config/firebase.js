// src/config/firebase.js
// Centralized Firebase Modular JavaScript SDK Configuration for InterviewPlatform
// Spark (Free) Plan: Firebase Auth + Cloud Firestore ONLY (Zero Firebase Storage dependencies)
// Project: clinic appointment

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Support both standard Vite (VITE_FIREBASE_*) and Next.js / legacy (NEXT_PUBLIC_FIREBASE_*) naming conventions
const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "clinic-appointment.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "clinic-appointment",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Configuration validation helper
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  !firebaseConfig.apiKey.includes("your_") &&
  !firebaseConfig.apiKey.includes("YOUR_")
);

if (!isFirebaseConfigured) {
  console.info(
    "[Firebase Config] Firebase environment variables pending configuration. " +
    "Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc. in client/.env"
  );
}

// Fallback dummy config for safe initialization without crashing bundling during dev
const activeConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: "AIzaSyDevPlaceholderKey1234567890abcdef",
      authDomain: "clinic-appointment.firebaseapp.com",
      projectId: "clinic-appointment",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdef1234567890abcdef",
    };

// Initialize Firebase only once to prevent duplicate initialization
const app = getApps().length > 0 ? getApps()[0] : initializeApp(activeConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };
export default app;

