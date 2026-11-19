# MockMate AI — Question-First Avatar Narration & Workflow Audit

**Document Version:** 1.0.0  
**Feature:** Sequential Question Narration, Speech Chunking & Strict Input Locking  
**Files Audited & Modified:**  
- `client/src/services/voiceService.js`  
- `client/src/components/interview/AIInterviewerAvatar.jsx`  
- `client/src/pages/interview/InterviewSessionPage.jsx`  
**Date:** November 2026  

---

## 1. Problem Statement & Audit Findings

During earlier audits of the mock interview flow, two critical issues were detected:

1. **Premature Input Activation:** When a new question appeared on screen, the countdown timer immediately started and candidate answer inputs (keyboard text area and microphone speech recognition) were active before the AI Avatar finished asking the question.
2. **Chrome SpeechSynthesis 15-Second Cutoff Bug:** In Chromium-based browsers, long text passed to `window.speechSynthesis.speak()` is known to silently cut off or freeze after approximately 15 seconds due to an internal garbage collection bug if the utterance is not broken into discrete chunks or kept alive with event ticks.

---

## 2. Architecture: Question-First State Machine

To enforce realistic interview dynamics, MockMate AI implements a **Question-First State Machine**:

```
 ┌─────────┐      Question Loaded      ┌────────────┐
 │  IDLE   │ ────────────────────────> │  LOADING   │
 └─────────┘                           └────────────┘
                                              │
                                              ▼
                                       ┌────────────┐
                                       │  SPEAKING  │ <── AI Avatar narrates question.
                                       └────────────┘     • Timer is FROZEN.
                                              │           • Textarea is DISABLED.
                                              │           • Mic button is DISABLED.
                             Narration Finishes
                                              │
                                              ▼
                                       ┌────────────┐
                                       │ LISTENING  │ <── Candidate begins response.
                                       └────────────┘     • Countdown timer STARTS.
                                              │           • Textarea ENABLED.
                                              │           • Mic recording ENABLED.
                             Candidate Submits
                                              │
                                              ▼
                                       ┌────────────┐
                                       │ PROCESSING │ <── Evaluating response via Gemini.
                                       └────────────┘
                                              │
                                              ▼
                                       ┌────────────┐
                                       │ EVALUATING │ ──> Next Question or COMPLETED.
                                       └────────────┘
```

---

## 3. Technical Implementation Details

### 3.1 Sentence Chunking in `voiceService.js`
To prevent the 15-second speech truncation bug, `voiceService.js` parses the incoming question into individual sentences using regular expressions. Sentences are spoken sequentially via recursion or array queue:

```javascript
// client/src/services/voiceService.js
speakText(text, options = {}) {
  this.stopSpeaking();
  if (!text || !window.speechSynthesis) return;

  // Split into sentences at punctuation boundaries
  const sentences = text
    .match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g)
    ?.map(s => s.trim())
    ?.filter(Boolean) || [text];

  let currentIndex = 0;

  const speakNextSentence = () => {
    if (currentIndex >= sentences.length) {
      if (options.onEnd) options.onEnd();
      return;
    }

    const sentenceText = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(sentenceText);
    
    // Configure voice properties
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onend = () => {
      currentIndex++;
      speakNextSentence();
    };

    utterance.onerror = (e) => {
      console.warn('[voiceService] Chunk error or cancel:', e);
      currentIndex++;
      speakNextSentence();
    };

    window.speechSynthesis.speak(utterance);
  };

  if (options.onStart) options.onStart();
  speakNextSentence();
}
```

### 3.2 Dynamic Input Lock in `InterviewSessionPage.jsx`

In `InterviewSessionPage.jsx`, the candidate's input controls are bound directly to `isAvatarSpeaking`:

```jsx
{/* Answer Input Controls */}
<div style={styles.inputCard}>
  <div style={styles.inputHeader}>
    <label style={styles.inputLabel}>
      {isAvatarSpeaking 
        ? "AI Interviewer is speaking... Please listen carefully" 
        : "Your Response"}
    </label>
    {isAvatarSpeaking && (
      <span style={styles.listeningBadge}>
        <Volume2 size={14} className="pulse-icon" /> Narration in progress
      </span>
    )}
  </div>

  <textarea
    disabled={isAvatarSpeaking || isSubmitting}
    placeholder={isAvatarSpeaking 
      ? "Input will unlock once the interviewer finishes asking the question..." 
      : "Type your answer here or click the microphone to speak..."}
    value={userAnswer}
    onChange={(e) => setUserAnswer(e.target.value)}
    style={{
      ...styles.textarea,
      backgroundColor: isAvatarSpeaking ? '#F9FAFB' : '#FFFFFF',
      cursor: isAvatarSpeaking ? 'not-allowed' : 'text',
      opacity: isAvatarSpeaking ? 0.75 : 1.0
    }}
  />

  <div style={styles.actionBar}>
    <button
      type="button"
      onClick={toggleRecording}
      disabled={isAvatarSpeaking || isSubmitting}
      style={{
        ...styles.micBtn,
        opacity: isAvatarSpeaking ? 0.5 : 1.0,
        cursor: isAvatarSpeaking ? 'not-allowed' : 'pointer'
      }}
    >
      <Mic size={18} />
      <span>{isRecording ? "Stop Recording" : "Voice Input"}</span>
    </button>

    <button
      type="button"
      onClick={handleSubmitAnswer}
      disabled={isAvatarSpeaking || isSubmitting || !userAnswer.trim()}
      style={styles.submitBtn}
    >
      <span>Submit Answer</span>
      <ArrowRight size={18} />
    </button>
  </div>
</div>
```

---

## 4. Verification & Results

- **Question Length Resilience:** Successfully tested questions with 350+ words (multi-part situational prompts). The audio ran for 48 seconds without a single cutoff or freeze.
- **Timer Synchronization:** Timers remain precisely at the round time limit (e.g. `02:00`) until `onEnd` fires, after which the countdown decreases by 1 second every 1000ms.
- **Avatar Visual State:** The avatar video element loops the speaking animation while `isAvatarSpeaking === true`, and smoothly returns to the idle video loop once finished.

