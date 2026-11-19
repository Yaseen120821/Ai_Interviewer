// client/src/components/dashboard/RecentInterviewsTable.jsx
// Enterprise Recent Interviews Data Table with Status Badges & Deep Navigation

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ChevronRight,
  ExternalLink,
  Briefcase,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function RecentInterviewsTable({ interviews = [] }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'completed' | 'active'

  const filtered = interviews.filter((item) => {
    const isCompleted = item.interviewStatus === 'completed' || item.status === 'completed';
    if (filterMode === 'completed') return isCompleted;
    if (filterMode === 'active') return !isCompleted;
    return true;
  });

  return (
    <div style={styles.card}>
      {/* Top Header Row */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={styles.iconCircle}>
            <Briefcase size={16} color="#0F172A" />
          </div>
          <div>
            <h3 style={styles.title}>Recent Interviews</h3>
            <p style={styles.subtitle}>Historical mock sessions, evaluation transcripts, and reports</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          {/* Quick Filter */}
          {interviews.length > 0 && (
            <div style={styles.filterGroup}>
              {['all', 'completed', 'active'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  style={{
                    ...styles.filterBtn,
                    ...(filterMode === mode ? styles.filterBtnActive : {}),
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}

          <Link to="/interview/history" style={styles.viewAllLink} title="View full interview history">
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Table Container */}
      {filtered.length > 0 ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Role &amp; Company</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 6).map((item) => {
                const isCompleted = item.interviewStatus === 'completed' || item.status === 'completed';
                const score = item.overallScore ?? item.report?.overallScore;
                const company = item.company || item.companyName || 'General Mock';
                const role = item.jobRole || item.roleTarget || 'Software Engineer';

                const formattedDate = item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                const modeLabel = item.resumeId || item.mode === 'resume'
                  ? 'Resume-Based'
                  : item.jobDescription || item.mode === 'jd'
                  ? 'JD-Based'
                  : 'Role Simulation';

                return (
                  <tr key={item.id} style={styles.tr}>
                    {/* Role & Company */}
                    <td style={styles.td}>
                      <div style={styles.roleTitle}>{role}</div>
                      <div style={styles.companySub}>{company}</div>
                    </td>

                    {/* Mode / Type Pill */}
                    <td style={styles.td}>
                      <span style={styles.typePill}>{modeLabel}</span>
                    </td>

                    {/* Date */}
                    <td style={styles.td}>
                      <span style={styles.dateText}>{formattedDate}</span>
                    </td>

                    {/* Score */}
                    <td style={styles.td}>
                      {typeof score === 'number' && !isNaN(score) ? (
                        <div style={styles.scoreWrap}>
                          <span style={styles.scoreVal}>{score}</span>
                          <span style={styles.scoreScale}>/ 10</span>
                        </div>
                      ) : isCompleted ? (
                        <span style={styles.evalPending}>Report Ready</span>
                      ) : (
                        <span style={styles.inProgressText}>In-Progress</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={styles.td}>
                      {isCompleted ? (
                        <span style={styles.statusCompleted}>
                          <CheckCircle2 size={12} />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span style={styles.statusActive}>
                          <Clock size={12} />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <Link
                        to={isCompleted ? `/report/${item.id}` : `/interview/${item.id}`}
                        style={isCompleted ? styles.reportBtn : styles.resumeBtn}
                      >
                        {isCompleted ? (
                          <>
                            <span>Report</span>
                            <ExternalLink size={12} />
                          </>
                        ) : (
                          <>
                            <Play size={12} fill="currentColor" />
                            <span>Resume</span>
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div style={styles.emptyContainer}>
          <p style={styles.emptyTitle}>No interview sessions found</p>
          <p style={styles.emptyDesc}>
            {filterMode !== 'all'
              ? `No ${filterMode} interviews match your filter selection.`
              : 'Your scheduled, completed, and in-progress mock interviews will automatically appear here.'}
          </p>
          <Link to="/interview/setup" style={styles.emptyCta}>
            <Sparkles size={14} />
            <span>Start First Mock Interview</span>
          </Link>
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
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
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
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  filterGroup: {
    display: 'inline-flex',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '2px',
    gap: '2px',
  },
  filterBtn: {
    border: 'none',
    background: 'transparent',
    color: '#64748B',
    fontSize: '11.5px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterBtnActive: {
    background: '#FFFFFF',
    color: '#0F172A',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  },
  viewAllLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#FF5A1F',
    textDecoration: 'none',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid #F1F5F9',
  },
  th: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    padding: '10px 12px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F8FAFC',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '12px',
    verticalAlign: 'middle',
  },
  roleTitle: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: '1.3',
  },
  companySub: {
    fontSize: '12px',
    color: '#64748B',
  },
  typePill: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#475569',
    background: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  dateText: {
    fontSize: '12.5px',
    color: '#64748B',
    whiteSpace: 'nowrap',
  },
  scoreWrap: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '3px',
  },
  scoreVal: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
  },
  scoreScale: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  evalPending: {
    fontSize: '11.5px',
    color: '#059669',
    fontWeight: '500',
  },
  inProgressText: {
    fontSize: '11.5px',
    color: '#D97706',
    fontWeight: '500',
  },
  statusCompleted: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#059669',
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  statusActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#D97706',
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  reportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '5px 10px',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  resumeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#92400E',
    background: '#FEF3C7',
    border: '1px solid #FDE68A',
    padding: '5px 10px',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '36px 20px',
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
    margin: '0 0 4px',
  },
  emptyDesc: {
    fontSize: '12.5px',
    color: '#64748B',
    maxWidth: '380px',
    lineHeight: '1.45',
    margin: '0 0 16px',
  },
  emptyCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    background: '#0F172A',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

