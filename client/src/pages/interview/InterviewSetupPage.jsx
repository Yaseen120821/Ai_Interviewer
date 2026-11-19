// src/pages/interview/InterviewSetupPage.jsx
// Complete Interview Setup Wizard with 3 Distinct Modes:
// - Mode A: Resume-Based Interview (Personalized questions from uploaded resume)
// - Mode B: Job Description-Based Interview (NO RESUME REQUIRED — paste any JD)
// - Mode C: General Role-Based Interview (NO RESUME REQUIRED — role & level practice)
// Full fluid width adhering to the MockMate AI design tokens.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { resumeService } from '../../services/resumeService';
import { interviewService } from '../../services/interviewService';
import firestoreService from '../../services/firestoreService';
import useAuthStore from '../../store/authStore';
import {
  Briefcase,
  Sparkles,
  Bot,
  Mic,
  FileText,
  Clock,
  Layers,
  Code2,
  CheckCircle2,
  Upload,
  Building,
  Target,
  ArrowRight,
} from 'lucide-react';

const POPULAR_ROLES = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'AI / ML Engineer',
  'Python Developer',
  'Java Developer',
  'Software Engineer',
  'DevOps Engineer',
  'Data Scientist',
];

const EXPERIENCE_LEVELS = [
  { id: 'Fresher', label: 'Fresher', desc: 'College graduate / entry level' },
  { id: '0-1 year', label: '0–1 Year', desc: 'Junior engineer / internship' },
  { id: '1-2 years', label: '1–2 Years', desc: 'Early career contributor' },
  { id: '2-3 years', label: '2–3 Years', desc: 'Mid-level developer' },
  { id: '3-5 years', label: '3–5 Years', desc: 'Senior engineer / specialist' },
  { id: '5+ years', label: '5+ Years', desc: 'Staff / Tech Lead' },
];

const MODES = [
  { id: 'avatar', title: 'Voice + AI Avatar', desc: 'Live interactive avatar with speech synthesis & facial animation.', icon: Bot, badge: 'Recommended' },
  { id: 'voice', title: 'Voice Only', desc: 'Audio conversation with speech-to-text live transcription.', icon: Mic },
  { id: 'text', title: 'Text Interview', desc: 'Classic typed response drafting with per-question timers.', icon: FileText },
];

