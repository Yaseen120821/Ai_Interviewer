// src/pages/SettingsPage.jsx
// MockMate AI Settings & Preferences Workspace
// Features: Avatar preferences, speech rate calibration, audio controls, account diagnostics.

import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import useAuthStore from '../store/authStore';
import {
  Settings,
  Volume2,
  Video,
  Shield,
  Trash2,
  CheckCircle2,
  LogOut,
  Sparkles,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [avatarType, setAvatarType] = useState(() => {
    try {
      return localStorage.getItem('mockmate_avatar_type') || 'female_video';
    } catch {
      return 'female_video';
    }
  });

  const [speechRate, setSpeechRate] = useState('1.0');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSavePreferences = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('mockmate_avatar_type', avatarType);
      localStorage.setItem('mockmate_speech_rate', speechRate);
      setSuccessMsg('Preferences saved successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      /* ignore */
    }
  };

  const handleClearLocalCache = () => {
    try {
      localStorage.removeItem('current_interview_session');
      sessionStorage.clear();
      setSuccessMsg('Local session cache cleared.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.main}>
        {/* Header */}
        <div style={styles.headerCard}>
          <div style={styles.iconCircle}>
            <Settings size={26} color="#0A0A0A" />
          </div>
          <div>
            <h1 style={styles.title}>Preferences &amp; Settings</h1>
            <p style={styles.subtitle}>
              Configure your interview simulation experience, speech rates, and account security.
            </p>
          </div>
        </div>

        {successMsg && (
          <div style={styles.successBanner}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} style={styles.sectionsList}>
          {/* Section 1: AI Avatar Simulation */}
          <section style={styles.card}>
            <div style={styles.sectionHeading}>
              <Video size={18} color="#FF5A1F" />
              <h3>AI Interviewer Avatar</h3>
            </div>

            <div style={styles.avatarOptions}>
              {[
                { id: 'female_video', label: 'Female AI Avatar (Video)', desc: 'High-definition video simulation' },
                { id: 'male_video', label: 'Male AI Avatar (Video)', desc: 'Professional male interviewer video' },
                { id: 'robot', label: 'Animated Robot (SVG)', desc: 'Lightweight reactive SVG character' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    ...styles.avatarCard,
                    ...(avatarType === opt.id ? styles.avatarCardActive : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="avatarType"
                    value={opt.id}
                    checked={avatarType === opt.id}
                    onChange={(e) => setAvatarType(e.target.value)}
                    style={{ marginRight: '10px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: '#6B675F' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Section 2: Speech & Audio Settings */}
          <section style={styles.card}>
            <div style={styles.sectionHeading}>
              <Volume2 size={18} color="#FF5A1F" />
              <h3>Question Narration &amp; Speech Rate</h3>
            </div>

            <div style={{ maxWidth: '400px' }}>
              <label style={styles.label}>Speech Narration Speed</label>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(e.target.value)}
                style={styles.select}
              >
                <option value="0.8">0.8x (Slower — Clear Technical Delivery)</option>
                <option value="1.0">1.0x (Normal — Standard Conversation Pace)</option>
                <option value="1.2">1.2x (Fast — Accelerated Practice)</option>
              </select>
              <span style={{ fontSize: '12px', color: '#6B675F', marginTop: '6px', display: 'block' }}>
                Questions will be read completely at this speed before the answer timer begins.
              </span>
            </div>
          </section>

          {/* Section 3: Account Diagnostics */}
          <section style={styles.card}>
            <div style={styles.sectionHeading}>
              <Shield size={18} color="#FF5A1F" />
              <h3>Account Security &amp; Diagnostics</h3>
            </div>

            <div style={styles.diagGrid}>
              <div style={styles.diagItem}>
                <span style={styles.diagLabel}>Account ID / UID</span>
                <span style={styles.diagVal}>{user?.id || user?.uid || 'Candidate'}</span>
              </div>
              <div style={styles.diagItem}>
                <span style={styles.diagLabel}>Authentication Provider</span>
                <span style={styles.diagVal}>Firebase Auth (Spark Free Plan)</span>
              </div>
              <div style={styles.diagItem}>
                <span style={styles.diagLabel}>Account Status</span>
                <span style={styles.diagVal}>Active • Verified</span>
              </div>
            </div>
          </section>

          {/* Save & Danger Zone */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <button
              type="button"
              onClick={handleClearLocalCache}
              style={styles.clearCacheBtn}
            >
              <Trash2 size={14} />
              <span>Clear Session Cache</span>
            </button>

            <button
              type="submit"
              style={styles.saveBtn}
            >
              <Save size={16} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F2EEE6',
    color: '#0A0A0A',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 'clamp(20px, 3vw, 36px)',
    maxWidth: '1000px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerCard: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '24px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  iconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    display: 'grid',
    placeItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 2px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B675F',
    margin: 0,
  },
  successBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#EBF7EE',
    color: '#1E7E34',
    fontSize: '13.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E3DED2',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid #F2EEE6',
  },
  avatarOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '12px',
  },
  avatarCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  avatarCardActive: {
    background: '#FFF9E6',
    borderColor: '#F4CF63',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  diagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
  },
  diagItem: {
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    borderRadius: '10px',
    padding: '12px 14px',
  },
  diagLabel: {
    display: 'block',
    fontSize: '11.5px',
    color: '#6B675F',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  diagVal: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A0A0A',
    marginTop: '4px',
  },
  clearCacheBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '999px',
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    color: '#6B675F',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '999px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    border: 'none',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

