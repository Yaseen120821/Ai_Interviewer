// src/services/firestoreService.js
// Cloud Firestore Modular Database Service for InterviewPlatform
// Manages: users, companies, interviews, interview_phases, questions, responses, results

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../config/firebase.js";

// Helper for offline / pending configuration warning
const ensureFirebase = (actionName) => {
  if (!isFirebaseConfigured) {
    console.info(`[firestoreService] ${actionName} invoked in dev/mock mode (Firebase credentials pending).`);
  }
};

export const firestoreService = {
  // ── 1. Users Collection ──────────────────────────────────────────────────
  async createUserProfile(uid, data) {
    ensureFirebase("createUserProfile");
    try {
      const userRef = doc(db, "users", uid);
      const payload = {
        uid,
        name: data.name || data.displayName || "Candidate",
        email: data.email || "",
        role: data.role || "user",
        credits: data.credits ?? 100,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...data,
      };
      await setDoc(userRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.warn("[firestoreService.createUserProfile] Error:", err.message);
      return { uid, ...data };
    }
  },

  async getUserProfile(uid) {
    ensureFirebase("getUserProfile");
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn("[firestoreService.getUserProfile] Error:", err.message);
      return null;
    }
  },

  async updateUserProfile(uid, updates) {
    ensureFirebase("updateUserProfile");
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn("[firestoreService.updateUserProfile] Error:", err.message);
      return false;
    }
  },

  // Realtime listener for user profile (Credits, Name, Avatar, Preferences)
  subscribeToUserProfile(uid, callback) {
    if (!isFirebaseConfigured || !uid) return () => {};
    try {
      const userRef = doc(db, "users", uid);
      return onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() });
          }
        },
        (err) => console.warn("[subscribeToUserProfile] error:", err.message)
      );
    } catch {
      return () => {};
    }
  },

  // Realtime listener for user resumes
  subscribeToUserResumes(userId, callback) {
    if (!isFirebaseConfigured || !userId) return () => {};
    try {
      const q = query(collection(db, "resumes"), where("userId", "==", userId));
      return onSnapshot(
        q,
        (snap) => {
          callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => console.warn("[subscribeToUserResumes] error:", err.message)
      );
    } catch {
      return () => {};
    }
  },

  // ── 2. Companies Collection ──────────────────────────────────────────────
  async getCompanies() {
    ensureFirebase("getCompanies");
    try {
      const colRef = collection(db, "companies");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      return this.seedDefaultCompanies();
    } catch (err) {
      console.warn("[firestoreService.getCompanies] Falling back to default companies:", err.message);
      return this.seedDefaultCompanies();
    }
  },

  seedDefaultCompanies() {
    return [
      { id: "google", name: "Google", role: "Full Stack Engineer", phases: ["HR & Fit", "System Design", "Coding Round"] },
      { id: "amazon", name: "Amazon", role: "Software Development Engineer", phases: ["Leadership Principles", "Technical Depth", "Live Coding"] },
      { id: "microsoft", name: "Microsoft", role: "Software Engineer", phases: ["Technical Screening", "Data Structures", "System Architecture"] },
      { id: "tcs", name: "TCS", role: "Digital Cadre Engineer", phases: ["Aptitude & Technical", "Problem Solving", "Managerial & HR"] },
      { id: "meta", name: "Meta", role: "Front End Engineer", phases: ["Behavioral", "Coding & Algorithms", "UI Architecture"] },
    ];
  },

  // ── 3. Interviews Collection ─────────────────────────────────────────────
  async createInterview(interviewData) {
    ensureFirebase("createInterview");
    try {
      const interviewId = interviewData.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, "interviews", interviewId);
      const payload = {
        id: interviewId,
        userId: interviewData.userId,
        selectedCompany: interviewData.selectedCompany || "General Tech",
        jobRole: interviewData.jobRole || "Full Stack Developer",
        interviewStatus: interviewData.interviewStatus || "in-progress", // 'in-progress' | 'completed' | 'cancelled'
        currentPhase: interviewData.currentPhase || "Technical",
        roundType: interviewData.roundType || "Technical",
        difficulty: interviewData.difficulty || "Medium",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...interviewData,
      };
      await setDoc(docRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.warn("[firestoreService.createInterview] Error:", err.message);
      return interviewData;
    }
  },

  async getInterview(interviewId) {
    ensureFirebase("getInterview");
    try {
      const docRef = doc(db, "interviews", interviewId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn("[firestoreService.getInterview] Error:", err.message);
      return null;
    }
  },

  async updateInterview(interviewId, updates) {
    ensureFirebase("updateInterview");
    try {
      const docRef = doc(db, "interviews", interviewId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.warn("[firestoreService.updateInterview] Error:", err.message);
      return false;
    }
  },

  async getUserInterviews(userId) {
    ensureFirebase("getUserInterviews");
    try {
      const q = query(
        collection(db, "interviews"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[firestoreService.getUserInterviews] Error:", err.message);
      return [];
    }
  },

  // Realtime listener for a single interview
  subscribeToInterview(interviewId, callback) {
    if (!isFirebaseConfigured || !interviewId) return () => {};
    try {
      const docRef = doc(db, "interviews", interviewId);
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() });
          }
        },
        (err) => {
          console.warn("[subscribeToInterview] listener error:", err.message);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("[subscribeToInterview] initialization error:", err.message);
      return () => {};
    }
  },

  // Realtime listener for a user's interview history
  subscribeToUserInterviews(userId, callback) {
    if (!isFirebaseConfigured || !userId) return () => {};
    try {
      const q = query(
        collection(db, "interviews"),
        where("userId", "==", userId)
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(list);
        },
        (err) => {
          console.warn("[subscribeToUserInterviews] listener error:", err.message);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn("[subscribeToUserInterviews] initialization error:", err.message);
      return () => {};
    }
  },

  // ── 4. Interview Phases Collection ───────────────────────────────────────
  async saveInterviewPhase(phaseData) {
    ensureFirebase("saveInterviewPhase");
    try {
      const phaseId = phaseData.id || `phase_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, "interview_phases", phaseId);
      const payload = {
        id: phaseId,
        interviewId: phaseData.interviewId,
        phaseName: phaseData.phaseName || "Technical Phase",
        phaseStatus: phaseData.phaseStatus || "pending", // 'pending' | 'in-progress' | 'completed'
        phaseScore: phaseData.phaseScore ?? null,
        updatedAt: serverTimestamp(),
        ...phaseData,
      };
      await setDoc(docRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.warn("[firestoreService.saveInterviewPhase] Error:", err.message);
      return phaseData;
    }
  },

  async getInterviewPhases(interviewId) {
    ensureFirebase("getInterviewPhases");
    try {
      const q = query(
        collection(db, "interview_phases"),
        where("interviewId", "==", interviewId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[firestoreService.getInterviewPhases] Error:", err.message);
      return [];
    }
  },

  subscribeToInterviewPhases(interviewId, callback) {
    if (!isFirebaseConfigured || !interviewId) return () => {};
    try {
      const q = query(
        collection(db, "interview_phases"),
        where("interviewId", "==", interviewId)
      );
      return onSnapshot(
        q,
        (snap) => {
          callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => console.warn("[subscribeToInterviewPhases] error:", err.message)
      );
    } catch {
      return () => {};
    }
  },

  // ── 5. Questions Collection ──────────────────────────────────────────────
  async saveQuestion(questionData) {
    ensureFirebase("saveQuestion");
    try {
      const questionId = questionData.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, "questions", questionId);
      const payload = {
        id: questionId,
        interviewId: questionData.interviewId,
        questionDetails: questionData.questionDetails || questionData.question || "",
        questionCategory: questionData.questionCategory || "General",
        difficulty: questionData.difficulty || "Medium",
        associatedInterviewPhase: questionData.associatedInterviewPhase || "Technical",
        createdAt: serverTimestamp(),
        ...questionData,
      };
      await setDoc(docRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.warn("[firestoreService.saveQuestion] Error:", err.message);
      return questionData;
    }
  },

  async getQuestions(interviewId) {
    ensureFirebase("getQuestions");
    try {
      const q = query(
        collection(db, "questions"),
        where("interviewId", "==", interviewId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[firestoreService.getQuestions] Error:", err.message);
      return [];
    }
  },

  // ── 6. Responses Collection ──────────────────────────────────────────────
  async saveResponse(responseData) {
    ensureFirebase("saveResponse");
    try {
      const respId = responseData.id || `resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, "responses", respId);
      const payload = {
        id: respId,
        userId: responseData.userId,
        interviewId: responseData.interviewId,
        questionId: responseData.questionId,
        answer: responseData.answer || "",
        submissionTimestamp: serverTimestamp(),
        ...responseData,
      };
      await setDoc(docRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.warn("[firestoreService.saveResponse] Error:", err.message);
      return responseData;
    }
  },

  async getResponses(interviewId) {
    ensureFirebase("getResponses");
    try {
      const q = query(
        collection(db, "responses"),
        where("interviewId", "==", interviewId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[firestoreService.getResponses] Error:", err.message);
      return [];
    }
  },

  // ── 7. Results Collection ────────────────────────────────────────────────
  async saveResult(resultData) {
    ensureFirebase("saveResult");
    try {
      const resultId = resultData.id || resultData.interviewId || `res_${Date.now()}`;
      const docRef = doc(db, "results", resultId);
      const payload = {
        id: resultId,
        interviewId: resultData.interviewId,
        userId: resultData.userId,
        overallScore: resultData.overallScore ?? 0,
        phaseWiseScores: resultData.phaseWiseScores || {},
        feedback: resultData.feedback || "",
        completionStatus: resultData.completionStatus || "completed",
        createdAt: serverTimestamp(),
        ...resultData,
      };
      await setDoc(docRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.warn("[firestoreService.saveResult] Error:", err.message);
      return resultData;
    }
  },

  async getResult(interviewId) {
    ensureFirebase("getResult");
    try {
      const docRef = doc(db, "results", interviewId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn("[firestoreService.getResult] Error:", err.message);
      return null;
    }
  },

  subscribeToResult(interviewId, callback) {
    if (!isFirebaseConfigured || !interviewId) return () => {};
    try {
      const docRef = doc(db, "results", interviewId);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() });
          }
        },
        (err) => console.warn("[subscribeToResult] error:", err.message)
      );
    } catch {
      return () => {};
    }
  },
};

export default firestoreService;

