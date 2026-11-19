// client/src/components/dashboard/RecentActivityFeed.jsx
// Authentic Activity Timeline Feed based on Firestore Interviews & Profile Records

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Code2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function RecentActivityFeed({ interviews = [], activeResume, user }) {
  // Aggregate real events from application states
  const activities = useMemo(() => {
    const list = [];

    // 1. Interview events
    interviews.slice(0, 5).forEach((item) => {
      const isCompleted = item.interviewStatus === 'completed' || item.status === 'completed';
      const role = item.jobRole || item.roleTarget || 'Mock Session';
      const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now());

      if (isCompleted) {
        list.push({
          id: `eval-${item.id}`,
          type: 'evaluation',
          title: `Interview Evaluation Generated`,
          desc: `${role} • Score: ${item.overallScore ?? item.report?.overallScore ?? 'N/A'}/10`,
          timestamp: date,
          link: `/report/${item.id}`,
          icon: CheckCircle2,
          iconColor: '#10B981',
          iconBg: '#ECFDF5',
        });
      } else {
        list.push({
          id: `start-${item.id}`,
          type: 'interview_start',
          title: `Active Interview Session`,
          desc: `${role} (${item.roundFormat || 'Technical Round'})`,
          timestamp: date,
          link: `/interview/${item.id}`,
          icon: Clock,
          iconColor: '#F59E0B',
          iconBg: '#FFFBEB',
        });
      }
    });

    // 2. Active resume event
    if (activeResume && activeResume.fileName) {
      list.push({
        id: 'resume-active',
        type: 'resume',
        title: 'Resume Stored in Vault',
        desc: activeResume.fileName,
        timestamp: new Date(activeResume.updatedAt || activeResume.createdAt || Date.now()),
        link: '/resume',
        icon: FileText,
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
      });
    }

    // 3. User profile completion event
    if (user && (user.name || user.email)) {
      list.push({
        id: 'user-profile',
        type: 'profile',
        title: 'Candidate Profile Calibrated',
        desc: `${user.name || 'Candidate'} (${user.email || ''})`,
        timestamp: new Date(user.updatedAt || user.createdAt || Date.now()),
        link: '/profile',
        icon: UserCheck,
        iconColor: '#8B5CF6',
        iconBg: '#F5F3FF',
      });
    }

    // Sort by most recent
    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }, [interviews, activeResume, user]);

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={styles.iconCircle}>
            <Activity size={16} color="#0284C7" />
          </div>
          <div>
            <h3 style={styles.title}>Recent Activity</h3>
            <p style={styles.subtitle}>Audit trail of candidate events</p>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      {activities.length > 0 ? (
        <div style={styles.feedList}>
          {activities.map((act) => {
            const Icon = act.icon;
            const timeStr = act.timestamp.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <Link key={act.id} to={act.link} style={styles.feedItem}>
                <div style={{ ...styles.itemIcon, background: act.iconBg, color: act.iconColor }}>
                  <Icon size={14} />
                </div>
                <div style={styles.itemContent}>
                  <div style={styles.itemTitle}>{act.title}</div>
                  <div style={styles.itemDesc}>{act.desc}</div>
                </div>
                <div style={styles.itemTime}>{timeStr}</div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyContainer}>
          <Sparkles size={24} color="#94A3B8" />
          <p style={styles.emptyText}>No recent activity logged</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '22px 24px',
    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  titleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: '#F0F9FF',
    border: '1px solid #E0F2FE',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  subtitle: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '2px 0 0',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 10px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background 0.15s ease',
    background: '#F8FAFC',
    border: '1px solid transparent',
  },
  itemIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemDesc: {
    fontSize: '11px',
    color: '#64748B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemTime: {
    fontSize: '11px',
    color: '#94A3B8',
    whiteSpace: 'nowrap',
  },
  emptyContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center',
    gap: '8px',
  },
  emptyText: {
    fontSize: '12.5px',
    color: '#94A3B8',
    margin: 0,
  },
};

