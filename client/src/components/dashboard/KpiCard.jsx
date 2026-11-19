// client/src/components/dashboard/KpiCard.jsx
// Premium enterprise-grade KPI metric card

import React from 'react';

export default function KpiCard({
  title,
  value,
  unit,
  description,
  icon: Icon,
  iconColor = '#0F172A',
  iconBg = '#F1F5F9',
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <span style={styles.title}>{title}</span>
        <div style={{ ...styles.iconBox, background: iconBg, color: iconColor }}>
          {Icon && <Icon size={16} />}
        </div>
      </div>

      <div style={styles.valueRow}>
        <span style={styles.value}>{value}</span>
        {unit && <span style={styles.unit}>{unit}</span>}

        {trend && (
          <span
            style={{
              ...styles.trendBadge,
              ...(trendType === 'positive' ? styles.trendPos : {}),
              ...(trendType === 'negative' ? styles.trendNeg : {}),
              ...(trendType === 'neutral' ? styles.trendNeutral : {}),
            }}
          >
            {trend}
          </span>
        )}
      </div>

      <p style={styles.desc}>{description}</p>
    </div>
  );
}

const styles = {
  card: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '136px',
    boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.03)',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: '-0.1px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    flexWrap: 'wrap',
    margin: '2px 0 6px',
  },
  value: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: '-0.6px',
    lineHeight: '1.1',
    fontVariantNumeric: 'tabular-nums',
  },
  unit: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748B',
  },
  trendBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: 'auto',
    letterSpacing: '-0.1px',
  },
  trendPos: {
    background: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
  },
  trendNeg: {
    background: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
  },
  trendNeutral: {
    background: '#F8FAFC',
    color: '#64748B',
    border: '1px solid #E2E8F0',
  },
  desc: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

