// src/App.jsx
import { useEffect } from 'react';
import AppRouter from './routes/AppRouter';
import firebaseAuthService from './services/firebaseAuthService';
import firestoreService from './services/firestoreService';
import useAuthStore from './store/authStore';
import api from './services/api';

function App() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    // 1. Firebase Auth state listener
    const unsubscribeAuth = firebaseAuthService.subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
          try {
            const syncRes = await api.post('/auth/firebase-sync', {
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              firebaseUid: fbUser.uid,
            });
            const { user, token } = syncRes.data?.data || syncRes.data;
            setAuth(token, user, fbUser);
          } catch {
            setAuth(`fb_token_${fbUser.uid}`, {
              id: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              credits: 100,
            }, fbUser);
          }
        }
      }
    });

    // 2. Real-time Firestore user profile synchronization
    let unsubscribeProfile = () => {};
    const currentUser = useAuthStore.getState().user;
    const uid = currentUser?.id || currentUser?.uid;
    if (uid) {
      unsubscribeProfile = firestoreService.subscribeToUserProfile(uid, (profile) => {
        if (profile) {
          updateUser({
            name: profile.name || profile.displayName || currentUser.name,
            credits: profile.credits !== undefined ? profile.credits : currentUser.credits,
            profileImage: profile.photoURL || currentUser.profileImage,
          });
        }
      });
    }

    return () => {
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
      if (typeof unsubscribeProfile === 'function') unsubscribeProfile();
    };
  }, [setAuth, setFirebaseUser, updateUser]);

  return <AppRouter />;
}

export default App;
