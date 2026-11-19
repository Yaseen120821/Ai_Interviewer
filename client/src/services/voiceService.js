// client/src/services/voiceService.js
// Text-to-Speech (TTS) and Speech-to-Text (STT) engine for MockMate AI.
// Features: Question chunking to prevent Chrome 15s speech timeout, pause/resume, echo prevention, and natural voices.

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.isPaused = false;
    this.speechRate = 1.0;
    this.selectedVoice = null;
    this.muted = false;
    this.activeUtterances = [];

    if (this.synth) {
      // Preload voices
      this.synth.onvoiceschanged = () => {
        this.selectedVoice = this.pickNaturalVoice();
      };
    }

    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  isSpeakingSupported() {
    return Boolean(this.synth);
  }

  isListeningSupported() {
    return Boolean(this.recognition);
  }

  getVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  pickNaturalVoice() {
    const voices = this.getVoices();
    return voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Jenny') || v.name.includes('Guy')) && v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en')) || null;
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted && this.isSpeaking) {
      this.stopSpeaking();
    }
  }

  setSpeechRate(rate) {
    this.speechRate = Math.max(0.7, Math.min(1.5, rate));
  }

  splitIntoSentences(text) {
    if (!text) return [];
    const cleanText = text
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split on sentence boundaries (. ! ? ; or newline)
    const matches = cleanText.match(/[^.!?;\n]+[.!?;\n]+/g);
    if (!matches || matches.length === 0) {
      return [cleanText];
    }
    return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  /**
   * Speak question text aloud without truncation or Chrome 15-second hang.
   * Splits into natural sentence chunks and speaks sequentially.
   */
  speak(text, { onStart, onEnd, onError } = {}) {
    if (!this.synth || this.muted || !text || text.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    // Stop mic and cancel previous speech
    this.stopListening();
    this.stopSpeaking();

    const chunks = this.splitIntoSentences(text);
    if (chunks.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    this.isSpeaking = true;
    this.isPaused = false;
    let chunkIndex = 0;
    let hasStarted = false;

    const speakNextChunk = () => {
      if (!this.isSpeaking || chunkIndex >= chunks.length) {
        this.isSpeaking = false;
        if (onEnd) onEnd();
        return;
      }

      const chunkText = chunks[chunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = this.speechRate;
      utterance.pitch = 1.0;

      const voice = this.selectedVoice || this.pickNaturalVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        if (!hasStarted) {
          hasStarted = true;
          if (onStart) onStart();
        }
      };

      utterance.onend = () => {
        chunkIndex++;
        speakNextChunk();
      };

      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are expected when user navigates or stops
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[voiceService] TTS chunk error:', e.error);
          if (onError) onError(e);
        }
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('[voiceService] Synth speak failed:', err);
        this.isSpeaking = false;
        if (onEnd) onEnd();
      }
    };

    speakNextChunk();
  }

  pauseSpeaking() {
    if (this.synth && this.isSpeaking) {
      try {
        this.synth.pause();
        this.isPaused = true;
      } catch { /* ignore */ }
    }
  }

  resumeSpeaking() {
    if (this.synth && this.isPaused) {
      try {
        this.synth.resume();
        this.isPaused = false;
      } catch { /* ignore */ }
    }
  }

  stopSpeaking() {
    this.isSpeaking = false;
    this.isPaused = false;
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch { /* ignore */ }
    }
  }

  /**
   * Activate microphone speech recognition.
   * Strictly verifies AI is NOT currently speaking before starting.
   */
  startListening({ onResult, onInterim, onError, onEnd } = {}) {
    if (!this.recognition || this.isListening) return;

    if (this.isSpeaking) {
      console.warn('[voiceService] Cannot activate microphone while AI is speaking.');
      return;
    }

    try {
      this.isListening = true;

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript && onResult) {
          onResult(finalTranscript.trim());
        }
        if (interimTranscript && onInterim) {
          onInterim(interimTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('[voiceService] SpeechRecognition error:', event.error);
        }
        if (onError) onError(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (onError) onError(err);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
    }
    this.isListening = false;
  }
}

export const voiceService = new VoiceService();
