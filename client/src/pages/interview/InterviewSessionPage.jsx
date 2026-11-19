// src/pages/interview/InterviewSessionPage.jsx
// Complete Interactive Interview Workspace featuring AI Avatar, Voice Synthesis, STT, and Per-Question AI Evaluation.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';
import { voiceService } from '../../services/voiceService';
import firestoreService from '../../services/firestoreService';
import AIInterviewerAvatar from '../../components/interview/AIInterviewerAvatar';
import InterviewTimer from '../../components/interview/InterviewTimer';
import Logo from '../../components/Logo';
import {
  Mic,
  MicOff,
  Send,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Award,
} from 'lucide-react';

export default function InterviewSessionPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Session & Question state
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  // Interactive answer state
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  // Avatar & Voice state
  const [avatarState, setAvatarState] = useState('idle'); // 'idle' | 'speaking' | 'listening' | 'thinking' | 'evaluating'
  const [avatarSubtitle, setAvatarSubtitle] = useState('');
  const [avatarType, setAvatarType] = useState('robot'); // 'robot' | 'female_video' | 'male_video'
  const [isMuted, setIsMuted] = useState(false);

  // 1. Load Session & Questions with Immediate Hydration
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      setError('');

      // Check navigation location state or sessionStorage first
      const navCached = location.state || {};
      let initialSession = navCached.session;
      let initialQuestions = navCached.questions || initialSession?.questions;

      if (!initialSession || !initialQuestions || initialQuestions.length === 0) {
        try {
          const rawStored = sessionStorage.getItem('current_interview_session');
          if (rawStored) {
            const parsed = JSON.parse(rawStored);
            if (parsed.sessionId === sessionId) {
              initialSession = parsed.session;
              initialQuestions = parsed.questions || initialSession?.questions;
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (initialSession && isMounted) {
        setSession(initialSession);
      }
      if (initialQuestions && initialQuestions.length > 0 && isMounted) {
        setQuestions(initialQuestions);
        setLoading(false);
      }

      try {
        const res = await interviewService.getById(sessionId);
        if (!isMounted) return;
        const data = res.data?.data || res.data;
        setSession(data);

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          // Set initial question answer if already submitted
          const currentQ = data.questions[0];
          if (currentQ?.answer?.feedback) {
            setEvalResult(currentQ.answer.feedback);
            setAnswerText(currentQ.answer.answerText || '');
          }
        } else if (!initialQuestions || initialQuestions.length === 0) {
          // Trigger question generation if none exist
          setGenerating(true);
          const genRes = await interviewService.generateQuestions(sessionId);
          if (!isMounted) return;
          const genData = genRes.data?.data || genRes.data;
          setQuestions(genData.questions || []);
          setGenerating(false);
        }
      } catch (err) {
        if (!isMounted) return;
        if (!initialQuestions || initialQuestions.length === 0) {
          setError(
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load interview session.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (sessionId) loadSession();

    return () => {
      isMounted = false;
      voiceService.stopSpeaking();
      voiceService.stopListening();
    };
  }, [sessionId, location.state]);

  // Current Active Question & Progression
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = session?.totalQuestions || session?.questionCount || questions.length || 5;
  const isLastQuestion = currentIndex >= totalQuestions - 1;
  const isQuestionAnswered = Boolean(currentQuestion?.answer?.feedback || evalResult);

  // 2. Avatar Speaks Current Question aloud when it loads
  useEffect(() => {
    if (currentQuestion && !isQuestionAnswered && !isMuted) {
      setAvatarState('speaking');
      setAvatarSubtitle(currentQuestion.questionText);

      voiceService.speak(currentQuestion.questionText, {
        onStart: () => setAvatarState('speaking'),
        onEnd: () => {
          setAvatarState('idle');
          setAvatarSubtitle('');
        },
      });
    }
  }, [currentQuestion?.id, isQuestionAnswered, isMuted]);

  // 3. Microphone STT Toggle
  const toggleRecording = () => {
    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
      setAvatarState('idle');
    } else {
      voiceService.stopSpeaking();
      setAvatarState('listening');
      setAvatarSubtitle('Listening to your spoken answer...');
      setIsRecording(true);

      voiceService.startListening({
        onResult: (finalText) => {
          setAnswerText((prev) => (prev ? `${prev} ${finalText}` : finalText));
        },
        onInterim: (interimText) => {
          setAvatarSubtitle(`Listening: "${interimText}"`);
        },
        onError: () => {
          setIsRecording(false);
          setAvatarState('idle');
        },
        onEnd: () => {
          setIsRecording(false);
          setAvatarState('idle');
        },
      });
    }
  };

  // 4. Submit Answer & Trigger Gemini Evaluation
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    // Stop recording and speaking
    voiceService.stopListening();
    voiceService.stopSpeaking();
    setIsRecording(false);

    setSubmitting(true);
    setAvatarState('evaluating');
    setAvatarSubtitle('Evaluating answer across Confidence, Communication, and Correctness...');

    try {
      const res = await interviewService.submitAnswer(sessionId, {
        questionId: currentQuestion.id,
        answerText: answerText.trim(),
        timeTaken: currentQuestion.timeLimit || 90,
      });

      const data = res.data?.data || res.data;
      const feedback = data.feedback || data.evalResult;

      // In adaptive mode, append the next question dynamically if provided
      let currentQuestionsList = [...questions];
      if (data.nextQuestion && !currentQuestionsList.some((q) => q.id === data.nextQuestion.id)) {
        currentQuestionsList = [...currentQuestionsList, data.nextQuestion];
      }

      // Update question in local state
      currentQuestionsList[currentIndex] = {
        ...currentQuestion,
        answer: {
          answerText: answerText.trim(),
          feedback,
        },
      };
      setQuestions(currentQuestionsList);
      setEvalResult(feedback);

      // Realtime Firestore synchronization for response
      try {
        firestoreService.saveResponse({
          interviewId: sessionId,
          questionId: currentQuestion.id,
          questionText: currentQuestion.questionText,
          userAnswer: answerText.trim(),
          feedback: feedback?.speechFeedback || feedback?.overallAssessment || feedback?.communication,
          score: feedback?.score || data?.score || 8.0,
        });
      } catch {
        /* ignore */
      }

      // Speak feedback
      const speechText = feedback?.communication || feedback?.speechFeedback || 'Answer evaluated.';
      setAvatarState('speaking');
      setAvatarSubtitle(speechText);

      if (!isMuted) {
        voiceService.speak(speechText, {
          onEnd: () => {
            setAvatarState('idle');
            setAvatarSubtitle('');
          },
        });
      } else {
        setTimeout(() => setAvatarState('idle'), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to evaluate answer.');
      setAvatarState('error');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Complete Interview & Finalize Report
  const handleFinishInterview = async () => {
    if (finishing) return;
    setFinishing(true);
    voiceService.stopSpeaking();
    voiceService.stopListening();
    setAvatarState('idle');
    setAvatarSubtitle('');

    try {
      await interviewService.complete(sessionId);
      try {
        await firestoreService.updateInterview(sessionId, {
          interviewStatus: 'completed',
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.warn('[InterviewSessionPage] Complete call warning:', err);
    } finally {
      navigate(`/report/${sessionId}`);
    }
  };

  // 6. Navigate to Next Question or Finish
  const handleNext = () => {
    voiceService.stopSpeaking();
    voiceService.stopListening();
    setAvatarState('idle');
    setAvatarSubtitle('');

    if (isLastQuestion) {
      handleFinishInterview();
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      if (nextQ?.answer?.feedback) {
        setEvalResult(nextQ.answer.feedback);
        setAnswerText(nextQ.answer.answerText || '');
      } else {
        setEvalResult(null);
        setAnswerText('');
      }
    }
  };

  const selectQuestionByIndex = (idx) => {
    voiceService.stopSpeaking();
    voiceService.stopListening();
    setIsRecording(false);
    setCurrentIndex(idx);
    const q = questions[idx];
    if (q?.answer?.feedback) {
      setEvalResult(q.answer.feedback);
      setAnswerText(q.answer.answerText || '');
    } else {
      setEvalResult(null);
      setAnswerText('');
    }
  };

  if (loading || generating || finishing) {
    return (
      <div style={fullScreenCenterStyle}>
        <div style={spinnerCardStyle}>
          <div style={spinnerStyle} />
          <h2 style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: '28px', textTransform: 'uppercase', margin: '16px 0 6px' }}>
            {finishing
              ? 'Finalizing Mock Interview Report...'
              : generating
              ? 'Crafting Personalized Questions...'
              : 'Loading Session...'}
          </h2>
          <p style={{ color: '#6B675F', fontSize: '14px', margin: 0 }}>
            {finishing
              ? 'Google Gemini is compiling your comprehensive diagnostics and interview scores.'
              : 'Google Gemini is calibrating questions against your target role.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      {/* Top Navbar */}
      <header style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={backLinkStyle}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div style={sessionMetaBadgeStyle}>
            <span style={activeDotStyle} />
            <span>{session?.roleTarget} • {session?.difficulty?.toUpperCase()}</span>
          </div>
          {(session?.round === 'simulation' || session?.interviewType === 'simulation') && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: '#FFF9E6',
                border: '1px solid #F4CF63',
                color: '#856404',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.03em',
              }}
            >
              Phase {Math.min(currentIndex + 1, 4)}: {currentQuestion?.phase || (currentIndex === 0 ? 'Screening' : currentIndex === 1 ? 'Technical' : currentIndex === 2 ? 'Coding' : 'HR')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleFinishInterview}
            disabled={finishing}
            style={finishEarlyBtnStyle}
          >
            {finishing ? 'Finalizing Report...' : 'End Interview & View Report →'}
          </button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      {/* Main Workspace (Left Column: Avatar & Timer | Right Column: Question & Answers) */}
      <div style={workspaceGridStyle}>
        {/* LEFT COLUMN */}
        <aside style={leftColStyle}>
          {/* AI Avatar */}
          <AIInterviewerAvatar
            state={avatarState}
            subtitle={avatarSubtitle}
            avatarType={avatarType}
            onToggleAvatarType={() => {
              setAvatarType((prev) => (prev === 'robot' ? 'female_video' : prev === 'female_video' ? 'male_video' : 'robot'));
            }}
            isMuted={isMuted}
            onToggleMute={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              voiceService.setMuted(nextMuted);
            }}
          />

          {/* Per-Question Circular Timer */}
          <InterviewTimer
            initialSeconds={currentQuestion?.timeLimit || 90}
            isPaused={isQuestionAnswered || submitting}
            keyReset={currentQuestion?.id || 0}
            onExpire={() => {
              if (!isQuestionAnswered && !submitting) {
                handleSubmitAnswer();
              }
            }}
          />
        </aside>

        {/* RIGHT COLUMN */}
        <main style={rightColStyle}>
          {/* Question Navigation Pills */}
          <div style={pillsRowStyle}>
            {questions.map((q, idx) => {
              const isAnswered = Boolean(q.answer?.feedback);
              const isActive = idx === currentIndex;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => selectQuestionByIndex(idx)}
                  style={{
                    ...pillBtnStyle,
                    ...(isActive ? pillActiveStyle : isAnswered ? pillDoneStyle : {}),
                  }}
                >
                  {isAnswered ? '✓ ' : ''}Q{idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Display Card */}
          <div style={cardStyle}>
            <div style={questionHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={questionBadgeStyle}>
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span style={topicBadgeStyle}>{currentQuestion?.topic || 'Core Concept'}</span>
              </div>
              <span style={diffBadgeStyle}>{currentQuestion?.difficulty || 'Medium'}</span>
            </div>

            <h2 style={questionTextStyle}>
              {currentQuestion?.questionText}
            </h2>

            {/* Answer Input Area */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={inputLabelStyle}>Your Response</label>
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isQuestionAnswered || submitting}
                  style={{
                    ...recordBtnStyle,
                    ...(isRecording ? recordBtnActiveStyle : {}),
                  }}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isRecording ? 'Stop Recording' : 'Voice Dictate'}</span>
                </button>
              </div>

              <textarea
                rows={6}
                placeholder={isRecording ? 'Listening... speak clearly into your microphone.' : 'Type your answer here or click "Voice Dictate" to speak aloud...'}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                disabled={isQuestionAnswered || submitting}
                style={textareaStyle}
              />

              {/* Submit or Next Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
                {!isQuestionAnswered ? (
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answerText.trim()}
                    style={submitBtnStyle}
                  >
                    {submitting ? 'AI Scoring...' : 'Submit Answer →'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={nextBtnStyle}
                  >
                    {isLastQuestion ? 'View Final Report ↗' : 'Next Question →'}
                  </button>
                )}
              </div>
            </div>

            {/* Inline AI Feedback Card */}
            {evalResult && (
              <div style={feedbackContainerStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#FF5A1F" />
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>Gemini AI Evaluation</span>
                  </div>
                  <div style={scoreCircleStyle}>
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>{evalResult.score ?? evalResult.overallScore ?? 7.5}</span>
                    <span style={{ fontSize: '10px', color: '#6B675F' }}>/ 10</span>
                  </div>
                </div>

                {/* 3 Elevo Metric Bars */}
                <div style={metricsGridStyle}>
                  <div style={metricBoxStyle}>
                    <span style={metricLabelStyle}>Confidence</span>
                    <span style={metricValStyle}>{evalResult.confidenceScore ?? 8.0}/10</span>
                  </div>
                  <div style={metricBoxStyle}>
                    <span style={metricLabelStyle}>Communication</span>
                    <span style={metricValStyle}>{evalResult.communicationScore ?? 7.5}/10</span>
                  </div>
                  <div style={metricBoxStyle}>
                    <span style={metricLabelStyle}>Correctness</span>
                    <span style={metricValStyle}>{evalResult.correctnessScore ?? 7.0}/10</span>
                  </div>
                </div>

                {/* Detailed Qualitative Feedback */}
                <div style={{ marginTop: '14px', fontSize: '13px', lineHeight: '1.5', color: '#0A0A0A' }}>
                  <p style={{ margin: '0 0 6px' }}><b>Technical Accuracy:</b> {evalResult.correctness || evalResult.technicalAccuracy}</p>
                  {evalResult.communication && (
                    <p style={{ margin: '0 0 6px' }}><b>Interviewer Note:</b> {evalResult.communication}</p>
                  )}
                  {evalResult.improvements && evalResult.improvements.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <b>Suggested Refinements:</b>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                        {evalResult.improvements.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Inline Styles adhering to InterviewPilot Palette ────────────────────────
const pageContainerStyle = {
  minHeight: '100vh',
  background: '#F2EEE6',
  color: '#0A0A0A',
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  padding: '20px clamp(16px, 3vw, 40px)',
  boxSizing: 'border-box',
};

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '20px',
  borderBottom: '1px solid #E3DED2',
  marginBottom: '24px',
};

const backLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: '#6B675F',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600',
};

const sessionMetaBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: '#FFFFFF',
  padding: '6px 14px',
  borderRadius: '999px',
  border: '1px solid #E3DED2',
  fontSize: '13px',
  fontWeight: '600',
};

const activeDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#FF5A1F',
};

const finishEarlyBtnStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  padding: '8px 16px',
  borderRadius: '999px',
  font: 'inherit',
  fontSize: '13px',
  fontWeight: '600',
  color: '#0A0A0A',
  cursor: 'pointer',
};

const workspaceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 340px) 1fr',
  gap: '24px',
  alignItems: 'start',
};

const leftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  position: 'sticky',
  top: '20px',
};

const rightColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const pillsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
};

const pillBtnStyle = {
  padding: '6px 14px',
  borderRadius: '999px',
  border: '1px solid #E3DED2',
  background: '#FFFFFF',
  font: 'inherit',
  fontSize: '13px',
  fontWeight: '600',
  color: '#6B675F',
  cursor: 'pointer',
};

const pillActiveStyle = {
  background: '#0A0A0A',
  color: '#F2EEE6',
  borderColor: '#0A0A0A',
};

const pillDoneStyle = {
  background: '#F4CF63',
  color: '#0A0A0A',
  borderColor: '#F4CF63',
};

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
};

const questionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '14px',
};

const questionBadgeStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#0A0A0A',
};

const topicBadgeStyle = {
  fontSize: '12px',
  padding: '3px 10px',
  borderRadius: '6px',
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  color: '#6B675F',
};

const diffBadgeStyle = {
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  padding: '4px 10px',
  borderRadius: '999px',
  background: '#F4CF63',
  color: '#0A0A0A',
};

const questionTextStyle = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: '22px',
  lineHeight: '1.4',
  fontWeight: '700',
  margin: '0 0 16px',
  color: '#0A0A0A',
};

const inputLabelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#0A0A0A',
};

const recordBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '999px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  font: 'inherit',
  fontSize: '12px',
  fontWeight: '600',
  color: '#0A0A0A',
  cursor: 'pointer',
};

