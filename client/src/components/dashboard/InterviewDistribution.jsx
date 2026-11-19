// client/src/components/dashboard/InterviewDistribution.jsx
// Enterprise Interview Format & Type Distribution Card with SVG Ring / Donut

import React, { useMemo } from 'react';
import { PieChart, Layers } from 'lucide-react';

export default function InterviewDistribution({ typeCounts = {}, total = 0 }) {
  const categories = useMemo(() => {
    const resume = typeCounts.resume || 0;
    const jd = typeCounts.jd || 0;
    const role = typeCounts.role || 0;
    const totalCount = resume + jd + role;

    if (totalCount === 0) return [];

    return [
      {
        id: 'resume',
        label: 'Resume-Based',
        count: resume,
        color: '#FF5A1F',
        pct: Math.round((resume / totalCount) * 100),
      },
      {
        id: 'jd',
        label: 'Job Description',
        count: jd,
        color: '#2563EB',
        pct: Math.round((jd / totalCount) * 100),
      },
      {
        id: 'role',
        label: 'General Role',
        count: role,
        color: '#10B981',
        pct: Math.round((role / totalCount) * 100),
      },
    ].filter((c) => c.count > 0);
  }, [typeCounts]);

  // Donut geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const segments = categories.map((cat) => {
    const strokeDash = (cat.pct / 100) * circumference;
    const offset = currentOffset;
    currentOffset += strokeDash;
    return {
      ...cat,
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -offset,
    };
  });

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={styles.iconCircle}>
            <PieChart size={16} color="#8B5CF6" />
          </div>
          <div>
            <h3 style={styles.title}>Interview Type Distribution</h3>
            <p style={styles.subtitle}>Format allocation across sessions</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {categories.length > 0 ? (
        <div style={styles.body}>
          {/* Donut SVG */}
          <div style={styles.donutWrap}>
            <svg viewBox="0 0 110 110" style={styles.donutSvg}>
              <circle
                cx="55"
                cy="55"
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="14"
              />
              {segments.map((seg) => (
                <circle
                  key={seg.id}
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '55px 55px', transition: 'stroke-dasharray 0.3s ease' }}
                />
              ))}
            </svg>
            <div style={styles.donutCenter}>
              <span style={styles.donutCenterVal}>{total}</span>
              <span style={styles.donutCenterLabel}>Total</span>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div style={styles.legendList}>
            {categories.map((cat) => (
              <div key={cat.id} style={styles.legendItem}>
                <div style={styles.legendLeft}>
                  <span style={{ ...styles.colorDot, background: cat.color }} />
                  <span style={styles.legendLabel}>{cat.label}</span>
                </div>
                <div style={styles.legendRight}>
                  <span style={styles.legendCount}>{cat.count}</span>
                  <span style={styles.legendPct}>({cat.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.emptyContainer}>
          <Layers size={24} color="#94A3B8" />
          <p style={styles.emptyText}>No interview distribution recorded yet</p>
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
    background: '#F5F3FF',
    border: '1px solid #EDE9FE',
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
  body: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    marginTop: '6px',
    flex: 1,
  },
  donutWrap: {
    position: 'relative',
    width: '110px',
    height: '110px',
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
  },
  donutSvg: {
    width: '100%',
    height: '100%',
  },
  donutCenter: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterVal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: '1',
  },
  donutCenterLabel: {
    fontSize: '10px',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    minWidth: '150px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12.5px',
  },
  legendLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendLabel: {
    color: '#0F172A',
    fontWeight: '500',
  },
  legendRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  legendCount: {
    fontWeight: '600',
    color: '#0F172A',
  },
  legendPct: {
    color: '#94A3B8',
    fontSize: '11px',
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

