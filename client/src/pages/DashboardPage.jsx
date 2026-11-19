// src/pages/DashboardPage.jsx
// Signature InterviewPilot AI Dashboard with real-time Firebase Firestore synchronization,
// fluid widescreen layout, zero empty margins, and multi-mode interview launching.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import firestoreService from '../services/firestoreService';
import { resumeService } from '../services/resumeService';
import {
  Sparkles,
  Mic,
  Code2,
  ScanText,
  Layers,
  Award,
  ArrowRight,
  TrendingUp,
  FileText,
  Coins,
  CheckCircle2,
  Clock,
  Briefcase,
  Play,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [metrics, setMetrics] = useState({
    totalCompleted: 0,
    totalSessions: 0,
    avgScore: 0,
    bestScore: 0,
    roadmapProgress: 0,
    atsCount: 0,
  });
  const [activeResume, setActiveResume] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);

  // 1. Fetch initial dashboard data & active resume
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, resumeRes] = await Promise.allSettled([
          api.get('/users/dashboard'),
          resumeService.getActive(),
        ]);

        if (dashRes.status === 'fulfilled') {
          const data = dashRes.value.data?.data || dashRes.value.data;
          if (data?.metrics) setMetrics(data.metrics);
          if (data?.stats) {
            setMetrics((prev) => ({
              ...prev,
              totalCompleted: data.stats.totalCompleted ?? prev.totalCompleted,
              avgScore: data.stats.averageScore ?? prev.avgScore,
              bestScore: data.stats.bestScore ?? prev.bestScore,
            }));
          }
          if (data?.user) {
            updateUser({
              name: data.user.name || user?.name,
              credits: data.user.credits !== undefined ? data.user.credits : user?.credits,
            });
          }
          if (data?.recentSessions) setRecentInterviews(data.recentSessions);
        }

        if (resumeRes.status === 'fulfilled' && resumeRes.value?.data?.data) {
          setActiveResume(resumeRes.value.data.data);
        }
      } catch {
        // Fallback fetch
        try {
          const sessionsRes = await api.get('/interviews');
          const list = sessionsRes.data?.data || sessionsRes.data || [];
          setRecentInterviews(list.slice(0, 5));
          const completed = list.filter((s) => s.status === 'completed');
          setMetrics((prev) => ({
            ...prev,
            totalCompleted: completed.length,
            totalSessions: list.length,
          }));
        } catch {
          /* ignore */
        }
      }
    };

    fetchDashboardData();

    // 2. Realtime Firestore synchronization for interviews
    const userId = user?.id || user?.uid;
    let unsubscribeInterviews = () => {};
    let unsubscribeProfile = () => {};

    if (userId) {
      unsubscribeInterviews = firestoreService.subscribeToUserInterviews(userId, (fbInterviews) => {
        if (fbInterviews && fbInterviews.length > 0) {
          setRecentInterviews(fbInterviews.slice(0, 5));
          const completed = fbInterviews.filter(
            (i) => i.interviewStatus === 'completed' || i.status === 'completed'
          );
          setMetrics((prev) => ({
            ...prev,
            totalCompleted: Math.max(prev.totalCompleted, completed.length),
            totalSessions: Math.max(prev.totalSessions, fbInterviews.length),
          }));
        }
      });

      // Synchronize credits and profile changes in real time
      unsubscribeProfile = firestoreService.subscribeToUserProfile(userId, (profile) => {
        if (profile) {
          updateUser({
            name: profile.name || profile.displayName || user?.name,
            credits: profile.credits !== undefined ? profile.credits : user?.credits,
            profileImage: profile.photoURL || user?.profileImage,
          });
        }
      });
    }

    return () => {
      if (typeof unsubscribeInterviews === 'function') unsubscribeInterviews();
      if (typeof unsubscribeProfile === 'function') unsubscribeProfile();
    };
  }, [user?.id, user?.uid, updateUser]);

  const userName = user?.name || user?.email?.split('@')[0] || 'Candidate';

  return (
    <div style={layoutStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        {/* Welcome Hero Banner — Fluid and Impactful */}
        <section style={heroCardStyle}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={heroPillStyle}>
              <Sparkles size={14} color="#FF5A1F" />
              <span>AI PREPARATION SUITE</span>
            </div>
            <h1 style={heroTitleStyle}>Welcome back, {userName}!</h1>
            <p style={heroDescStyle}>
              Your AI-powered interview practice platform is primed. Practice using any job description without a resume, test your code in the sandbox arena, and audit your ATS match score.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/interview/setup')}
                style={primaryBtnStyle}
              >
                <Mic size={16} /> Start JD Mock Interview
              </button>
              <button
                onClick={() => navigate('/interview/coding')}
                style={secondaryBtnStyle}
              >
                <Code2 size={16} /> Open Coding Arena
              </button>
              <button
                onClick={() => navigate('/resume/ats')}
                style={secondaryBtnStyle}
              >
                <ScanText size={16} /> Scan Resume ATS
              </button>
            </div>
          </div>

          <div style={heroStatBoxStyle}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6B675F', fontWeight: '600', textTransform: 'uppercase' }}>Available Credits</span>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0A0A0A', marginTop: '4px' }}>
                {user?.credits ?? 100}
              </div>
              <Link to="/pricing" style={{ fontSize: '12px', color: '#FF5A1F', fontWeight: '700', textDecoration: 'none' }}>
                + Add Credits
              </Link>
            </div>
          </div>
        </section>

        {/* Real Metrics Grid — 4 Fluid Wide Columns */}
        <div style={metricsGridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Interviews Completed</span>
            <div style={statValueWrapStyle}>
              <span style={statNumberStyle}>{metrics.totalCompleted}</span>
              <span style={statSubStyle}>/ {metrics.totalSessions} sessions</span>
            </div>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Average Score</span>
            <div style={statValueWrapStyle}>
              <span style={statNumberStyle}>{metrics.avgScore > 0 ? metrics.avgScore : '—'}</span>
              <span style={statSubStyle}>/ 10</span>
            </div>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Highest Performance</span>
            <div style={statValueWrapStyle}>
              <span style={{ ...statNumberStyle, color: '#16A34A' }}>
                {metrics.bestScore > 0 ? metrics.bestScore : '—'}
              </span>
              <span style={statSubStyle}>/ 10</span>
            </div>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Active Resume</span>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0A0A0A', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeResume ? activeResume.fileName : 'No active resume'}
              </span>
              <Link to="/resume" style={{ fontSize: '12px', color: '#FF5A1F', textDecoration: 'none', fontWeight: '700', marginTop: '2px', display: 'inline-block' }}>
                {activeResume ? 'Manage Vault →' : 'Upload Resume →'}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Launch Round Shortcuts — 4 Responsive Cards */}
        <section style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={sectionHeadingStyle}>Quick Preparation Tracks</h2>
            <span style={{ fontSize: '13px', color: '#6B675F' }}>Instant access with zero barriers</span>
          </div>

          <div style={tracksGridStyle}>
            {/* Track 1: JD-Based Mock */}
            <div
              onClick={() => navigate('/interview/setup')}
              style={trackCardStyle}
            >
              <div style={trackIconStyle}>
                <FileText size={24} color="#0A0A0A" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={trackTitleStyle}>JD-Based Mock</h3>
                <span style={miniTagStyle}>No Resume</span>
              </div>
              <p style={trackDescStyle}>Paste any job posting or job requirements. AI generates role-tailored questions.</p>
              <span style={trackLinkStyle}>Configure Round →</span>
            </div>

            {/* Track 2: Technical Mock */}
            <div
              onClick={() => navigate('/interview/setup')}
              style={trackCardStyle}
            >
              <div style={trackIconStyle}>
                <Mic size={24} color="#0A0A0A" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={trackTitleStyle}>Technical Mock</h3>
                <span style={miniTagStyle}>Adaptive</span>
              </div>
              <p style={trackDescStyle}>System architecture, data structures, trade-offs, and conceptual depth.</p>
              <span style={trackLinkStyle}>Start Technical →</span>
            </div>

            {/* Track 3: Coding Arena */}
            <div
              onClick={() => navigate('/interview/coding')}
              style={trackCardStyle}
            >
              <div style={trackIconStyle}>
                <Code2 size={24} color="#0A0A0A" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={trackTitleStyle}>Coding Arena</h3>
                <span style={miniTagStyle}>Monaco</span>
              </div>
              <p style={trackDescStyle}>Interactive Monaco editor with test suites, time complexity review, and sandbox runs.</p>
              <span style={trackLinkStyle}>Enter Arena →</span>
            </div>

            {/* Track 4: HR & Behavioral */}
            <div
              onClick={() => navigate('/interview/setup')}
              style={trackCardStyle}
            >
              <div style={trackIconStyle}>
                <Award size={24} color="#0A0A0A" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={trackTitleStyle}>HR & Behavioral</h3>
                <span style={miniTagStyle}>STAR</span>
              </div>
              <p style={trackDescStyle}>Leadership principles, situational questions, conflict management, and culture fit.</p>
              <span style={trackLinkStyle}>Practice HR →</span>
            </div>
          </div>
        </section>

        {/* Recent Interviews Table — Full Width & Responsive */}
        <section style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={sectionHeadingStyle}>Recent Interview Sessions</h2>
            <Link to="/interview/history" style={{ fontSize: '13px', fontWeight: '700', color: '#6B675F', textDecoration: 'none' }}>
              View Complete History →
            </Link>
          </div>

          <div style={tableCardStyle}>
            {recentInterviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentInterviews.map((sess) => (
                  <div key={sess.id} style={interviewRowStyle}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#0A0A0A' }}>
                        {sess.roleTarget || sess.role || 'Software Engineer'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '12px', color: '#6B675F', flexWrap: 'wrap' }}>
                        <span>{(sess.type || sess.mode || 'technical').toUpperCase()}</span>
                        <span>•</span>
                        <span>{(sess.difficulty || 'medium').toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {sess.overallScore != null || sess.report?.overallScore != null ? (
                        <div style={scoreBadgeStyle}>
                          <b>{sess.overallScore ?? sess.report?.overallScore}</b> / 10
                        </div>
                      ) : (
                        <span style={pendingBadgeStyle}>{sess.status || 'Active'}</span>
                      )}

                      {sess.status === 'completed' || sess.report ? (
                        <Link to={`/report/${sess.id}`} style={rowActionBtnStyle}>
                          View Report →
                        </Link>
                      ) : (
                        <Link to={`/interview/${sess.id}`} style={rowActionBtnStyle}>
                          Resume Session →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '44px 20px', textAlign: 'center', color: '#6B675F' }}>
                <Clock size={36} color="#A39E93" style={{ marginBottom: '10px' }} />
                <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '500' }}>No mock interview sessions recorded yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/interview/setup')}
                  style={primaryBtnStyle}
                >
                  <Play size={14} /> Launch Your First Mock Interview
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Inline Styles adhering strictly to InterviewPilot Palette ────────────────
const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#F2EEE6',
  color: '#0A0A0A',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
};

