// src/routes/AppRouter.jsx
// Central routing definition linking all MockMate AI application pages.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import { lazy, Suspense } from 'react';

// ── Static Imports for Critical Entry Pages (zero chunk loading lag or blank screens) ──
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// ── Lazy Pages for Secondary/Heavy Workspaces ──────────────────────────────────
const DashboardPage        = lazy(() => import('../pages/DashboardPage'));
const InterviewSetupPage   = lazy(() => import('../pages/interview/InterviewSetupPage'));
const InterviewSessionPage = lazy(() => import('../pages/interview/InterviewSessionPage'));
const InterviewHistoryPage = lazy(() => import('../pages/interview/InterviewHistoryPage'));
const CodingWorkspacePage  = lazy(() => import('../pages/interview/CodingWorkspacePage'));
const CodingPracticePage   = lazy(() => import('../pages/coding/CodingPracticePage'));
const GitHubProgressPage   = lazy(() => import('../pages/github/GitHubProgressPage'));
const ProfilePage          = lazy(() => import('../pages/profile/ProfilePage'));
const SettingsPage         = lazy(() => import('../pages/SettingsPage'));
const AtsResumePage        = lazy(() => import('../pages/AtsResumePage'));
const PricingPage          = lazy(() => import('../pages/PricingPage'));
const ReportPage           = lazy(() => import('../pages/ReportPage'));
const RoadmapPage          = lazy(() => import('../pages/RoadmapPage'));
const ResumePage           = lazy(() => import('../pages/ResumePage'));

// ── Loading Fallback with Explicit CSS Animation ───────────────────────────────
const LOADER_STYLES = `
@keyframes ipSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

const Loader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F2EEE6',
    gap: '16px',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  }}>
    <style>{LOADER_STYLES}</style>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '3px solid #E3DED2',
      borderTopColor: '#FF5A1F',
      animation: 'ipSpin 0.8s linear infinite',
    }} />
    <span style={{ fontSize: '13px', color: '#6B675F', fontWeight: 500 }}>
      Loading MockMate AI...
    </span>
  </div>
);

// ── Auth Wrapper ───────────────────────────────────────────────────────────────
const AuthShell = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const AppRouter = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public Routes — Render Immediately */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard & Operations */}
          <Route path="/dashboard"          element={<AuthShell><DashboardPage /></AuthShell>} />
          <Route path="/profile"            element={<AuthShell><ProfilePage /></AuthShell>} />
          <Route path="/github"             element={<AuthShell><GitHubProgressPage /></AuthShell>} />
          <Route path="/coding"             element={<AuthShell><CodingPracticePage /></AuthShell>} />
          <Route path="/settings"           element={<AuthShell><SettingsPage /></AuthShell>} />
          <Route path="/resume"             element={<AuthShell><ResumePage /></AuthShell>} />
          <Route path="/resume/ats"         element={<AuthShell><AtsResumePage /></AuthShell>} />
          <Route path="/pricing"            element={<AuthShell><PricingPage /></AuthShell>} />
          <Route path="/interview/history"  element={<AuthShell><InterviewHistoryPage /></AuthShell>} />
          <Route path="/history"            element={<Navigate to="/interview/history" replace />} />
          <Route path="/report/:id"         element={<AuthShell><ReportPage /></AuthShell>} />
          <Route path="/roadmap/:id"        element={<AuthShell><RoadmapPage /></AuthShell>} />

          {/* Mock Interview & Coding Arena */}
          <Route path="/interview/setup"       element={<AuthShell><InterviewSetupPage /></AuthShell>} />
          <Route path="/interview/new"         element={<Navigate to="/interview/setup" replace />} />
          <Route path="/interview/:id"         element={<AuthShell><InterviewSessionPage /></AuthShell>} />
          <Route path="/interview/session"     element={<Navigate to="/interview/setup" replace />} />
          <Route path="/interview/session/:id" element={<AuthShell><InterviewSessionPage /></AuthShell>} />
          <Route path="/interview/coding"      element={<AuthShell><CodingWorkspacePage /></AuthShell>} />
          <Route path="/interview/coding/:id"  element={<AuthShell><CodingWorkspacePage /></AuthShell>} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ErrorBoundary>
);

export default AppRouter;
