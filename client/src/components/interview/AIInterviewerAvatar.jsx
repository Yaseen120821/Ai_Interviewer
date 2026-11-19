// client/src/components/interview/AIInterviewerAvatar.jsx
// Interactive AI Interviewer Avatar featuring realistic AI video avatars (female-ai.mp4, male-ai.mp4)
// and the signature MockMate animated SVG robot.
// Supports Idle, Listening, Speaking, Thinking, Evaluating, and Error states.

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RefreshCw, Sparkles, User, Video, Bot } from 'lucide-react';
import femaleVideo from '../../assets/videos/female-ai.mp4';
import maleVideo from '../../assets/videos/male-ai.mp4';

export default function AIInterviewerAvatar({
  state = 'idle', // 'idle' | 'speaking' | 'listening' | 'thinking' | 'evaluating' | 'error'
  subtitle = '',
  avatarType = 'female_video', // Default: realistic video interviewer ('female_video' | 'male_video' | 'robot')
  onToggleAvatarType,
  isMuted = false,
  onToggleMute,
}) {
  const videoRef = useRef(null);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Synchronize video playback with avatar state
  useEffect(() => {
    if (avatarType !== 'robot' && videoRef.current && !videoError) {
      const v = videoRef.current;
      if (state === 'speaking') {
        v.play().catch(() => {});
      } else if (state === 'listening' || state === 'evaluating' || state === 'thinking') {
        // Play at half speed or keep loop playing smoothly
        v.play().catch(() => {});
      } else {
        // Idle
        v.play().catch(() => {});
      }
    }
  }, [state, avatarType, videoError]);

  // Mouth animation during SVG robot speaking state
  useEffect(() => {
    let interval;
    if (avatarType === 'robot' && state === 'speaking') {
      interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 180);
    }
    return () => {
      clearInterval(interval);
      setMouthOpen(false);
    };
  }, [state, avatarType]);

  const normalizedState = (state || 'idle').toLowerCase();

  const stateLabels = {
    idle: 'Ready & Waiting',
    loading: 'Loading Interview Session...',
    speaking: 'Interviewer is Speaking...',
    listening: 'Listening to Candidate...',
    thinking: 'Synthesizing Next Question...',
    processing: 'Evaluating Answer with Gemini...',
    evaluating: 'Evaluating Answer with Gemini...',
    error: 'Audio Connection Paused',
    completed: 'Interview Session Completed',
  };

  const stateBadges = {
    idle: { bg: '#E3DED2', color: '#0A0A0A' },
    loading: { bg: '#E3DED2', color: '#0A0A0A' },
    speaking: { bg: '#F4CF63', color: '#0A0A0A' },
    listening: { bg: '#4ADE80', color: '#0A0A0A' },
    thinking: { bg: '#FF5A1F', color: '#FFFFFF' },
    processing: { bg: '#60A5FA', color: '#FFFFFF' },
    evaluating: { bg: '#60A5FA', color: '#FFFFFF' },
    error: { bg: '#EC4F5F', color: '#FFFFFF' },
    completed: { bg: '#1E7E34', color: '#FFFFFF' },
  };

  const badgeStyle = stateBadges[normalizedState] || stateBadges.idle;
  const currentVideoSrc = avatarType === 'male_video' ? maleVideo : femaleVideo;
  const useVideo = (avatarType === 'female_video' || avatarType === 'male_video') && !videoError;

  return (
    <div style={containerStyle}>
      {/* Top Header Controls */}
      <div style={headerStyle}>
        <div style={{ ...statusBadgeStyle, background: badgeStyle.bg, color: badgeStyle.color }}>
          <span style={dotStyle(normalizedState === 'speaking' || normalizedState === 'listening' || normalizedState === 'evaluating' || normalizedState === 'processing')} />
          {stateLabels[normalizedState] || stateLabels.idle}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              style={iconBtnStyle}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}

          {onToggleAvatarType && (
            <button
              type="button"
              onClick={onToggleAvatarType}
              style={{ ...iconBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' }}
              title="Switch between Female AI, Male AI, or Robot avatar"
            >
              {avatarType === 'female_video' ? (
                <><span>Female AI</span> <RefreshCw size={12} /></>
              ) : avatarType === 'male_video' ? (
                <><span>Male AI</span> <RefreshCw size={12} /></>
              ) : (
                <><span>Robot</span> <RefreshCw size={12} /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Avatar Stage */}
      <div style={stageStyle}>
        {useVideo ? (
          <div style={videoWrapperStyle}>
            {/* Listening / Speaking active halo ring */}
            {state === 'speaking' && <div style={speakingHaloStyle} />}
            {state === 'listening' && <div style={listeningHaloStyle} />}

            <video
              ref={videoRef}
              key={currentVideoSrc}
              src={currentVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={() => {
                setIsVideoLoaded(true);
                setVideoError(false);
                videoRef.current?.play().catch(() => {});
              }}
              onError={(e) => {
                console.warn('[AIInterviewerAvatar] Video failed to load, falling back to SVG robot avatar:', e);
                setVideoError(true);
              }}
              style={videoElementStyle}
            />

            {/* Video overlay badge */}
            <div style={videoOverlayBadgeStyle}>
              <Video size={12} />
              <span>{avatarType === 'male_video' ? 'AI Interviewer (Alex)' : 'AI Interviewer (Sarah)'}</span>
            </div>
          </div>
        ) : (
          /* Signature MockMate Animated SVG Robot (Primary or Fallback) */
          <div style={robotWrapperStyle(state)}>
            {state === 'listening' && <div style={soundwavesRingStyle} />}

            <svg viewBox="0 0 400 450" style={svgRobotStyle}>
              <ellipse cx="200" cy="428" rx="105" ry="12" fill="#0A0A0A" opacity="0.16" />

              {/* Antenna */}
              <line x1="200" y1="62" x2="200" y2="92" stroke="#0A0A0A" strokeWidth="6" />
              <circle
                cx="200"
                cy="54"
                r={state === 'thinking' || state === 'evaluating' ? 15 : 12}
                fill={state === 'speaking' ? '#F4CF63' : state === 'listening' ? '#4ADE80' : state === 'evaluating' ? '#60A5FA' : '#FF5A1F'}
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

              {/* Head */}
              <rect x="88" y="92" width="224" height="176" rx="42" fill="#F4CF63" stroke="#0A0A0A" strokeWidth="6" />

              {/* Visor / Face Screen */}
              <rect x="114" y="122" width="172" height="116" rx="26" fill="#0A0A0A" />

              {/* Eyes */}
              {state === 'evaluating' || state === 'thinking' ? (
                <>
                  <circle cx="156" cy="165" r="14" fill="#60A5FA" />
                  <circle cx="244" cy="165" r="14" fill="#60A5FA" />
                </>
              ) : state === 'listening' ? (
                <>
                  <rect x="142" y="162" width="28" height="8" rx="4" fill="#4ADE80" />
                  <rect x="230" y="162" width="28" height="8" rx="4" fill="#4ADE80" />
                </>
              ) : (
                <>
                  <circle cx="156" cy="165" r="15" fill="#F2EEE6" />
                  <circle cx="244" cy="165" r="15" fill="#F2EEE6" />
                  <circle cx={mouthOpen ? 158 : 156} cy={mouthOpen ? 166 : 165} r="7" fill="#0A0A0A" />
                  <circle cx={mouthOpen ? 246 : 244} cy={mouthOpen ? 246 : 165} r="7" fill="#0A0A0A" />
                </>
              )}

              {/* Mouth */}
              {mouthOpen ? (
                <rect x="174" y="198" width="52" height="18" rx="9" fill="#FF5A1F" stroke="#F2EEE6" strokeWidth="3" />
              ) : (
                <line x1="176" y1="206" x2="224" y2="206" stroke="#F2EEE6" strokeWidth="5" strokeLinecap="round" />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Realtime Spoken Subtitle Caption */}
      {subtitle && (
        <div style={subtitleBoxStyle}>
          <p style={subtitleTextStyle}>"{subtitle}"</p>
        </div>
      )}
    </div>
  );
}

// ── Styles adhering to MockMate AI Brand System ───────────────────────────
const containerStyle = {
  background: '#FFFFFF',
  border: '1px solid #E3DED2',
  borderRadius: '20px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const statusBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '0.02em',
  transition: 'all 0.2s ease',
};

const dotStyle = (isPulsing) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'currentColor',
  display: 'inline-block',
  animation: isPulsing ? 'pulse 1.2s infinite' : 'none',
});

const iconBtnStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  borderRadius: '8px',
  padding: '6px 10px',
  cursor: 'pointer',
  color: '#0A0A0A',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

const stageStyle = {
  width: '100%',
  minHeight: '260px',
  maxHeight: '340px',
  background: '#0A0A0A',
  borderRadius: '16px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

const videoWrapperStyle = {
  width: '100%',
  height: '100%',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const videoElementStyle = {
  width: '100%',
  height: '100%',
  maxHeight: '340px',
  objectFit: 'cover',
  display: 'block',
};

const speakingHaloStyle = {
  position: 'absolute',
  inset: 0,
  border: '3px solid #F4CF63',
  borderRadius: '16px',
  pointerEvents: 'none',
  boxShadow: 'inset 0 0 20px rgba(244, 207, 99, 0.4)',
  zIndex: 2,
};

const listeningHaloStyle = {
  position: 'absolute',
  inset: 0,
  border: '3px solid #4ADE80',
  borderRadius: '16px',
  pointerEvents: 'none',
  boxShadow: 'inset 0 0 20px rgba(74, 222, 128, 0.4)',
  zIndex: 2,
};

const videoOverlayBadgeStyle = {
  position: 'absolute',
  bottom: '10px',
  left: '12px',
  background: 'rgba(10, 10, 10, 0.75)',
  backdropFilter: 'blur(4px)',
  color: '#FFFFFF',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  zIndex: 3,
};

const robotWrapperStyle = (state) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  background: '#F2EEE6',
  padding: '12px',
});

const soundwavesRingStyle = {
  position: 'absolute',
  width: '240px',
  height: '240px',
  borderRadius: '50%',
  border: '2px solid rgba(74, 222, 128, 0.5)',
  animation: 'pulse 1.5s infinite',
  pointerEvents: 'none',
};

const svgRobotStyle = {
  width: '100%',
  maxWidth: '220px',
  height: 'auto',
  display: 'block',
};

const subtitleBoxStyle = {
  background: '#FBFAF7',
  border: '1px solid #E3DED2',
  borderRadius: '12px',
  padding: '10px 14px',
};

const subtitleTextStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#0A0A0A',
  lineHeight: '1.45',
  textAlign: 'center',
  fontWeight: '500',
  fontStyle: 'italic',
};
