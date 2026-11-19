// client/src/services/voiceService.js
// Text-to-Speech (TTS) and Speech-to-Text (STT) engine with echo prevention and voice controls.

class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.speechRate = 1.0;
    this.selectedVoice = null;
    this.muted = false;

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

  setMuted(muted) {
    this.muted = muted;
    if (muted && this.isSpeaking) {
      this.stopSpeaking();
    }
  }

  setSpeechRate(rate) {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Speak text aloud using SpeechSynthesis.
   * Ensures microphone is stopped before speaking to avoid echo.
   */
  speak(text, { onStart, onEnd, onError } = {}) {
    if (!this.synth || this.muted || !text || text.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    // CRITICAL: Stop microphone to prevent recording AI speech
    this.stopListening();
    this.synth.cancel();

    // Clean text of markdown backticks, asterisks, or braces
    const cleanText = text
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.speechRate;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = this.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
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

