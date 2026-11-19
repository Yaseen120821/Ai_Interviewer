// client/src/components/dashboard/InterviewScoreTrend.jsx
// Enterprise Interview Performance Trend Chart with SVG Area Fill, Tooltips & Date Filters

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Sparkles, Calendar } from 'lucide-react';

export default function InterviewScoreTrend({
  trendData = [],
  trendRange = 'all',
  onRangeChange = () => {},
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG dimensions
  const svgWidth = 620;
  const svgHeight = 220;
  const padLeft = 46;
  const padRight = 30;
  const padTop = 24;
  const padBottom = 34;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Compute coordinate geometry for points
  const points = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];

    return trendData.map((d, idx) => {
      const x =
        trendData.length === 1
          ? padLeft + chartWidth / 2
          : padLeft + (idx / (trendData.length - 1)) * chartWidth;

      const clampedScore = Math.max(0, Math.min(10, d.score ?? 0));
      const y = padTop + chartHeight - (clampedScore / 10) * chartHeight;

      return {
        x,
        y,
        ...d,
        formattedDate: d.date instanceof Date
          ? d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : new Date(d.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }, [trendData, chartWidth, chartHeight]);

  // Construct SVG path for line and area gradient
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    const line = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, '');

    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = padTop + chartHeight;
    const area = `${line} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;

    return { linePath: line, areaPath: area };
  }, [points, chartHeight]);

  const ranges = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div style={styles.card}>
      {/* Header with Title and Range Filters */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={styles.iconCircle}>
            <TrendingUp size={16} color="#FF5A1F" />
          </div>
          <div>
            <h3 style={styles.title}>Interview Performance Trend</h3>
            <p style={styles.subtitle}>Historical score progression across completed evaluations</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={styles.filterGroup}>
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onRangeChange(r.id)}
              style={{
                ...styles.filterBtn,
                ...(trendRange === r.id ? styles.filterBtnActive : {}),
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Canvas or Empty State */}
      {points.length > 0 ? (
        <div style={styles.chartBody}>
          <div style={styles.svgContainer}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={styles.svg}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.22" />
                  <stop offset="85%" stopColor="#FF5A1F" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines & Y-axis labels */}
              {[0, 2.5, 5.0, 7.5, 10.0].map((score) => {
                const y = padTop + chartHeight - (score / 10) * chartHeight;
                return (
                  <g key={score}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="11"
                      fill="#94A3B8"
                      fontFamily="inherit"
                      fontWeight="500"
                    >
                      {score === 0 ? '0' : score.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Fill */}
              {points.length > 1 && (
                <path d={areaPath} fill="url(#scoreAreaGradient)" />
              )}

              {/* Main Trend Line */}
              {points.length > 1 && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#FF5A1F"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {points.map((p, idx) => {
                const isHovered = hoveredPoint?.id === p.id;
                return (
                  <g
                    key={p.id || idx}
                    onMouseEnter={() => setHoveredPoint(p)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Invisible larger hit target */}
                    <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                    {/* Outer glow ring on hover */}
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="9"
                        fill="rgba(255, 90, 31, 0.2)"
                      />
                    )}

                    {/* Outer circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? "5.5" : "4.5"}
                      fill="#FFFFFF"
                      stroke="#FF5A1F"
                      strokeWidth="2.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip Card */}
            {hoveredPoint && (
              <div
                style={{
                  ...styles.tooltip,
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                }}
              >
                <div style={styles.tooltipScore}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                    {hoveredPoint.score}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}> / 10</span>
                </div>
                <div style={styles.tooltipRole}>{hoveredPoint.role || 'Interview Session'}</div>
                <div style={styles.tooltipDate}>{hoveredPoint.formattedDate}</div>
              </div>
            )}
          </div>

          {/* Footer Axis Range Labels */}
          <div style={styles.axisFooter}>
            <span style={styles.axisLabel}>
              <Calendar size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
              {points[0]?.formattedDate || 'First Session'}
            </span>
            <span style={styles.axisLabel}>
              {points.length > 1
                ? points[points.length - 1]?.formattedDate
                : 'Latest Evaluation'}
            </span>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIconBox}>
            <BarChart3 size={28} color="#94A3B8" />
          </div>
          <h4 style={styles.emptyTitle}>No Performance Evaluations Yet</h4>
          <p style={styles.emptyDesc}>
            Complete your first mock interview to generate your historical readiness curve and score telemetry.
          </p>
          <Link to="/interview/setup" style={styles.emptyCta}>
            <Sparkles size={14} />
            <span>Launch Mock Interview</span>
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
    height: '100%',
    minHeight: '340px',
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
    fontSize: '12px',
    fontWeight: '500',
    padding: '5px 10px',
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
  chartBody: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
    minHeight: '230px',
  },
  svgContainer: {
    position: 'relative',
    width: '100%',
    flex: 1,
  },
  svg: {
    width: '100%',
    height: 'auto',
    maxHeight: '220px',
    overflow: 'visible',
    display: 'block',
  },
  tooltip: {
    position: 'absolute',
    transform: 'translate(-50%, -120%)',
    background: '#0F172A',
    color: '#FFFFFF',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.25)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 20,
    transition: 'left 0.1s ease, top 0.1s ease',
  },
  tooltipScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },
  tooltipRole: {
    fontSize: '11px',
    color: '#CBD5E1',
    marginTop: '2px',
  },
  tooltipDate: {
    fontSize: '10.5px',
    color: '#94A3B8',
  },
  axisFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '10px',
    borderTop: '1px solid #F1F5F9',
    marginTop: '6px',
  },
  axisLabel: {
    fontSize: '11.5px',
    color: '#94A3B8',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '36px 20px',
  },
  emptyIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '14px',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0F172A',
    margin: '0 0 6px',
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#64748B',
    maxWidth: '380px',
    lineHeight: '1.5',
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
    fontSize: '12.5px',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

