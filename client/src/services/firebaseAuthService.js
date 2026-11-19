// src/services/firebaseAuthService.js
// Firebase Modular Authentication Service for InterviewPlatform
// Supports Email/Password signup, signin, Google Sign-In, logout, and auth state listeners

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../config/firebase.js";
import firestoreService from "./firestoreService.js";
import api from "./api.js";

// Initialize and configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const firebaseAuthService = {
  // ── 1. Register with Email & Password ────────────────────────────────────
  async register(email, password, displayName = "") {
    if (!isFirebaseConfigured) {
      console.warn("[firebaseAuthService] Register called with dev credentials placeholder.");
    }
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Update Firebase display name if provided
    if (displayName) {
      try {
        await updateProfile(user, { displayName });
      } catch (e) {
        console.warn("[firebaseAuthService] Could not set displayName:", e.message);
      }
    }

    // Create user profile in Firestore
    try {
      await firestoreService.createUserProfile(user.uid, {
        name: displayName || cleanEmail.split("@")[0],
        email: cleanEmail,
        provider: "password",
        role: "user",
        accountStatus: "active",
        credits: 100,
      });
    } catch (e) {
      console.warn("[firebaseAuthService] Firestore profile creation notice:", e.message);
    }

    // Synchronize session with backend API
    let backendAuth = null;
    try {
      const syncRes = await api.post("/auth/firebase-sync", {
        email: cleanEmail,
        name: displayName || cleanEmail.split("@")[0],
        firebaseUid: user.uid,
      });
      backendAuth = syncRes.data?.data || syncRes.data;
    } catch (e) {
      console.warn("[firebaseAuthService] Backend session sync fallback:", e.message);
      backendAuth = {
        token: `fb_jwt_${user.uid}`,
        user: {
          id: user.uid,
          email: cleanEmail,
          name: displayName || cleanEmail.split("@")[0],
          credits: 100,
        },
      };
    }

    return {
      firebaseUser: user,
      backendAuth,
    };
  },

  // ── 2. Login with Email & Password ───────────────────────────────────────
  async login(email, password) {
    if (!isFirebaseConfigured) {
      console.warn("[firebaseAuthService] Login called with dev credentials placeholder.");
    }
    const cleanEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    // Fetch or update Firestore user profile
    try {
      let profile = await firestoreService.getUserProfile(user.uid);
      if (!profile) {
        await firestoreService.createUserProfile(user.uid, {
          name: user.displayName || cleanEmail.split("@")[0],
          email: cleanEmail,
          provider: "password",
          role: "user",
          accountStatus: "active",
          credits: 100,
        });
      }
    } catch (e) {
      console.warn("[firebaseAuthService] Firestore fetch error:", e.message);
    }

    // Synchronize session with backend API
    let backendAuth = null;
    try {
      const syncRes = await api.post("/auth/firebase-sync", {
        email: cleanEmail,
        name: user.displayName || cleanEmail.split("@")[0],
        firebaseUid: user.uid,
      });
      backendAuth = syncRes.data?.data || syncRes.data;
    } catch (e) {
      console.warn("[firebaseAuthService] Backend session sync fallback:", e.message);
      backendAuth = {
        token: `fb_jwt_${user.uid}`,
        user: {
          id: user.uid,
          email: cleanEmail,
          name: user.displayName || cleanEmail.split("@")[0],
          credits: 100,
        },
      };
    }

    return {
      firebaseUser: user,
      backendAuth,
    };
  },

  // ── 3. Google Sign-In ────────────────────────────────────────────────────
  async loginWithGoogle() {
    if (!isFirebaseConfigured) {
      console.warn("[firebaseAuthService] Google Login invoked in dev fallback mode.");
      const demoEmail = `google_user_${Date.now()}@gmail.com`;
      const res = await api.post("/auth/firebase-sync", {
        email: demoEmail,
        name: "Google Candidate",
        firebaseUid: `google_uid_${Date.now()}`,
      });
      return {
        firebaseUser: { uid: `google_uid_${Date.now()}`, email: demoEmail, displayName: "Google Candidate" },
        backendAuth: res.data?.data || res.data,
      };
    }

    let userCredential = null;
    try {
      // 1. Attempt Popup Sign-in
      userCredential = await signInWithPopup(auth, googleProvider);
    } catch (popupErr) {
      console.warn("[firebaseAuthService] Google popup error:", popupErr.code, popupErr.message);

      if (popupErr.code === "auth/popup-blocked") {
        console.info("[firebaseAuthService] Popup blocked by browser. Attempting redirect fallback...");
        await signInWithRedirect(auth, googleProvider);
        return null; // Will resume via getRedirectResult on reload
      }

      if (popupErr.code === "auth/popup-closed-by-user" || popupErr.code === "auth/cancelled-popup-request") {
        throw new Error("Google sign-in was cancelled. Please try again.");
      }

      if (popupErr.code === "auth/unauthorized-domain") {
        throw new Error(
          "Current domain is not authorized in your Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized Domains and add 'localhost'."
        );
      }

      if (popupErr.code === "auth/account-exists-with-different-credential") {
        throw new Error("An account already exists with this email using a different sign-in method.");
      }

      throw popupErr;
    }

    const user = userCredential.user;
    const cleanEmail = (user.email || "").toLowerCase();
    const displayName = user.displayName || cleanEmail.split("@")[0] || "Candidate";

    // Create or update Firestore profile
    try {
      let existingProfile = await firestoreService.getUserProfile(user.uid);
      if (!existingProfile) {
        await firestoreService.createUserProfile(user.uid, {
          uid: user.uid,
          name: displayName,
          displayName,
          email: cleanEmail,
          photoURL: user.photoURL || null,
          provider: "google",
          role: "user",
          accountStatus: "active",
          credits: 100,
        });
      } else {
        await firestoreService.updateUserProfile(user.uid, {
          lastLoginAt: new Date().toISOString(),
          photoURL: user.photoURL || existingProfile.photoURL || null,
        });
      }
    } catch (fsErr) {
      console.warn("[firebaseAuthService] Firestore Google profile sync note:", fsErr.message);
    }

    // Synchronize session with backend API
    let backendAuth = null;
    try {
      const syncRes = await api.post("/auth/firebase-sync", {
        email: cleanEmail,
        name: displayName,
        firebaseUid: user.uid,
      });
      backendAuth = syncRes.data?.data || syncRes.data;
    } catch (e) {
      console.warn("[firebaseAuthService] Backend session sync fallback:", e.message);
      backendAuth = {
        token: `fb_jwt_${user.uid}`,
        user: {
          id: user.uid,
          email: cleanEmail,
          name: displayName,
          credits: 100,
        },
      };
    }

    return {
      firebaseUser: user,
      backendAuth,
    };
  },

  // ── 4. Check for Redirect Result (Fallback) ──────────────────────────────
  async checkRedirectResult() {
    if (!auth) return null;
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const user = result.user;
        const cleanEmail = (user.email || "").toLowerCase();
        const displayName = user.displayName || cleanEmail.split("@")[0] || "Candidate";

        // Sync with backend
        const syncRes = await api.post("/auth/firebase-sync", {
          email: cleanEmail,
          name: displayName,
          firebaseUid: user.uid,
        });
        const backendAuth = syncRes.data?.data || syncRes.data;
        return { firebaseUser: user, backendAuth };
      }
    } catch (err) {
      console.warn("[firebaseAuthService] checkRedirectResult error:", err.message);
    }
    return null;
  },

  // ── 5. Logout ────────────────────────────────────────────────────────────
  async logout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("[firebaseAuthService] Firebase signOut error:", e.message);
    }
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    return true;
  },

  // ── 6. Send Password Reset Email ─────────────────────────────────────────
  async resetPassword(email) {
    const cleanEmail = email.trim().toLowerCase();
    return sendPasswordResetEmail(auth, cleanEmail);
  },

  // ── 7. Subscribe to Firebase Auth State ──────────────────────────────────
  subscribeToAuthState(callback) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },

  // ── 8. Current User Helper ───────────────────────────────────────────────
  getCurrentUser() {
    return auth?.currentUser || null;
  },
};

export default firebaseAuthService;
