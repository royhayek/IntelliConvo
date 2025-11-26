import { WidgetSettings } from '../types';

export interface TextToSpeechHandlerDependencies {
  settings: WidgetSettings | null;
}

/**
 * Handles text-to-speech output using Web Speech API
 */
export class TextToSpeechHandler {
  private dependencies: TextToSpeechHandlerDependencies;
  private synthesis: SpeechSynthesis;
  private isSpeaking: boolean = false;
  private messageQueue: string[] = [];

  constructor(dependencies: TextToSpeechHandlerDependencies) {
    this.dependencies = dependencies;
    this.synthesis = window.speechSynthesis;
  }

  /**
   * Speaks the given text using text-to-speech
   */
  public speak(text: string, options?: { interrupt?: boolean }): void {
    if (!this.isSupported()) {
      console.warn('Text-to-speech not supported in this browser');
      return;
    }

    // If interrupt is true, stop current speech
    if (options?.interrupt && this.isSpeaking) {
      this.stop();
    }

    // Clean the text (remove markdown formatting)
    const cleanText = this.cleanTextForSpeech(text);

    if (!cleanText.trim()) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Configure utterance
    utterance.lang = this.dependencies.settings?.voiceOutputLanguage || 'en-US';
    utterance.rate = this.dependencies.settings?.voiceOutputRate || 1.0;
    utterance.pitch = this.dependencies.settings?.voiceOutputPitch || 1.0;
    utterance.volume = this.dependencies.settings?.voiceOutputVolume || 1.0;

    // Set voice if available
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = this.dependencies.settings?.voiceOutputVoice;
      if (preferredVoice) {
        const voice = voices.find(v => v.name === preferredVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }
    }

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateSpeakingIndicator(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.updateSpeakingIndicator(false);

      // Speak next message in queue if any
      if (this.messageQueue.length > 0) {
        const nextMessage = this.messageQueue.shift();
        if (nextMessage) {
          setTimeout(() => this.speak(nextMessage), 100);
        }
      }
    };

    utterance.onerror = (event) => {
      console.error('Text-to-speech error:', event);
      this.isSpeaking = false;
      this.updateSpeakingIndicator(false);
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Queues text to be spoken after current speech finishes
   */
  public queue(text: string): void {
    if (!this.isSupported()) {
      return;
    }

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText.trim()) {
      return;
    }

    if (this.isSpeaking) {
      this.messageQueue.push(cleanText);
    } else {
      this.speak(cleanText);
    }
  }

  /**
   * Stops current speech
   */
  public stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.messageQueue = [];
    this.updateSpeakingIndicator(false);
  }

  /**
   * Pauses current speech
   */
  public pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resumes paused speech
   */
  public resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Checks if text-to-speech is supported
   */
  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Checks if currently speaking
   */
  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Gets available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Cleans text for speech by removing markdown and formatting
   */
  private cleanTextForSpeech(text: string): string {
    let cleaned = text;

    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, ' code block ');
    cleaned = cleaned.replace(/`[^`]+`/g, ' code ');

    // Remove links but keep link text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // Remove bold/italic markers
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

    // Remove headers
    cleaned = cleaned.replace(/^#+\s+/gm, '');

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Replace multiple spaces/newlines with single space
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned.trim();
  }

  /**
   * Updates the UI to show speaking indicator
   */
  private updateSpeakingIndicator(speaking: boolean): void {
    const indicator = document.getElementById('intelligentconvo-speaking-indicator');
    if (indicator) {
      indicator.style.display = speaking ? 'flex' : 'none';
    }

    // Update speak button if in speak mode
    const speakBtn = document.getElementById('intelligentconvo-speak-btn');
    if (speakBtn) {
      if (speaking) {
        speakBtn.classList.add('speaking');
        speakBtn.setAttribute('aria-label', 'AI is speaking...');
      } else {
        speakBtn.classList.remove('speaking');
        speakBtn.setAttribute('aria-label', 'Start speaking');
      }
    }
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    this.stop();
  }
}
