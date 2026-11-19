// client/src/components/dashboard/DashboardEmptyState.jsx
// Premium Onboarding Banner for New Candidates with Zero Prior Sessions

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, Code2, ArrowRight } from 'lucide-react';

export default function DashboardEmptyState({ onStartInterview }) {
  return (
    <section style={styles.banner}>
      <div style={styles.leftCol}>
        <div style={styles.badge}>
          <Sparkles size={13} color="#FF5A1F" />
          <span>Quick Launch Onboarding</span>
        </div>
        <h2 style={styles.heading}>Calibrate Your Mock Interview Readiness</h2>
        <p style={styles.subheading}>
          MockMate AI evaluates your answers across 5 core competencies using Google Gemini.
          Launch your first simulation or tailor questions using your resume.
        </p>

        <div style={styles.actionRow}>
          <Link to="/interview/setup" style={styles.primaryBtn}>
            <span>Start First Mock Interview</span>
            <ArrowRight size={15} />
          </Link>
          <Link to="/resume" style={styles.secondaryBtn}>
            <FileText size={15} />
            <span>Upload Resume</span>
          </Link>
          <Link to="/coding" style={styles.secondaryBtn}>
            <Code2 size={15} />
            <span>Coding Arena</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

const styles = {
  banner: {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    borderRadius: '14px',
    padding: '28px 32px',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.2)',
    boxSizing: 'border-box',
    border: '1px solid #334155',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '720px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#FFEDD5',
    background: 'rgba(255, 90, 31, 0.2)',
    border: '1px solid rgba(255, 90, 31, 0.4)',
    padding: '3px 10px',
    borderRadius: '6px',
    width: 'fit-content',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '-0.3px',
    lineHeight: '1.3',
  },
  subheading: {
    fontSize: '13.5px',
    color: '#94A3B8',
    margin: 0,
    lineHeight: '1.5',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '6px',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    borderRadius: '8px',
    background: '#FF5A1F',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(255, 90, 31, 0.35)',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#F8FAFC',
    fontSize: '13px',
    fontWeight: '500',
    textDecoration: 'none',
  },
};

