// client/src/components/dashboard/DashboardHeader.jsx
// Enterprise Executive Dashboard Header for MockMate AI

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Play,
  ArrowRight,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function DashboardHeader({
  user,
  analytics,
  onNavigateSession,
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.profileImage]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Candidate';
  const initial = (displayName && displayName.trim().length > 0 ? displayName.trim().charAt(0) : 'C').toUpperCase();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const hasSessions = analytics?.total > 0;
  const inProgress = analytics?.inProgressSession;

  const hasValidImg = Boolean(
    user?.profileImage &&
    typeof user.profileImage === 'string' &&
    user.profileImage.trim().length > 0 &&
    !imgError
  );

  return (
    <header style={styles.header}>
      {/* Left: Candidate Profile & Motivational Context */}
      <div style={styles.leftCol}>
        <div style={styles.avatarWrap}>
          {/* Base Fallback: Always renders crisp initial letter */}
          <div style={styles.avatarFallback}>{initial}</div>

          {/* Optional Profile Image Overlay: Immediately hidden if invalid or broken */}
          {hasValidImg && (
            <img
              src={user.profileImage}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setImgError(true);
              }}
              style={styles.avatarImg}
            />
          )}

          <span style={styles.onlinePing} title="Active Session" />
        </div>

        <div style={styles.textWrap}>
          <div style={styles.metaRow}>
            <span style={styles.dateLabel}>
              <Calendar size={13} style={{ marginRight: '5px', verticalAlign: '-1px' }} />
              {formattedDate}
            </span>
            <span style={styles.metaDivider}>•</span>
            <span style={styles.statusBadge}>
              {analytics?.completed > 0 ? (
                <>
                  <CheckCircle2 size={12} color="#10B981" style={{ marginRight: '4px' }} />
                  {analytics.completed} {analytics.completed === 1 ? 'Interview' : 'Interviews'} Completed
                </>
              ) : inProgress ? (
                <>
                  <Clock size={12} color="#F59E0B" style={{ marginRight: '4px' }} />
                  Session In-Progress
                </>
              ) : (
                'New Candidate Onboarding'
              )}
            </span>
          </div>

          <h1 style={styles.title}>
            Welcome back, {displayName}
          </h1>

          <p style={styles.subtitle}>
            {!hasSessions ? (
              'Ready to master your technical & behavioral interviews? Launch your first mock session to calibrate your readiness.'
            ) : analytics?.avgScore > 0 ? (
              `You have practiced for ${analytics.totalMinutes} minutes across ${analytics.total} sessions with an average score of ${analytics.avgScore}/10.`
            ) : (
              'Continue your interview preparation and track your readiness across target companies and roles.'
            )}
          </p>
        </div>
      </div>

      {/* Right: Primary and Secondary Action CTAs */}
      <div style={styles.rightCol}>
        {inProgress && (
          <button
            type="button"
            onClick={() => onNavigateSession(inProgress.id)}
            style={styles.resumeBtn}
            title="Resume your active interview session"
          >
            <Play size={15} fill="currentColor" />
            <span>Resume Active</span>
          </button>
        )}

        <Link to="/history" style={styles.secondaryBtn} title="View all interview reports and evaluations">
          <FileSpreadsheet size={15} />
          <span>View Reports</span>
        </Link>

        <Link to="/interview/setup" style={styles.primaryCtaBtn} title="Configure and launch a new mock interview">
          <Sparkles size={16} />
          <span>Start Mock Interview</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '24px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
    boxSizing: 'border-box',
  },
  leftCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    minWidth: '280px',
    flex: '1 1 auto',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarFallback: {
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '22px',
    display: 'grid',
    placeItems: 'center',
    letterSpacing: '-0.5px',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.12)',
  },
  avatarImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '1px solid #E2E8F0',
  },
  onlinePing: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#10B981',
    border: '2px solid #FFFFFF',
    boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.2)',
  },
  textWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  dateLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
  },
  metaDivider: {
    color: '#CBD5E1',
    fontSize: '12px',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#0F172A',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '2px 8px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.4px',
    lineHeight: '1.25',
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.45',
    maxWidth: '680px',
  },
  rightCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  resumeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 14px',
    borderRadius: '8px',
    border: '1px solid #FDE68A',
    background: '#FEF3C7',
    color: '#92400E',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 14px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#0F172A',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  primaryCtaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid #FF5A1F',
    background: '#FF5A1F',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(255, 90, 31, 0.25)',
    transition: 'all 0.15s ease',
  },
};

