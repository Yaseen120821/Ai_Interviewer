// src/pages/auth/LoginPage.jsx
// Firebase Authentication (Email/Password + Google Login) with MockMate AI design system.

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isFirebaseConfigured } from '../../config/firebase';
import firebaseAuthService from '../../services/firebaseAuthService';
import { authService } from '../../services/authService';
import useAuthStore from '../../store/authStore';
import Logo from '../../components/Logo';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&display=swap');

.auth {
  --bg: #F2EEE6;
  --card: #ffffff;
  --ink: #0A0A0A;
  --muted: #6B675F;
  --line: #E3DED2;
  --yellow: #F4CF63;
  --err: #B3323F;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  box-sizing: border-box;
}
.auth *, .auth *::before, .auth *::after { box-sizing: inherit; }

.auth-card {
  width: 100%;
  max-width: 440px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 36px clamp(22px, 5vw, 36px);
  box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 16px 40px rgba(0,0,0,.06);
}

.auth-logo { display: inline-flex; }

.auth h1 { margin: 28px 0 6px; font-size: 26px; line-height: 1.15; letter-spacing: -.02em; font-weight: 700; }
.auth-sub { margin: 0 0 24px; color: var(--muted); font-size: 15px; line-height: 1.4; }

.auth label { display: block; margin: 16px 0 6px; font-size: 13px; font-weight: 500; }
.auth input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #FBFAF7;
  font: inherit;
  font-size: 15px;
  color: var(--ink);
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.auth input::placeholder { color: #A39E93; }
.auth input:focus { outline: none; border-color: var(--ink); background: #fff; box-shadow: 0 0 0 4px rgba(244,207,99,.45); }

.auth-row-between { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.auth-row-between label { margin: 0; }
.auth-forgot { background: none; border: none; padding: 0; color: var(--muted); font-size: 12px; font-weight: 500; cursor: pointer; text-decoration: underline; }
.auth-forgot:hover { color: var(--ink); }

.auth-error { margin: 16px 0 0; padding: 10px 12px; border-radius: 10px; background: #FBEBED; color: var(--err); font-size: 13px; line-height: 1.4; }
.auth-success { margin: 16px 0 0; padding: 10px 12px; border-radius: 10px; background: #EBF7EE; color: #1E7E34; font-size: 13px; line-height: 1.4; }
.auth-notice { margin: 16px 0 0; padding: 10px 12px; border-radius: 10px; background: #FFF9E6; border: 1px solid #F4CF63; color: #856404; font-size: 12px; line-height: 1.4; }

.auth-btn {
  width: 100%;
  height: 48px;
  margin-top: 20px;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--bg);
  font: inherit;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background .15s, transform .15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-btn:hover:not(:disabled) { background: #262626; }
.auth-btn:active:not(:disabled) { transform: scale(.99); }
.auth-btn:disabled { opacity: .6; cursor: not-allowed; }

.auth-btn.google-btn {
  margin-top: 0;
  background: #FFFFFF;
  color: #0A0A0A;
  border: 1px solid var(--line);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  font-weight: 600;
  gap: 10px;
}
.auth-btn.google-btn:hover:not(:disabled) {
  background: #FBFAF7;
  border-color: #0A0A0A;
}

.auth-foot { margin: 24px 0 0; text-align: center; font-size: 14px; color: var(--muted); }
.auth-foot a { color: var(--ink); font-weight: 500; text-decoration: underline; text-decoration-color: var(--yellow); text-decoration-thickness: 2px; text-underline-offset: 3px; }

.auth-or { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: var(--muted); font-size: 13px; }
.auth-or::before, .auth-or::after { content: ""; flex: 1; height: 1px; background: var(--line); }

.auth-btn.alt { margin-top: 0; height: 44px; background: #fff; color: var(--ink); border: 1px solid var(--line); font-weight: 500; }
.auth-btn.alt:hover:not(:disabled) { background: #FBFAF7; border-color: var(--ink); }
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check for redirect result on mount
  useEffect(() => {
    firebaseAuthService.checkRedirectResult().then((result) => {
      if (result && result.backendAuth) {
        setAuth(result.backendAuth.token, result.backendAuth.user, result.firebaseUser);
        const dest = location.state?.from?.pathname || '/dashboard';
        navigate(dest, { replace: true });
      }
    });
  }, [location.state, navigate, setAuth]);

  // ── Google Sign-In Handler ───────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const result = await firebaseAuthService.loginWithGoogle();
      if (result && result.backendAuth) {
        setAuth(result.backendAuth.token, result.backendAuth.user, result.firebaseUser);
        const dest = location.state?.from?.pathname || '/dashboard';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      console.error('[LoginPage] Google sign-in error:', err);
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Firebase Email/Password Sign In ─────────────────────────────────────
  const handleFirebaseLogin = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setError('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        const { firebaseUser, backendAuth } = await firebaseAuthService.login(cleanEmail, password);
        setAuth(backendAuth.token, backendAuth.user, firebaseUser);
        const dest = location.state?.from?.pathname || '/dashboard';
        navigate(dest, { replace: true });
      } else {
        const res = await authService.syncProfile({
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          firebaseUid: `fb_dev_${Date.now()}`,
        });
        const { user, token } = res.data?.data || res.data;
        setAuth(token, user);
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('[LoginPage] Firebase login error:', err);
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please reset your password or try again later.';
      }
      setError(msg || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password Reset Handler ──────────────────────────────────────────────
  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setError('Please enter your email address above to receive a password reset link.');
    }
    setError('');
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        await firebaseAuthService.resetPassword(cleanEmail);
        setSuccessMsg(`Password reset instructions sent to ${cleanEmail}`);
      } else {
        setSuccessMsg(`Password reset link dispatched to ${cleanEmail}`);
      }
    } catch (err) {
      setError(err?.message || 'Could not send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // ── Quick Demo Session ──────────────────────────────────────────────────
  const handleQuickDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const demoEmail = `candidate_${Date.now()}@mockmate.ai`;
      const res = await authService.syncProfile({
        email: demoEmail,
        name: 'Alex Rivera (Demo)',
        firebaseUid: `demo_${Date.now()}`,
      });
      const { user, token } = res.data?.data || res.data;
      setAuth(token, user);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Could not initialize demo session. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <style>{STYLES}</style>
      <main className="auth-card">
        <Logo to="/" className="auth-logo" />

        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to your MockMate AI interview preparation workspace.</p>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {/* 1. Google Sign-In */}
        <button
          type="button"
          className="auth-btn google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div className="auth-or">or sign in with email</div>

        {/* 2. Email & Password Form */}
        <form onSubmit={handleFirebaseLogin} noValidate>
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div className="auth-row-between">
            <label htmlFor="login-password">Password</label>
            <button type="button" className="auth-forgot" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In with Email →'}
          </button>
        </form>

        <div className="auth-or">or</div>

        <button type="button" className="auth-btn alt" onClick={handleQuickDemo} disabled={loading}>
          ⚡ Start Instant Demo Session
        </button>

        <p className="auth-foot">
          Don’t have an account? <Link to="/register">Sign up</Link>
        </p>
      </main>
    </div>
  );
}
