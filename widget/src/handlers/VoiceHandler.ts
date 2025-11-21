import { VoiceHandlerDependencies, WebKitSpeechRecognition, SpeechRecognitionEvent } from '../types';
import { WidgetError } from '../core/WidgetError';
import { WIDGET_ERRORS } from '../constants';

export class VoiceHandler {
  private dependencies: VoiceHandlerDependencies;
  private speechRecognition: WebKitSpeechRecognition | null = null;

  constructor(dependencies: VoiceHandlerDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Handles voice input using Web Speech API
   */
  public handleVoiceInput(): void {
    try {
      if (!('webkitSpeechRecognition' in window)) {
        throw new WidgetError('Speech recognition not supported in this browser', WIDGET_ERRORS.SPEECH_NOT_SUPPORTED);
      }

      // Stop any existing recognition
      if (this.speechRecognition) {
        this.speechRecognition.stop();
      }

      this.speechRecognition = new window.webkitSpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = this.dependencies.settings?.voiceInputLanguage || 'en-US';

      this.speechRecognition.onstart = () => {
        const micBtn = document.getElementById('intelligentconvo-mic');
        if (micBtn) {
          micBtn.classList.add('listening');
          micBtn.setAttribute('aria-label', 'Listening...');
        }
      };

      this.speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            this.dependencies.sendMessage(transcript);
          }
        } catch (error) {
          console.error('Failed to process speech recognition result:', error);
          if (this.dependencies.onError) {
            this.dependencies.onError(
              error instanceof WidgetError ? error : new WidgetError('Failed to process speech recognition result', WIDGET_ERRORS.SPEECH_NOT_SUPPORTED)
            );
          }
        }
      };

      this.speechRecognition.onend = () => {
        const micBtn = document.getElementById('intelligentconvo-mic');
        if (micBtn) {
          micBtn.classList.remove('listening');
          micBtn.setAttribute('aria-label', 'Start voice input');
        }
        this.speechRecognition = null;
      };

      this.speechRecognition.onerror = (event: { error: string; message?: string }) => {
        const error = new WidgetError(`Speech recognition error: ${event.error}`, WIDGET_ERRORS.SPEECH_NOT_SUPPORTED);
        console.error(error);

        if (this.dependencies.onError) {
          this.dependencies.onError(error);
        }

        const micBtn = document.getElementById('intelligentconvo-mic');
        if (micBtn) {
          micBtn.classList.remove('listening');
        }
      };

      this.speechRecognition.start();
    } catch (error) {
      const err = error instanceof WidgetError ? error : new WidgetError('Voice input failed', WIDGET_ERRORS.SPEECH_NOT_SUPPORTED);
      console.error(err);

      if (this.dependencies.onError) {
        this.dependencies.onError(err);
      }
    }
  }

  /**
   * Stops the speech recognition if active
   */
  public stopVoiceInput(): void {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  }

  /**
   * Checks if speech recognition is supported
   */
  public isSupported(): boolean {
    return 'webkitSpeechRecognition' in window;
  }

  /**
   * Checks if speech recognition is currently active
   */
  public isListening(): boolean {
    return this.speechRecognition !== null;
  }

  /**
   * Cleanup method to stop recognition
   */
  public cleanup(): void {
    this.stopVoiceInput();
  }
}
