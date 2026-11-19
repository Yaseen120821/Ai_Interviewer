// src/lib/firebase.js
// Re-export from central config for library path compatibility (Auth + Firestore only)

export { default, app, db, auth, firebaseConfig, isFirebaseConfigured } from "../config/firebase.js";

