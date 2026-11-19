// client/src/components/interview/InterviewTimer.jsx
// Circular countdown timer with SVG ring, warning thresholds, and automatic submission trigger.

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function InterviewTimer({
  initialSeconds = 90,
  onExpire,
  isPaused = false,
  keyReset = 0, // change key to reset timer for a new question
}) {
  const [prevReset, setPrevReset] = useState({ initialSeconds, keyReset });
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  if (prevReset.keyReset !== keyReset || prevReset.initialSeconds !== initialSeconds) {
    setPrevReset({ initialSeconds, keyReset });
    setTimeLeft(initialSeconds);
  }

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, onExpire]);

  const percentage = Math.max(0, (timeLeft / initialSeconds) * 100);
  const isWarning = timeLeft <= 15 && timeLeft > 0;
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  const strokeColor = isUrgent ? '#EC4F5F' : isWarning ? '#FF5A1F' : '#0A0A0A';

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div style={containerStyle}>
      <div style={svgWrapStyle}>
        <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="transparent"
            stroke="#E3DED2"
            strokeWidth="5"
          />
          {/* Animated Value Stroke */}
          <circle
            cx="34"
            cy="34"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>

        <div style={timeLabelStyle}>
          <span style={{ ...timeTextStyle, color: strokeColor }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div style={textLabelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B675F', fontWeight: '500' }}>
          <Clock size={12} />
          <span>TIME REMAINING</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: isWarning ? strokeColor : '#0A0A0A' }}>
          {isUrgent ? 'Submitting soon!' : isWarning ? 'Time running low' : 'Pace your response'}
        </span>
      </div>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  background: '#FFFFFF',
  padding: '12px 16px',
  borderRadius: '16px',
  border: '1px solid #E3DED2',
};

const svgWrapStyle = {
  position: 'relative',
  width: '68px',
  height: '68px',
  display: 'grid',
  placeItems: 'center',
};

const timeLabelStyle = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
};

const timeTextStyle = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontSize: '14px',
  fontWeight: '700',
  letterSpacing: '-0.02em',
};

const textLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

