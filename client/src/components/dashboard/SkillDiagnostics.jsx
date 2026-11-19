// client/src/components/dashboard/SkillDiagnostics.jsx
// Enterprise 5-Dimension Skill Diagnostic Card based on Authentic Evaluation Rubrics

import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Award, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SkillDiagnostics({ skillAverages, hasEvaluationData }) {
  const skills = [
    {
      id: 'technical',
      label: 'Technical Knowledge',
      score: skillAverages?.technical ?? 0,
      color: '#FF5A1F',
      desc: 'Correctness, algorithmic accuracy, edge cases',
    },
    {
      id: 'communication',
      label: 'Communication',
      score: skillAverages?.communication ?? 0,
      color: '#2563EB',
      desc: 'Clarity, conciseness, structured articulation',
    },
    {
      id: 'problemSolving',
      label: 'Problem Solving',
      score: skillAverages?.problemSolving ?? 0,
      color: '#8B5CF6',
      desc: 'Analytical breakdown, trade-off analysis',
    },
    {
      id: 'confidence',
      label: 'Confidence & Delivery',
      score: skillAverages?.confidence ?? 0,
      color: '#10B981',
      desc: 'Fluency, pacing, professional composure',
    },
    {
      id: 'understanding',
      label: 'Answer Quality',
      score: skillAverages?.understanding ?? 0,
      color: '#F59E0B',
      desc: 'Directness, conceptual depth, relevance',
    },
  ];

  const getTier = (score) => {
    if (score >= 8.5) return { label: 'Advanced', color: '#059669', bg: '#ECFDF5' };
    if (score >= 7.0) return { label: 'Proficient', color: '#2563EB', bg: '#EFF6FF' };
    if (score >= 5.0) return { label: 'Developing', color: '#D97706', bg: '#FFFBEB' };
    if (score > 0) return { label: 'Needs Focus', color: '#DC2626', bg: '#FEF2F2' };
    return { label: 'Pending', color: '#64748B', bg: '#F8FAFC' };
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <div style={styles.iconCircle}>
            <Target size={16} color="#2563EB" />
          </div>
          <div>
            <h3 style={styles.title}>Skill Diagnostics</h3>
            <p style={styles.subtitle}>5-dimension competence matrix</p>
          </div>
        </div>

        {hasEvaluationData && (
          <span style={styles.calibratedBadge}>
            <CheckCircle2 size={12} color="#10B981" />
            <span>AI Calibrated</span>
          </span>
        )}
      </div>

      {/* Main Content */}
      {hasEvaluationData ? (
        <div style={styles.skillList}>
          {skills.map((skill) => {
            const pct = Math.min(100, Math.max(0, Math.round((skill.score / 10) * 100)));
            const tier = getTier(skill.score);

            return (
              <div key={skill.id} style={styles.skillItem}>
                <div style={styles.itemTop}>
                  <div style={styles.labelCol}>
                    <span style={styles.skillName}>{skill.label}</span>
                    <span style={styles.skillDesc}>{skill.desc}</span>
                  </div>

                  <div style={styles.scoreCol}>
                    <span
                      style={{
                        ...styles.tierPill,
                        background: tier.bg,
                        color: tier.color,
                      }}
                    >
                      {tier.label}
                    </span>
                    <span style={styles.scoreText}>
                      <strong>{skill.score > 0 ? skill.score : '—'}</strong>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}> / 10</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar track */}
                <div style={styles.track}>
                  <div
                    style={{
                      ...styles.fill,
                      width: `${pct}%`,
                      background: skill.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIconBox}>
            <Award size={28} color="#94A3B8" />
          </div>
          <h4 style={styles.emptyTitle}>Skill Matrix Uncalibrated</h4>
          <p style={styles.emptyDesc}>
            Complete an AI mock interview session to evaluate your technical, communication, and problem-solving dimensions.
          </p>
          <Link to="/interview/setup" style={styles.emptyCta}>
            <Sparkles size={14} />
            <span>Start Practice Round</span>
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
    gap: '12px',
    marginBottom: '20px',
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
    background: '#EFF6FF',
    border: '1px solid #DBEAFE',
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
  calibratedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#059669',
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  skillList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
    justifyContent: 'space-around',
  },
  skillItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  itemTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  labelCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  skillName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
  },
  skillDesc: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  scoreCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tierPill: {
    fontSize: '10.5px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  scoreText: {
    fontSize: '13px',
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
  },
  track: {
    width: '100%',
    height: '6px',
    borderRadius: '999px',
    background: '#F1F5F9',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
    maxWidth: '340px',
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

