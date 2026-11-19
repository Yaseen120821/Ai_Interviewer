// src/pages/profile/ProfilePage.jsx
// MockMate AI Complete Candidate Profile System
// Features: Personal info, professional career targets, technical skill chips with proficiencies,
// verified professional links, local PDF resume management, and dynamic completion scoring.

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import useAuthStore from '../../store/authStore';
import firestoreService from '../../services/firestoreService';
import { resumeService } from '../../services/resumeService';
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  X,
  ExternalLink,
  Upload,
  Trash2,
  Download,
  Sparkles,
} from 'lucide-react';

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Express.js',
  'SQL', 'PostgreSQL', 'MongoDB', 'Data Structures & Algorithms',
  'System Design', 'Docker', 'Machine Learning', 'Generative AI'
];

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [activeResume, setActiveResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Form State
  const [profile, setProfile] = useState({
    // Basic Personal Info
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    country: '',
    bio: '',

    // Professional & Education
    currentRole: '',
    targetRole: '',
    experienceLevel: 'Mid-Level',
    yearsOfExperience: '3',
    currentCompany: '',
    degree: '',
    college: '',
    gradYear: '',

    // Skills: Array of { name: string, level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' }
    skills: [],

    // Professional Links
    linkedin: '',
    github: '',
    portfolio: '',
    leetcode: '',
    hackerrank: '',
  });

  // State for adding skill
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');

  // Load profile from Firestore & active resume on mount
  useEffect(() => {
    const loadProfile = async () => {
      const uid = user?.id || user?.uid;
      try {
        if (uid) {
          const docData = await firestoreService.getUserProfile(uid);
          if (docData) {
            setProfile((prev) => ({
              ...prev,
              name: docData.name || docData.displayName || user?.name || '',
              email: user?.email || docData.email || '',
              headline: docData.headline || '',
              phone: docData.phone || '',
              location: docData.location || '',
              country: docData.country || '',
              bio: docData.bio || docData.summary || '',
              currentRole: docData.currentRole || '',
              targetRole: docData.targetRole || '',
              experienceLevel: docData.experienceLevel || 'Mid-Level',
              yearsOfExperience: docData.yearsOfExperience || '3',
              currentCompany: docData.currentCompany || docData.organization || '',
              degree: docData.degree || '',
              college: docData.college || docData.university || '',
              gradYear: docData.gradYear || '',
              skills: Array.isArray(docData.skills) ? docData.skills : [],
              linkedin: docData.linkedin || '',
              github: docData.github || '',
              portfolio: docData.portfolio || '',
              leetcode: docData.leetcode || '',
              hackerrank: docData.hackerrank || '',
            }));
          } else {
            setProfile((prev) => ({
              ...prev,
              name: user?.name || '',
              email: user?.email || '',
            }));
          }
        }

        const resRes = await resumeService.getActive();
        if (resRes.data?.data) {
          setActiveResume(resRes.data.data);
        }
      } catch (err) {
        console.warn('[ProfilePage] Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Compute profile completeness percentage
  const completeness = useMemo(() => {
    const fields = [
      Boolean(profile.name.trim()),
      Boolean(profile.headline.trim()),
      Boolean(profile.bio.trim()),
      Boolean(profile.targetRole.trim()),
      Boolean(profile.skills.length > 0),
      Boolean(profile.linkedin.trim() || profile.github.trim()),
      Boolean(profile.degree.trim() || profile.college.trim()),
      Boolean(activeResume),
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile, activeResume]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (nameToAdd = newSkillName, levelToAdd = newSkillLevel) => {
    const trimmed = (nameToAdd || '').trim();
    if (!trimmed) return;
    if (profile.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: trimmed, level: levelToAdd }],
    }));
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillName) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.name !== skillName),
    }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const uid = user?.id || user?.uid;
    if (!uid) return;

    setStatusMsg({ type: '', text: '' });
    setSaving(true);

    try {
      await firestoreService.updateUserProfile(uid, {
        ...profile,
        updatedAt: new Date().toISOString(),
      });

      updateUser({
        name: profile.name,
      });

      setStatusMsg({ type: 'success', text: 'Profile changes successfully saved.' });
    } catch (err) {
      console.error('[ProfilePage] Save error:', err);
      setStatusMsg({ type: 'error', text: 'Could not save profile. Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  // Resume Upload / Replace
  const handleResumeFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMsg({ type: 'error', text: 'Please upload a PDF file.' });
      return;
    }

    setResumeUploading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await resumeService.upload(formData);
      const uploaded = res.data?.data || res.data;
      setActiveResume(uploaded);
      setStatusMsg({ type: 'success', text: 'Resume uploaded and activated successfully.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Resume upload failed.' });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!activeResume?.id) return;
    try {
      await resumeService.delete(activeResume.id);
      setActiveResume(null);
      setStatusMsg({ type: 'success', text: 'Resume removed from your profile.' });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to delete resume.' });
    }
  };

  const displayName = profile.name || user?.name || user?.email?.split('@')[0] || 'Candidate';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.main}>
        {/* Top Header Card with Completeness */}
        <div style={styles.headerCard}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>{initial}</div>
            <div>
              <div style={styles.badgeRow}>
                <span style={styles.proPill}>Candidate Profile</span>
                <span style={styles.verifiedPill}>Firebase Verified</span>
              </div>
              <h1 style={styles.title}>{displayName}</h1>
              <p style={styles.headline}>
                {profile.headline || profile.targetRole || 'Complete your profile to personalize interview simulations'}
              </p>
            </div>
          </div>

          <div style={styles.completenessBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Profile Completeness</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: completeness === 100 ? '#1E7E34' : '#FF5A1F' }}>
                {completeness}%
              </span>
            </div>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${completeness}%`,
                  background: completeness === 100 ? '#1E7E34' : '#FF5A1F',
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#6B675F', marginTop: '6px', display: 'block' }}>
              {completeness === 100 ? 'All essential fields complete' : 'Add skills, resume & links to hit 100%'}
            </span>
          </div>
        </div>

        {/* Notifications Banner */}
        {statusMsg.text && (
          <div style={statusMsg.type === 'success' ? styles.successBanner : styles.errorBanner}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSaveProfile} style={styles.formGrid}>
          {/* Section 1: Basic Personal Info */}
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeading}>
              <User size={18} color="#FF5A1F" />
              <h3>Personal Information</h3>
            </div>

            <div style={styles.fieldsGrid2}>
              <div>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Alex Rivera"
                  style={styles.input}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Professional Headline</label>
                <input
                  type="text"
                  name="headline"
                  value={profile.headline}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Frontend Engineer | React & TypeScript"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Email Address (Account ID)</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  style={{ ...styles.input, background: '#F2EEE6', color: '#6B675F', cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>City / Region</label>
                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleInputChange}
                  placeholder="e.g. San Francisco, CA"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Country</label>
                <input
                  type="text"
                  name="country"
                  value={profile.country}
                  onChange={handleInputChange}
                  placeholder="e.g. United States"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={styles.label}>Professional Summary</label>
              <textarea
                name="bio"
                rows={3}
                value={profile.bio}
                onChange={handleInputChange}
                placeholder="Brief summary of your technical background, core competencies, and career goals..."
                style={styles.textarea}
              />
            </div>
          </section>

          {/* Section 2: Professional & Education Targets */}
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeading}>
              <Briefcase size={18} color="#FF5A1F" />
              <h3>Career & Education Targets</h3>
            </div>

            <div style={styles.fieldsGrid2}>
              <div>
                <label style={styles.label}>Target Job Role</label>
                <input
                  type="text"
                  name="targetRole"
                  value={profile.targetRole}
                  onChange={handleInputChange}
                  placeholder="e.g. Full Stack Engineer"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Current Job Role</label>
                <input
                  type="text"
                  name="currentRole"
                  value={profile.currentRole}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Developer"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Experience Level</label>
                <select
                  name="experienceLevel"
                  value={profile.experienceLevel}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="Junior (0-2 years)">Junior (0-2 years)</option>
                  <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                  <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                  <option value="Lead / Staff (8+ years)">Lead / Staff (8+ years)</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Current Company / Organization</label>
                <input
                  type="text"
                  name="currentCompany"
                  value={profile.currentCompany}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Tech Corp"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Highest Degree</label>
                <input
                  type="text"
                  name="degree"
                  value={profile.degree}
                  onChange={handleInputChange}
                  placeholder="e.g. B.S. in Computer Science"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>University / College</label>
                <input
                  type="text"
                  name="college"
                  value={profile.college}
                  onChange={handleInputChange}
                  placeholder="e.g. University of California, Berkeley"
                  style={styles.input}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Technical Skills with Proficiency */}
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeading}>
              <Wrench size={18} color="#FF5A1F" />
              <h3>Technical Skills & Proficiency</h3>
            </div>

            {/* Existing Skills Chips */}
            <div style={styles.skillsWrap}>
              {profile.skills.map((s, idx) => (
                <div key={idx} style={styles.skillChip}>
                  <span style={styles.skillName}>{s.name}</span>
                  <span style={styles.skillBadge}>{s.level}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s.name)}
                    style={styles.removeSkillBtn}
                    aria-label={`Remove ${s.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Skill Row */}
            <div style={styles.addSkillRow}>
              <input
                type="text"
                placeholder="Add custom skill (e.g. Kubernetes, GraphQL)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                style={{ ...styles.select, width: '150px' }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              <button
                type="button"
                onClick={() => handleAddSkill()}
                style={styles.addSkillBtn}
              >
                <Plus size={16} />
                <span>Add Skill</span>
              </button>
            </div>

            {/* Quick Add Pills */}
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: '#6B675F', fontWeight: '500' }}>Quick add:</span>
              <div style={styles.quickAddRow}>
                {COMMON_SKILLS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAddSkill(item, 'Intermediate')}
                    style={styles.quickPill}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: Professional Links */}
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeading}>
              <LinkIcon size={18} color="#FF5A1F" />
              <h3>Professional Links & Portfolios</h3>
            </div>

            <div style={styles.fieldsGrid2}>
              <div>
                <label style={styles.label}>LinkedIn Profile URL</label>
                <div style={styles.linkInputWrap}>
                  <input
                    type="url"
                    name="linkedin"
                    value={profile.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    style={styles.input}
                  />
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={styles.linkIconBtn}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label style={styles.label}>GitHub Profile URL</label>
                <div style={styles.linkInputWrap}>
                  <input
                    type="url"
                    name="github"
                    value={profile.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username"
                    style={styles.input}
                  />
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" style={styles.linkIconBtn}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label style={styles.label}>LeetCode Profile URL</label>
                <div style={styles.linkInputWrap}>
                  <input
                    type="url"
                    name="leetcode"
                    value={profile.leetcode}
                    onChange={handleInputChange}
                    placeholder="https://leetcode.com/username"
                    style={styles.input}
                  />
                  {profile.leetcode && (
                    <a href={profile.leetcode} target="_blank" rel="noopener noreferrer" style={styles.linkIconBtn}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label style={styles.label}>Portfolio / Personal Website</label>
                <div style={styles.linkInputWrap}>
                  <input
                    type="url"
                    name="portfolio"
                    value={profile.portfolio}
                    onChange={handleInputChange}
                    placeholder="https://yourportfolio.dev"
                    style={styles.input}
                  />
                  {profile.portfolio && (
                    <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" style={styles.linkIconBtn}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Resume Vault */}
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeading}>
              <FileText size={18} color="#FF5A1F" />
              <h3>Resume Management</h3>
            </div>

            {activeResume ? (
              <div style={styles.resumeActiveCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.pdfIconWrap}>
                    <FileText size={20} color="#EC4F5F" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>
                      {activeResume.filename || activeResume.originalName || 'Primary Resume.pdf'}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B675F' }}>
                      Uploaded on {new Date(activeResume.createdAt || Date.now()).toLocaleDateString()} • Verified PDF
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={styles.replaceResumeBtn}>
                    <Upload size={14} />
                    <span>Replace PDF</span>
                    <input type="file" accept=".pdf" onChange={handleResumeFileSelect} style={{ display: 'none' }} />
                  </label>

                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    style={styles.deleteResumeBtn}
                    title="Delete Resume"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.resumeEmptyCard}>
                <Upload size={28} color="#A39E93" />
                <h4 style={{ margin: '10px 0 4px', fontSize: '14px', fontWeight: '700' }}>No Active Resume Uploaded</h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B675F' }}>
                  Upload a PDF resume to power personalized questions tailored to your projects and experience.
                </p>
                <label style={styles.uploadResumeBtn}>
                  {resumeUploading ? 'Uploading...' : 'Upload PDF Resume'}
                  <input type="file" accept=".pdf" onChange={handleResumeFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </section>

          {/* Bottom Sticky Action Bar */}
          <div style={styles.stickyFooter}>
            <button
              type="submit"
              disabled={saving}
              style={styles.saveBtn}
            >
              <Save size={16} />
              <span>{saving ? 'Saving to Firestore...' : 'Save Profile Changes'}</span>
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
    maxWidth: '1200px',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#FF5A1F',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '24px',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 4px 12px rgba(255,90,31,0.2)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  proPill: {
    background: '#FFF9E6',
    border: '1px solid #F4CF63',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#856404',
    textTransform: 'uppercase',
  },
  verifiedPill: {
    background: '#EBF7EE',
    color: '#1E7E34',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 2px',
    letterSpacing: '-0.02em',
  },
  headline: {
    fontSize: '14px',
    color: '#6B675F',
    margin: 0,
  },
  completenessBox: {
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    borderRadius: '14px',
    padding: '14px 18px',
    minWidth: '220px',
  },
  progressTrack: {
    height: '6px',
    background: '#E3DED2',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
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
  errorBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#FBEBED',
    color: '#EC4F5F',
    fontSize: '13.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionCard: {
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
  fieldsGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0A0A0A',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  select: {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0A0A0A',
    boxSizing: 'border-box',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #E3DED2',
    background: '#FBFAF7',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#0A0A0A',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
  },
  skillsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '14px',
    minHeight: '36px',
  },
  skillChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
  },
  skillName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A0A0A',
  },
  skillBadge: {
    fontSize: '10px',
    fontWeight: '700',
    background: '#0A0A0A',
    color: '#F2EEE6',
    padding: '1px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  removeSkillBtn: {
    background: 'none',
    border: 'none',
    color: '#6B675F',
    cursor: 'pointer',
    padding: '2px',
    display: 'grid',
    placeItems: 'center',
  },
  addSkillRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  addSkillBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '44px',
    padding: '0 18px',
    borderRadius: '10px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  quickAddRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '6px',
  },
  quickPill: {
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    borderRadius: '999px',
    padding: '3px 10px',
    fontSize: '12px',
    color: '#6B675F',
    cursor: 'pointer',
    fontWeight: '500',
  },
  linkInputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  linkIconBtn: {
    position: 'absolute',
    right: '12px',
    color: '#6B675F',
    display: 'grid',
    placeItems: 'center',
  },
  resumeActiveCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#FBFAF7',
    border: '1px solid #E3DED2',
    borderRadius: '14px',
    padding: '16px 20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pdfIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#FBEBED',
    display: 'grid',
    placeItems: 'center',
  },
  replaceResumeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '999px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteResumeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#FBEBED',
    border: 'none',
    color: '#EC4F5F',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
  resumeEmptyCard: {
    textAlign: 'center',
    padding: '32px 16px',
    background: '#FBFAF7',
    border: '1px dashed #E3DED2',
    borderRadius: '14px',
  },
  uploadResumeBtn: {
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '999px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  stickyFooter: {
    position: 'sticky',
    bottom: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    borderRadius: '999px',
    background: '#0A0A0A',
    color: '#F2EEE6',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
};