const recordBtnActiveStyle = {
  background: '#FBEBED',
  borderColor: '#EC4F5F',
  color: '#EC4F5F',
};

const textareaStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '12px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  font: 'inherit',
  fontSize: '14px',
  color: '#0A0A0A',
  boxSizing: 'border-box',
  outline: 'none',
  resize: 'vertical',
  lineHeight: '1.6',
};

const submitBtnStyle = {
  padding: '12px 24px',
  borderRadius: '999px',
  background: '#0A0A0A',
  color: '#F2EEE6',
  border: 'none',
  font: 'inherit',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
};

const nextBtnStyle = {
  padding: '12px 24px',
  borderRadius: '999px',
  background: '#F4CF63',
  color: '#0A0A0A',
  border: 'none',
  font: 'inherit',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
};

const feedbackContainerStyle = {
  marginTop: '24px',
  padding: '20px',
  borderRadius: '16px',
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
};

const scoreCircleStyle = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '2px',
  background: '#F4CF63',
  padding: '6px 14px',
  borderRadius: '999px',
  color: '#0A0A0A',
};

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '10px',
};

const metricBoxStyle = {
  background: '#FFFFFF',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #E3DED2',
  textAlign: 'center',
};

const metricLabelStyle = {
  display: 'block',
  fontSize: '11px',
  color: '#6B675F',
  fontWeight: '500',
};

const metricValStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#0A0A0A',
};

const fullScreenCenterStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#F2EEE6',
  padding: '20px',
};

const spinnerCardStyle = {
  background: '#FFFFFF',
  padding: '36px',
  borderRadius: '24px',
  border: '1px solid #E3DED2',
  textAlign: 'center',
  maxWidth: '420px',
};

const spinnerStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: '3px solid #E3DED2',
  borderTopColor: '#FF5A1F',
  animation: 'spin 1s linear infinite',
  margin: '0 auto',
};

const errorStyle = {
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#FBEBED',
  color: '#EC4F5F',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '16px',
};
