// client/src/components/interview/AIInterviewerAvatar.jsx
// Interactive AI Interviewer Avatar supporting Idle, Listening, Speaking, Thinking, Evaluating, and Error states.
// Offers both the signature InterviewPilot SVG animated robot and realistic AI video interviewer.

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, MicOff, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import femaleVideo from '../../assets/videos/female-ai.mp4';
import maleVideo from '../../assets/videos/male-ai.mp4';

export default function AIInterviewerAvatar({
  state = 'idle', // 'idle' | 'speaking' | 'listening' | 'thinking' | 'evaluating' | 'error'
  subtitle = '',
  avatarType = 'robot', // 'robot' | 'female_video' | 'male_video'
  onToggleAvatarType,
  isMuted = false,
  onToggleMute,
}) {
  const videoRef = useRef(null);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Sync video playback with speaking state
  useEffect(() => {
    if (avatarType !== 'robot' && videoRef.current) {
      if (state === 'speaking') {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [state, avatarType]);

  // Mouth animation during robot speaking state
  useEffect(() => {
    let interval;
    if (state === 'speaking') {
      interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 180);
    }
    return () => {
      clearInterval(interval);
      setMouthOpen(false);
    };
  }, [state]);

  const stateLabels = {
    idle: 'Ready & Waiting',
    speaking: 'Interviewer is Speaking...',
    listening: 'Listening to Candidate...',
    thinking: 'Synthesizing Next Question...',
    evaluating: 'Scoring Answer with Gemini...',
    error: 'Audio Connection Paused',
  };

  const stateBadges = {
    idle: { bg: '#E3DED2', color: '#0A0A0A' },
    speaking: { bg: '#F4CF63', color: '#0A0A0A' },
    listening: { bg: '#4ADE80', color: '#0A0A0A' },
    thinking: { bg: '#FF5A1F', color: '#FFFFFF' },
    evaluating: { bg: '#60A5FA', color: '#FFFFFF' },
    error: { bg: '#EC4F5F', color: '#FFFFFF' },
  };

  const badgeStyle = stateBadges[state] || stateBadges.idle;

  return (
    <div style={containerStyle}>
      {/* Top Header Controls */}
      <div style={headerStyle}>
        <div style={{ ...statusBadgeStyle, background: badgeStyle.bg, color: badgeStyle.color }}>
          <span style={dotStyle(state === 'speaking' || state === 'listening')} />
          {stateLabels[state]}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              style={iconBtnStyle}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}

          {onToggleAvatarType && (
            <button
              onClick={onToggleAvatarType}
              style={iconBtnStyle}
              title="Switch Avatar Model (Robot / Video)"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display */}
      <div style={stageStyle}>
        {avatarType === 'female_video' ? (
          <div style={videoWrapperStyle}>
            <video
              ref={videoRef}
              src={femaleVideo}
              loop
              muted
              playsInline
              style={videoElementStyle}
            />
          </div>
        ) : avatarType === 'male_video' ? (
          <div style={videoWrapperStyle}>
            <video
              ref={videoRef}
              src={maleVideo}
              loop
              muted
              playsInline
              style={videoElementStyle}
            />
          </div>
        ) : (
          /* Signature InterviewPilot Animated SVG Robot */
          <div style={robotWrapperStyle(state)}>
            {/* Listening Soundwaves Glow */}
            {state === 'listening' && <div style={soundwavesRingStyle} />}

            <svg viewBox="0 0 400 450" style={svgRobotStyle}>
              <ellipse cx="200" cy="428" rx="105" ry="12" fill="#0A0A0A" opacity="0.16" />
              
              {/* Antenna with reactive pulsing indicator */}
              <line x1="200" y1="62" x2="200" y2="92" stroke="#0A0A0A" strokeWidth="6" />
              <circle
                cx="200"
                cy="54"
                r={state === 'thinking' ? 15 : 12}
                fill={state === 'speaking' ? '#F4CF63' : state === 'listening' ? '#4ADE80' : '#FF5A1F'}
                stroke="#0A0A0A"
                strokeWidth="5"
              />

              {/* Ears */}
              <rect x="62" y="150" width="30" height="64" rx="15" fill="#FF5A1F" stroke="#0A0A0A" strokeWidth="5" />
              <rect x="308" y="150" width="30" height="64" rx="15" fill="#FF5A1F" stroke="#0A0A0A" strokeWidth="5" />

              {/* Body */}
              <rect x="132" y="268" width="136" height="120" rx="34" fill="#0A0A0A" />
              <circle cx="200" cy="318" r="14" fill="none" stroke="#F2EEE6" strokeWidth="4" />
              <rect x="150" y="360" width="100" height="10" rx="5" fill="#EC4F5F" />

              {/* Left Arm */}
              <path d="M138 296 Q96 320 104 368" fill="none" stroke="#0A0A0A" strokeWidth="22" strokeLinecap="round" />
              <circle cx="104" cy="372" r="22" fill="#F2EEE6" stroke="#0A0A0A" strokeWidth="5" />
              <circle cx="104" cy="372" r="8" fill="#FF5A1F" />

              {/* Right Arm (waving or steady) */}
              <path d="M262 292 Q316 270 322 214" fill="none" stroke="#0A0A0A" strokeWidth="22" strokeLinecap="round" />
              <circle cx="322" cy="204" r="24" fill="#F2EEE6" stroke="#0A0A0A" strokeWidth="5" />
              <circle cx="322" cy="204" r="9" fill="#FF5A1F" />

              {/* Head */}
              <rect x="82" y="92" width="236" height="186" rx="80" fill="#F2EEE6" stroke="#0A0A0A" strokeWidth="6" />
              
              {/* Face Screen */}
              <rect x="108" y="120" width="184" height="130" rx="56" fill="#0A0A0A" />

              {/* Eyes */}
              <g fill="none" stroke="#F2EEE6" strokeWidth="9" strokeLinecap="round">
                {state === 'thinking' ? (
                  <>
                    <circle cx="166" cy="180" r="10" fill="#F4CF63" stroke="none" />
                    <circle cx="234" cy="180" r="10" fill="#F4CF63" stroke="none" />
                  </>
                ) : (
                  <>
                    <path d="M150 186 Q166 166 182 186" />
                    <path d="M218 186 Q234 166 250 186" />
                  </>
                )}
              </g>

              {/* Cheeks */}
              <circle cx="146" cy="212" r="9" fill="#FF5A1F" />
              <circle cx="254" cy="212" r="9" fill="#FF5A1F" />

              {/* Animated Mouth */}
              {mouthOpen ? (
                <ellipse cx="200" cy="216" rx="14" ry="10" fill="#F2EEE6" />
              ) : (
                <path d="M184 214 Q200 230 216 214" fill="none" stroke="#F2EEE6" strokeWidth="6" strokeLinecap="round" />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Subtitle & Feedback Caption Bar */}
      <div style={subtitleBoxStyle}>
        {state === 'speaking' && (
          <div style={audioBarsStyle}>
            <span style={{ ...barStyle, animationDelay: '0ms' }} />
            <span style={{ ...barStyle, animationDelay: '150ms' }} />
            <span style={{ ...barStyle, animationDelay: '300ms' }} />
            <span style={{ ...barStyle, animationDelay: '450ms' }} />
          </div>
        )}
        <p style={subtitleTextStyle}>
          {subtitle || (state === 'listening' ? 'Listening to your response... speak clearly or type below.' : 'AI Interviewer ready.')}
        </p>
      </div>
    </div>
  );
}

// ─── Inline Styles for Self-Contained Reusability ─────────────────────────────
const containerStyle = {
  background: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid #E3DED2',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  boxSizing: 'border-box',
  width: '100%',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
};

const statusBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: '600',
  letterSpacing: '-0.01em',
};

const dotStyle = (pulse) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'currentColor',
  display: 'inline-block',
  boxShadow: pulse ? '0 0 8px currentColor' : 'none',
});

const iconBtnStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  border: '1px solid #E3DED2',
  background: '#FBFAF7',
  color: '#0A0A0A',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
};

const stageStyle = {
  minHeight: '260px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

const robotWrapperStyle = (state) => ({
  width: '240px',
  height: '270px',
  position: 'relative',
  transition: 'transform 0.3s ease',
  transform: state === 'speaking' ? 'scale(1.02)' : 'scale(1)',
});

const svgRobotStyle = {
  width: '100%',
  height: '100%',
  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.06))',
};

const soundwavesRingStyle = {
  position: 'absolute',
  inset: '-10px',
  borderRadius: '50%',
  border: '2px dashed #4ADE80',
  opacity: 0.7,
  animation: 'pulse 1.8s infinite',
};

const videoWrapperStyle = {
  width: '220px',
  height: '240px',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '2px solid #0A0A0A',
  background: '#0A0A0A',
};

const videoElementStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const subtitleBoxStyle = {
  marginTop: '16px',
  padding: '12px 16px',
  borderRadius: '12px',
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  minHeight: '48px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const subtitleTextStyle = {
  fontSize: '13px',
  lineHeight: '1.4',
  color: '#0A0A0A',
  margin: 0,
  fontWeight: '500',
};

const audioBarsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  height: '16px',
};

const barStyle = {
  width: '3px',
  height: '14px',
  background: '#FF5A1F',
  borderRadius: '2px',
  animation: 'bounce 0.6s ease infinite alternate',
};

