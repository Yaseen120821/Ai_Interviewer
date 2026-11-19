// src/store/authStore.js
// Zustand global auth state for MockMate AI.
// Persists token and user to localStorage so auth survives page refresh.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TOKEN_KEY = 'mockmate_token';
const USER_KEY = 'mockmate_user';
const LEGACY_TOKEN_KEY = 'interviewpilot_token';
const LEGACY_USER_KEY = 'interviewpilot_user';

// Read initial token and user, supporting seamless migration from legacy storage keys
const getInitialState = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
    const user = rawUser ? JSON.parse(rawUser) : null;
    return { token, user, isAuthenticated: Boolean(token && user) };
  } catch {
    return { token: null, user: null, isAuthenticated: false };
  }
};

const initial = getInitialState();

const useAuthStore = create(
  persist(
    (set) => ({
      token: initial.token,
      user: initial.user,
      firebaseUser: null,
      isAuthenticated: initial.isAuthenticated,

      setAuth: (token, user, firebaseUser = null) => {
        try {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          // Clean up legacy keys
          localStorage.removeItem(LEGACY_TOKEN_KEY);
          localStorage.removeItem(LEGACY_USER_KEY);
        } catch { /* ignore */ }
        set({ token, user, firebaseUser, isAuthenticated: true });
      },

      setFirebaseUser: (firebaseUser) => {
        set({ firebaseUser });
      },

      clearAuth: () => {
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(LEGACY_TOKEN_KEY);
          localStorage.removeItem(LEGACY_USER_KEY);
        } catch { /* ignore */ }
        set({ token: null, user: null, firebaseUser: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'mockmate-auth',
      // Only persist these keys to localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