const ROUNDS = [
  { id: 'technical', title: 'Technical Round', desc: 'Architecture, DSA fundamentals, system trade-offs & role knowledge.' },
  { id: 'hr', title: 'HR & Behavioral', desc: 'STAR method, situational questions, leadership & cultural fit.' },
  { id: 'coding', title: 'Coding Round', desc: 'Interactive Monaco Editor coding assessment with sandbox execution.' },
  { id: 'simulation', title: 'Recruitment Simulation', desc: 'Full multi-phase placement simulation (Screening → Tech → Coding → HR).' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'Fundamentals & conceptual questions' },
  { id: 'medium', label: 'Medium', desc: 'Scenario application & practical engineering' },
  { id: 'hard', label: 'Hard', desc: 'Edge cases, architectural stress & deep trade-offs' },
  { id: 'adaptive', label: 'Adaptive', desc: 'Dynamically scales difficulty to candidate performance', badge: 'AI Adaptive' },
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSubmittingRef = useRef(false);

  // 1. Primary Interview Mode Selection: 'role' | 'jd' | 'resume'
  const [interviewModeType, setInterviewModeType] = useState('role');

  // Parameters
  const [companyName, setCompanyName] = useState('');
  const [roleTarget, setRoleTarget] = useState('Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('1-2 years');
  const [mode, setMode] = useState('avatar');
  const [round, setRound] = useState('technical');
  const [difficulty, setDifficulty] = useState('adaptive');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(90);
  const [codingLang, setCodingLang] = useState('python');

  // Resumes
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch candidate resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumeService.getAll();
        const list = res.data?.data || res.data || [];
        setResumes(list);
        const active = list.find((r) => r.isActive);
        if (active) setSelectedResumeId(active.id);
        else if (list.length > 0) setSelectedResumeId(list[0].id);
      } catch {
        /* ignore */
      }
    };
    fetchResumes();
  }, []);

  const activeRole = customRole.trim() || roleTarget;

  const handleStartInterview = async () => {
    if (isSubmittingRef.current || loading) return;

    if (!activeRole) {
      setError('Please specify or select your target job role.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (interviewModeType === 'jd' && (!jobDescription || jobDescription.trim().length < 20)) {
      setError('Please paste a job description (at least 20 characters) for JD-Based mode.');
      return;
    }

    if (interviewModeType === 'resume' && !selectedResumeId && resumes.length === 0) {
      setError('No resume selected. Please upload a resume or switch to Job Description or General Role mode.');
      return;
    }

    setError('');
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      // ── STEP 1: Mandatory Fullscreen Validation (Phase 3) ──
      // Request browser fullscreen directly within the user click gesture
      const elem = document.documentElement;
      const requestFs = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen || elem.mozRequestFullScreen;

      if (!requestFs) {
        throw new Error('Fullscreen API is not supported on this browser. MockMate AI requires a modern browser supporting Fullscreen (Chrome, Edge, or Firefox) for mock interviews.');
      }

      try {
        await requestFs.call(elem);
      } catch (fsErr) {
        console.warn('[InterviewSetupPage] Fullscreen request rejected:', fsErr);
        throw new Error('MockMate AI requires fullscreen mode for an authentic, distraction-free interview simulation. Please click "Start Mock Interview Now" again and allow fullscreen access.');
      }

      const isFsActive = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isFsActive) {
        throw new Error('Fullscreen mode was not confirmed by the browser. Please click "Start Mock Interview Now" again to enter fullscreen.');
      }

      // ── STEP 2: Only create interview session after fullscreen confirmed ──
      const payload = {
        company: companyName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        targetRole: activeRole,
        roleTarget: activeRole,
        role: activeRole,
        experienceLevel,
        interviewType: round === 'simulation' ? 'simulation' : round === 'coding' ? 'coding' : round === 'hr' ? 'hr' : 'technical',
        round,
        difficulty,
        mode,
        isAdaptive: difficulty === 'adaptive',
        timeLimitPerQuestion: Number(timeLimit) || 90,
        timeLimit: Number(timeLimit) || 90,
        questionCount: Number(questionCount) || 5,
        count: Number(questionCount) || 5,
        resumeId: interviewModeType === 'resume' ? selectedResumeId : null,
        jobDescription: interviewModeType === 'jd' ? jobDescription.trim() : null,
        codingLang,
      };

      console.log('[InterviewSetupPage] Creating mock interview with payload:', payload);
      const createRes = await interviewService.create(payload);
      console.log('[InterviewSetupPage] Server response:', createRes.data);

      const session = createRes.data?.data || createRes.data?.session || createRes.data;
      const sessionId = session?.id || session?.sessionId || session?.interviewId || createRes.data?.sessionId;
      const questions = createRes.data?.questions || session?.questions || [];

      if (!sessionId) {
        throw new Error('Failed to create interview session. Invalid response from server.');
      }

      // Store in sessionStorage for immediate hydration
      try {
        sessionStorage.setItem('current_interview_session', JSON.stringify({
          sessionId,
          session,
          questions,
          timestamp: Date.now(),
        }));
      } catch {
        /* ignore */
      }

      // Synchronize creation to Cloud Firestore
      try {
        await firestoreService.createInterview({
          id: sessionId,
          userId: user?.id || user?.uid || 'candidate',
          selectedCompany: companyName.trim() || 'General Tech',
          jobRole: activeRole,
          interviewStatus: 'in-progress',
          currentPhase: round === 'simulation' ? 'Phase 1: Screening' : round.toUpperCase(),
          roundType: round,
          difficulty,
          totalQuestions: Number(questionCount) || 5,
          mode,
          resumeId: interviewModeType === 'resume' ? selectedResumeId : null,
        });
      } catch (fsErr) {
        console.warn('[InterviewSetupPage] Firestore sync warning:', fsErr.message);
      }

      if (round === 'coding') {
        navigate(`/interview/coding/${sessionId}`, { state: { session, questions } });
      } else {
        navigate(`/interview/${sessionId}`, { state: { session, questions } });
      }
    } catch (err) {
      console.error('[InterviewSetupPage] Failed to start interview:', err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not create interview session. Please check your settings.'
      );
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div style={layoutStyle}>
      <Sidebar />

      <main style={mainContentStyle}>
        {/* Top Header */}
        <div style={headerSectionStyle}>
          <div style={categoryPillStyle}>
            <Sparkles size={14} color="#FF5A1F" />
            <span>INTERVIEW CONFIGURATION</span>
          </div>
          <h1 style={titleStyle}>Configure Your AI Mock Interview</h1>
          <p style={subtitleStyle}>
            Select your interview mode, calibrate role depth, and practice live with AI feedback.
          </p>
        </div>

        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* ── MODE SELECTION TABS (Top Priority) ── */}
        <div style={modeTabsContainerStyle}>
          {/* Mode C: General Role-Based */}
          <button
            type="button"
            data-mode="role"
            onClick={() => { setInterviewModeType('role'); setError(''); }}
            style={{
              ...modeTabCardStyle,
              ...(interviewModeType === 'role' ? modeTabCardActiveStyle : {}),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color={interviewModeType === 'role' ? '#FF5A1F' : '#0A0A0A'} />
                <span style={modeTabTitleStyle}>General Role-Based</span>
              </div>
              <span style={freePillStyle}>FAST SPRINT</span>
            </div>
            <p style={modeTabDescStyle}>
              Select any engineering role, experience level, and round. Practice standard industry interview questions instantly.
            </p>
          </button>

          {/* Mode B: JD-Based */}
          <button
            type="button"
            data-mode="jd"
            onClick={() => { setInterviewModeType('jd'); setError(''); }}
            style={{
              ...modeTabCardStyle,
              ...(interviewModeType === 'jd' ? modeTabCardActiveStyle : {}),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color={interviewModeType === 'jd' ? '#FF5A1F' : '#0A0A0A'} />
                <span style={modeTabTitleStyle}>Job Description-Based</span>
              </div>
              <span style={freePillStyle}>NO RESUME REQUIRED</span>
            </div>
            <p style={modeTabDescStyle}>
              Paste any job posting or tech stack. AI will extract responsibilities and generate tailored situational questions.
            </p>
          </button>

          {/* Mode A: Resume-Based */}
          <button
            type="button"
            data-mode="resume"
            onClick={() => { setInterviewModeType('resume'); setError(''); }}
            style={{
              ...modeTabCardStyle,
              ...(interviewModeType === 'resume' ? modeTabCardActiveStyle : {}),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color={interviewModeType === 'resume' ? '#FF5A1F' : '#0A0A0A'} />
                <span style={modeTabTitleStyle}>Resume-Based</span>
              </div>
              {resumes.length > 0 && <span style={readyPillStyle}>RESUME READY</span>}
            </div>
            <p style={modeTabDescStyle}>
              Questions interrogate your actual listed projects, libraries, and career timeline for high-fidelity realism.
            </p>
          </button>
        </div>

        {/* ── FORM CONFIGURATION SECTIONS ── */}
        <div style={formGridStyle}>
          {/* SECTION: Mode Specific Configurations */}
          {interviewModeType === 'jd' && (
            <section style={cardStyle}>
              <div style={sectionHeadingStyle}>
                <span style={numberBadgeStyle}>JD</span>
                <div>
                  <h3 style={sectionTitleStyle}>Job Description & Company Target</h3>
                  <p style={sectionDescStyle}>Paste requirements, qualifications, or company stack requirements.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Company Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Amazon, Stripe"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Target Job Title <span style={{ color: '#EC4F5F' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={customRole || roleTarget}
                    onChange={(e) => setCustomRole(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <label style={labelStyle}>
                Paste Job Description <span style={{ color: '#EC4F5F' }}>*</span>
                <span style={{ float: 'right', color: '#6B675F', fontWeight: 'normal' }}>{jobDescription.length} chars</span>
              </label>
              <textarea
                rows={6}
                placeholder="Paste the complete job posting, required qualifications, key tech stack, and responsibilities here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
              />
            </section>
          )}

          {interviewModeType === 'resume' && (
            <section style={cardStyle}>
              <div style={sectionHeadingStyle}>
                <span style={numberBadgeStyle}>CV</span>
                <div>
                  <h3 style={sectionTitleStyle}>Select Candidate Resume</h3>
                  <p style={sectionDescStyle}>Choose which uploaded resume to cross-examine during the interview.</p>
                </div>
              </div>

              {resumes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {resumes.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResumeId(r.id)}
                      style={{
                        ...optionCardStyle,
                        ...(selectedResumeId === r.id ? optionCardActiveStyle : {}),
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={optionTitleStyle}>📄 {r.fileName}</span>
                        {selectedResumeId === r.id && <CheckCircle2 size={16} color="#0A0A0A" />}
                      </div>
                      <span style={optionDescStyle}>Uploaded on {new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', background: '#FBFAF7', borderRadius: '14px', border: '1px dashed #E3DED2', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#6B675F' }}>
                    You have not uploaded any resume yet. You can upload one in the Resume Vault or switch to Job Description mode!
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate('/resume')}
                      style={{ ...chipStyle, background: '#0A0A0A', color: '#FFFFFF' }}
                    >
                      <Upload size={14} style={{ marginRight: '6px' }} /> Upload to Resume Vault
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterviewModeType('jd')}
                      style={{ ...chipStyle, background: '#F4CF63', color: '#0A0A0A' }}
                    >
                      Switch to JD-Based Mode →
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION 1: Target Role (for Role & Resume modes) */}
          {interviewModeType !== 'jd' && (
            <section style={cardStyle}>
              <div style={sectionHeadingStyle}>
                <span style={numberBadgeStyle}>01</span>
                <div>
                  <h3 style={sectionTitleStyle}>Target Job Role</h3>
                  <p style={sectionDescStyle}>Select from popular engineering roles or enter a custom title.</p>
                </div>
              </div>

              <div style={chipGridStyle}>
                {POPULAR_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRoleTarget(r); setCustomRole(''); }}
                    style={{
                      ...chipStyle,
                      ...(roleTarget === r && !customRole ? chipActiveStyle : {}),
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Or Enter Custom Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Cloud Architect"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </section>
          )}

          {/* SECTION 2: Experience Level */}
          <section style={cardStyle}>
            <div style={sectionHeadingStyle}>
              <span style={numberBadgeStyle}>02</span>
              <div>
                <h3 style={sectionTitleStyle}>Experience Level</h3>
                <p style={sectionDescStyle}>Calibrates question depth, complexity, and expected seniority.</p>
              </div>
            </div>

            <div style={optionsGridStyle}>
              {EXPERIENCE_LEVELS.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setExperienceLevel(exp.id)}
                  style={{
                    ...optionCardStyle,
                    ...(experienceLevel === exp.id ? optionCardActiveStyle : {}),
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={optionTitleStyle}>{exp.label}</span>
                    {experienceLevel === exp.id && <CheckCircle2 size={16} color="#0A0A0A" />}
                  </div>
                  <span style={optionDescStyle}>{exp.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Interview Mode */}
          <section style={cardStyle}>
            <div style={sectionHeadingStyle}>
              <span style={numberBadgeStyle}>03</span>
              <div>
                <h3 style={sectionTitleStyle}>Interaction Medium</h3>
                <p style={sectionDescStyle}>Choose your interaction medium with the AI interviewer.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {MODES.map((m) => {
                const IconComponent = m.icon;
                return (
                  <div
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    style={{
                      ...optionCardStyle,
                      ...(mode === m.id ? optionCardActiveStyle : {}),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <IconComponent size={22} color={mode === m.id ? '#FF5A1F' : '#0A0A0A'} />
                      {m.badge && <span style={recommendedBadgeStyle}>{m.badge}</span>}
                    </div>
                    <span style={optionTitleStyle}>{m.title}</span>
                    <span style={optionDescStyle}>{m.desc}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 4: Interview Round Category */}
          <section style={cardStyle}>
            <div style={sectionHeadingStyle}>
              <span style={numberBadgeStyle}>04</span>
              <div>
                <h3 style={sectionTitleStyle}>Interview Round Format</h3>
                <p style={sectionDescStyle}>Simulate specialized interview formats or a full recruitment pipeline.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {ROUNDS.map((rnd) => (
                <div
                  key={rnd.id}
                  onClick={() => setRound(rnd.id)}
                  style={{
                    ...optionCardStyle,
                    ...(round === rnd.id ? optionCardActiveStyle : {}),
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={optionTitleStyle}>{rnd.title}</span>
                    {round === rnd.id && <CheckCircle2 size={16} color="#0A0A0A" />}
                  </div>
                  <span style={optionDescStyle}>{rnd.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: Difficulty Level */}
          <section style={cardStyle}>
            <div style={sectionHeadingStyle}>
              <span style={numberBadgeStyle}>05</span>
              <div>
                <h3 style={sectionTitleStyle}>Difficulty Level</h3>
                <p style={sectionDescStyle}>Select progression difficulty or let Gemini adapt dynamically.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {DIFFICULTIES.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  style={{
                    ...optionCardStyle,
                    ...(difficulty === d.id ? optionCardActiveStyle : {}),
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={optionTitleStyle}>{d.label}</span>
                    {d.badge && <span style={recommendedBadgeStyle}>{d.badge}</span>}
                  </div>
                  <span style={optionDescStyle}>{d.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: Pacing & Question Limits */}
          <section style={cardStyle}>
            <div style={sectionHeadingStyle}>
              <span style={numberBadgeStyle}>06</span>
              <div>
                <h3 style={sectionTitleStyle}>Pacing & Configuration</h3>
                <p style={sectionDescStyle}>Configure question quantities, countdown timers, and sandbox execution.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  style={inputStyle}
                >
                  <option value={3}>3 Questions (Quick Sprint)</option>
                  <option value={5}>5 Questions (Elevo Standard)</option>
                  <option value={8}>8 Questions (In-Depth)</option>
                  <option value={10}>10 Questions (Comprehensive)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Time Limit per Question</label>
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  style={inputStyle}
                >
                  <option value={60}>60 Seconds (Rapid Fire)</option>
                  <option value={90}>90 Seconds (Balanced)</option>
                  <option value={120}>120 Seconds (Technical)</option>
                  <option value={180}>180 Seconds (Extended)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Coding Sandbox Language</label>
                <select
                  value={codingLang}
                  onChange={(e) => setCodingLang(e.target.value)}
                  style={inputStyle}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            </div>
          </section>

          {/* Bottom Error & Start CTA */}
          {error && (
            <div style={{ ...errorBannerStyle, margin: '8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span>⚠️ {error}</span>
              {interviewModeType === 'jd' && (!jobDescription || jobDescription.trim().length < 20) && (
                <button
                  type="button"
                  onClick={() => {
                    setJobDescription('Looking for a Full Stack Engineer proficient in React, Node.js, and system architecture. Responsibilities include building scalable APIs, designing database schemas, and collaborating on high-throughput microservices.');
                    setError('');
                  }}
                  style={{
                    background: '#0A0A0A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Insert Sample JD & Continue →
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleStartInterview}
              disabled={loading}
              style={submitBtnStyle}
            >
              {loading ? 'Initializing Interview Session...' : 'Start Mock Interview Now →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Inline Styles adhering strictly to MockMate AI Tokens ────────────────
const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#F2EEE6',
  color: '#0A0A0A',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
};

const mainContentStyle = {
  flex: 1,
  minWidth: 0,
  padding: 'clamp(20px, 3vw, 40px)',
  maxWidth: '1600px',
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
};

const headerSectionStyle = {
  marginBottom: '24px',
};

const categoryPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.05em',
  marginBottom: '10px',
};

const titleStyle = {
  fontSize: 'clamp(26px, 3.5vw, 36px)',
  fontWeight: '700',
  letterSpacing: '-0.02em',
  margin: '0 0 6px',
};

const subtitleStyle = {
  fontSize: '15px',
  color: '#6B675F',
  margin: 0,
};

const errorBannerStyle = {
  padding: '12px 16px',
  background: '#FBEBED',
  color: '#B3323F',
  border: '1px solid #F3C2C7',
  borderRadius: '12px',
  fontSize: '14px',
  marginBottom: '20px',
  fontWeight: '500',
};

const modeTabsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
};

const modeTabCardStyle = {
  background: '#FFFFFF',
  border: '2px solid #E3DED2',
  borderRadius: '18px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
  textAlign: 'left',
  width: '100%',
  font: 'inherit',
};

const modeTabCardActiveStyle = {
  borderColor: '#0A0A0A',
  background: '#FFFFFF',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

const modeTabTitleStyle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#0A0A0A',
};

const modeTabDescStyle = {
  fontSize: '13px',
  color: '#6B675F',
  lineHeight: '1.45',
  margin: 0,
};

const freePillStyle = {
  background: '#EBF7EE',
  color: '#16A34A',
  border: '1px solid #DCFCE7',
  fontSize: '10px',
  fontWeight: '700',
  padding: '2px 8px',
  borderRadius: '999px',
  letterSpacing: '0.04em',
};

const readyPillStyle = {
  background: '#FFF9E6',
  color: '#856404',
  border: '1px solid #F4CF63',
  fontSize: '10px',
  fontWeight: '700',
  padding: '2px 8px',
  borderRadius: '999px',
};

const formGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '20px',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
};

const sectionHeadingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '18px',
};

const numberBadgeStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  background: '#F4CF63',
  color: '#0A0A0A',
  fontWeight: '800',
  fontSize: '13px',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const sectionTitleStyle = {
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 2px',
};

const sectionDescStyle = {
  fontSize: '13px',
  color: '#6B675F',
  margin: 0,
};

const chipGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const chipStyle = {
  padding: '8px 14px',
  borderRadius: '999px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  fontSize: '13px',
  fontWeight: '500',
  color: '#0A0A0A',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const chipActiveStyle = {
  background: '#0A0A0A',
  color: '#F2EEE6',
  borderColor: '#0A0A0A',
  fontWeight: '600',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  height: '46px',
  padding: '0 14px',
  border: '1px solid #E3DED2',
  borderRadius: '12px',
  background: '#FBFAF7',
  fontFamily: 'inherit',
  fontSize: '14px',
  color: '#0A0A0A',
  boxSizing: 'border-box',
  outline: 'none',
};

const optionsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
};

const optionCardStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  borderRadius: '14px',
  padding: '14px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const optionCardActiveStyle = {
  background: '#FFFFFF',
  borderColor: '#0A0A0A',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const optionTitleStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#0A0A0A',
};

const optionDescStyle = {
  fontSize: '12px',
  color: '#6B675F',
  lineHeight: '1.4',
};

const recommendedBadgeStyle = {
  fontSize: '10px',
  fontWeight: '700',
  background: '#F4CF63',
  color: '#0A0A0A',
  padding: '2px 6px',
  borderRadius: '999px',
};

const submitBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  padding: '14px 28px',
  borderRadius: '999px',
  background: '#0A0A0A',
  color: '#F2EEE6',
  border: 'none',
  fontFamily: 'inherit',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'background 0.15s ease, transform 0.15s ease',
  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
};