const mainContentStyle = {
  flex: 1,
  minWidth: 0,
  padding: 'clamp(20px, 3vw, 40px)',
  maxWidth: '1600px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const heroCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '24px',
  padding: 'clamp(24px, 4vw, 36px)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '24px',
  flexWrap: 'wrap',
  marginBottom: '28px',
};

const heroPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255, 90, 31, 0.08)',
  border: '1px solid rgba(255, 90, 31, 0.2)',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: '700',
  color: '#FF5A1F',
  letterSpacing: '0.04em',
  marginBottom: '10px',
};

const heroTitleStyle = {
  fontSize: 'clamp(26px, 3vw, 36px)',
  fontWeight: '700',
  letterSpacing: '-0.02em',
  margin: '0 0 10px',
};

const heroDescStyle = {
  fontSize: '15px',
  color: '#6B675F',
  lineHeight: '1.5',
  margin: 0,
};

const heroStatBoxStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  borderRadius: '16px',
  padding: '20px 28px',
  minWidth: '180px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const primaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '999px',
  background: '#0A0A0A',
  color: '#F2EEE6',
  border: 'none',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'transform 0.15s ease',
};

const secondaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  borderRadius: '999px',
  background: '#FBFAF7',
  color: '#0A0A0A',
  border: '1px solid #E3DED2',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '16px',
};

const statCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '18px',
  padding: '22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
};

const statLabelStyle = {
  fontSize: '12px',
  color: '#6B675F',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const statValueWrapStyle = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
  marginTop: '8px',
};

const statNumberStyle = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: '34px',
  fontWeight: '700',
  lineHeight: 1,
};

const statSubStyle = {
  fontSize: '13px',
  color: '#6B675F',
};

const sectionHeadingStyle = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: '20px',
  fontWeight: '700',
  margin: 0,
  letterSpacing: '-0.01em',
};

const tracksGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '16px',
};

const trackCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '18px',
  padding: '22px',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, border-color 0.15s ease',
  display: 'flex',
  flexDirection: 'column',
};

const trackIconStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  background: 'rgba(244, 207, 99, 0.35)',
  display: 'grid',
  placeItems: 'center',
  marginBottom: '14px',
};

const trackTitleStyle = {
  fontSize: '16px',
  fontWeight: '700',
  margin: 0,
};

const miniTagStyle = {
  fontSize: '10px',
  fontWeight: '700',
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  padding: '2px 6px',
  borderRadius: '999px',
  color: '#6B675F',
};

const trackDescStyle = {
  fontSize: '13px',
  color: '#6B675F',
  lineHeight: '1.45',
  margin: '8px 0 16px',
  flex: 1,
};

const trackLinkStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#0A0A0A',
};

const tableCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '18px',
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
};

const interviewRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 24px',
  borderBottom: '1px solid #E3DED2',
  gap: '16px',
  flexWrap: 'wrap',
};

const scoreBadgeStyle = {
  background: '#F4CF63',
  color: '#0A0A0A',
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '600',
};

const pendingBadgeStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  color: '#6B675F',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  textTransform: 'uppercase',
  fontWeight: '600',
};

const rowActionBtnStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#0A0A0A',
  textDecoration: 'none',
};
