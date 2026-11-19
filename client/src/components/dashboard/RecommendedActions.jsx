// client/src/components/dashboard/RecommendedActions.jsx
// Dynamic Actionable Recommendations tailored to candidate's actual interview state

import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Sparkles } from 'lucide-react';

export default function RecommendedActions({ recommendations = [] }) {
  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={styles.iconCircle}>
            <Compass size={16} color="#FF5A1F" />
          </div>
          <div>
            <h3 style={styles.title}>Recommended Next Steps</h3>
            <p style={styles.subtitle}>Prioritized actions based on your diagnostics</p>
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div style={styles.recGrid}>
        {recommendations.map((rec, idx) => (
          <div key={idx} style={styles.recItem}>
            <div style={styles.recTopRow}>
              <span
                style={{
                  ...styles.tag,
                  background: `${rec.tagColor}15`,
                  color: rec.tagColor,
                  border: `1px solid ${rec.tagColor}30`,
                }}
              >
                {rec.tag}
              </span>
            </div>

            <h4 style={styles.recTitle}>{rec.title}</h4>
            <p style={styles.recDesc}>{rec.desc}</p>

            <Link to={rec.href} style={styles.recLink}>
              <span>{rec.action}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
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
    width: '100%',
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
    background: '#FFF7ED',
    border: '1px solid #FFEDD5',
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
  recGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
  },
  recItem: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
    transition: 'border-color 0.15s ease',
  },
  recTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tag: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 7px',
    borderRadius: '4px',
    letterSpacing: '-0.1px',
  },
  recTitle: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0F172A',
    margin: 0,
    lineHeight: '1.35',
  },
  recDesc: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.45',
    flex: 1,
  },
  recLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#FF5A1F',
    textDecoration: 'none',
    marginTop: '4px',
  },
};

