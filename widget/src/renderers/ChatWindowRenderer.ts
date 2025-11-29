import { WidgetSettings } from '../types/settings';
import { WidgetConfig } from '../types/config';
import { DEFAULT_POWERED_BY_TEXT, DEFAULT_POWERED_BY_URL } from '../constants';

/**
 * ChatWindowRenderer handles rendering of the main chat window
 * and widget container HTML
 */
export class ChatWindowRenderer {
  private settings: WidgetSettings | null;
  private config: WidgetConfig;
  private isMobile: boolean;

  constructor(settings: WidgetSettings | null, config: WidgetConfig, isMobile: boolean = false) {
    this.settings = settings;
    this.config = config;
    this.isMobile = isMobile;
  }

  /**
   * Gets the widget HTML (for widget mode)
   * @returns HTML string for the widget container
   */
  public getWidgetHTML(): string {
    return `
      <div class="intelliconvo-widget" role="main" aria-label="Chat widget">
        <div class="intelliconvo-header">
          <button class="intelliconvo-menu" aria-label="Menu" tabindex="0">☰</button>
          <div class="intelliconvo-tabs" role="tablist">
            <button
              class="intelliconvo-tab active"
              data-mode="chat"
              role="tab"
              aria-selected="true"
              aria-controls="chat-panel"
              id="chat-tab"
            >Chat</button>
            <button
              class="intelliconvo-tab"
              data-mode="speak"
              role="tab"
              aria-selected="false"
              aria-controls="speak-panel"
              id="speak-tab"
            >Speak</button>
          </div>
        </div>
        <div class="intelliconvo-content">
          <div class="intelliconvo-connection-status" id="intelliconvo-connection-status">
            <div class="intelliconvo-connection-dot"></div>
            <span id="intelliconvo-connection-text">Connecting...</span>
          </div>
          <div
            class="intelliconvo-messages"
            id="intelliconvo-messages"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            <div class="intelliconvo-typing" id="intelliconvo-typing" style="display: none;" aria-live="polite">
              <div class="intelliconvo-typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          <div class="intelliconvo-starters" id="intelliconvo-starters"></div>
        </div>
        <div class="intelliconvo-input" role="form">
          <label for="intelliconvo-input" class="sr-only">Type your message</label>
          <input
            type="text"
            placeholder="Type your message..."
            id="intelliconvo-input"
            aria-label="Type your message"
            autocomplete="off"
            maxlength="1000"
          />
          <button
            class="intelliconvo-mic"
            id="intelliconvo-mic"
            aria-label="Start voice input"
            title="Start voice input"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor"/>
              <path d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            class="intelliconvo-send"
            id="intelliconvo-send"
            aria-label="Send message"
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Gets the chat window HTML (for button mode)
   * @returns HTML string for the chat window
   */
  public getChatWindowHTML(): string {
    const headerTitle = this.settings?.headerTitle || this.settings?.botName || 'Chat Assistant';
    const headerSubtitle = this.settings?.headerSubtitle || this.settings?.botTagline || '';
    const placeholder = this.settings?.inputPlaceholderText || this.settings?.inputPlaceholder || 'Type your message...';
    const typingText = this.settings?.typingIndicatorText || 'AI is typing...';
    const closeLabel = this.settings?.closeButtonAriaLabel || 'Close chat';
    const sendLabel = this.settings?.sendButtonAriaLabel || 'Send message';
    const showVoiceInput = this.settings?.enableVoiceInput !== false;
    const showCloseButton = this.settings?.headerShowCloseButton !== false;
    const showTypingIndicator = this.settings?.showTypingIndicator !== false;
    // Use mobile setting if on mobile, otherwise use desktop setting
    const showMinimize = this.isMobile
      ? (this.settings?.mobileShowMinimizeButton || false)
      : (this.settings?.headerShowMinimizeButton || false);
    const showPoweredBy = this.settings?.showPoweredBy !== false;
    const poweredByText = this.settings?.poweredByText || DEFAULT_POWERED_BY_TEXT;
    const poweredByUrl = this.settings?.poweredByUrl || DEFAULT_POWERED_BY_URL;
    const sendButtonShape = this.settings?.sendButtonShape || 'circle';
    const position = this.settings?.launcherPosition || this.config.position || 'bottom-right';

    return `
      <div class="intelliconvo-chat-window intelliconvo-${position}" id="intelliconvo-chat-window" role="dialog" aria-labelledby="chat-title" aria-modal="true">
        <div class="intelliconvo-chat-header">
          <div class="intelliconvo-chat-title">
            <div class="intelliconvo-header-info">
              ${this.settings?.headerShowAvatar ? `
                <div class="intelliconvo-header-avatar">
                  ${this.settings?.headerAvatarUrl
                    ? `<img src="${this.settings.headerAvatarUrl}" alt="${this.settings?.botName || 'Assistant'}" />`
                    : `<span>${this.settings?.botAvatarFallback || 'AI'}</span>`
                  }
                  ${this.settings?.headerShowStatus !== false ? `
                    <div class="intelliconvo-status-dot" id="intelliconvo-status-dot"></div>
                  ` : ''}
                </div>
              ` : ''}
              <div class="intelliconvo-header-text">
                <h4 id="chat-title">${headerTitle}</h4>
                ${headerSubtitle ? `<span class="intelliconvo-header-subtitle">${headerSubtitle}</span>` : ''}
              </div>
            </div>
            <div class="intelliconvo-header-actions">
              ${showMinimize ? `
                <button
                  class="intelliconvo-minimize"
                  id="intelliconvo-minimize"
                  aria-label="${this.settings?.minimizeButtonAriaLabel || 'Minimize chat'}"
                  title="Minimize"
                >−</button>
              ` : ''}
              ${showCloseButton ? `
                <button
                  class="intelliconvo-close"
                  id="intelliconvo-close"
                  aria-label="${closeLabel}"
                  title="Close"
                >×</button>
              ` : ''}
            </div>
          </div>
          <div class="intelliconvo-tabs" role="tablist">
            <button
              class="intelliconvo-tab active"
              data-mode="chat"
              role="tab"
              aria-selected="true"
              aria-controls="chat-panel"
            >Chat</button>
            <button
              class="intelliconvo-tab"
              data-mode="speak"
              role="tab"
              aria-selected="false"
              aria-controls="speak-panel"
            >Speak</button>
          </div>
        </div>
        <div class="intelliconvo-content">
          <div
            class="intelliconvo-messages"
            id="intelliconvo-messages"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          ></div>
          <div class="intelliconvo-starters" id="intelliconvo-starters"></div>
          ${showTypingIndicator ? `
            <div class="intelliconvo-typing" id="intelliconvo-typing" style="display: none;" aria-live="polite">
              ${(this.settings?.typingIndicatorStyle || 'dots') === 'dots' ? `
                <div class="intelliconvo-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ` : `<span>${typingText}</span>`}
            </div>
          ` : ''}
        </div>
        <div class="intelliconvo-input" role="form">
          <label for="intelliconvo-input" class="sr-only">${placeholder}</label>
          <input
            type="text"
            placeholder="${placeholder}"
            id="intelliconvo-input"
            aria-label="${placeholder}"
            autocomplete="off"
            maxlength="1000"
          />
          ${this.settings?.enableFileAttachments ? `
            <button
              class="intelliconvo-attach"
              id="intelliconvo-attach"
              aria-label="Attach file"
              title="Attach file"
            >📎</button>
          ` : ''}
          ${this.settings?.enableEmojiPicker ? `
            <button
              class="intelliconvo-emoji-btn"
              id="intelliconvo-emoji-btn"
              aria-label="Open emoji picker"
              title="Emoji"
            >😊</button>
          ` : ''}
          ${showVoiceInput ? `
            <button
              class="intelliconvo-mic"
              id="intelliconvo-mic"
              aria-label="Start voice input"
              title="Start voice input"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor"/>
                <path d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z" fill="currentColor"/>
              </svg>
            </button>
          ` : ''}
          <button
            class="intelliconvo-send intelliconvo-btn-shape-${sendButtonShape}"
            id="intelliconvo-send"
            aria-label="${sendLabel}"
            title="Send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        ${showPoweredBy ? `
          <div class="intelliconvo-powered-by">
            <a href="${poweredByUrl}" target="_blank" rel="noopener noreferrer">${poweredByText}</a>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Gets the speak mode HTML
   * @returns HTML string for the speak mode panel
   */
  public getSpeakModeHTML(): string {
    const speakTitle = this.settings?.botName || 'AI Assistant';

    return `
      <div class="intelliconvo-speak-mode" id="intelliconvo-speak-mode" style="display: none;">
        <div class="intelliconvo-speak-header">
          <div class="intelliconvo-speak-avatar-wrapper">
            <div class="intelliconvo-speak-avatar">
              ${this.settings?.botAvatarUrl
                ? `<img src="${this.settings.botAvatarUrl}" alt="${speakTitle}" />`
                : `<div class="intelliconvo-speak-avatar-fallback">${this.settings?.botAvatarFallback || 'AI'}</div>`
              }
              <div class="intelliconvo-speak-pulse"></div>
            </div>
          </div>
          <div class="intelliconvo-speak-status-wrapper">
            <h3 class="intelliconvo-speak-title">${speakTitle}</h3>
            <div class="intelliconvo-speak-status" id="intelliconvo-speak-status">
              <span class="intelliconvo-status-text">Ready to listen</span>
            </div>
          </div>
        </div>

        <div class="intelliconvo-speak-waveform-container">
          <div class="intelliconvo-speak-waveform" id="intelliconvo-speak-waveform">
            <div class="intelliconvo-wave-bar"></div>
            <div class="intelliconvo-wave-bar"></div>
            <div class="intelliconvo-wave-bar"></div>
            <div class="intelliconvo-wave-bar"></div>
            <div class="intelliconvo-wave-bar"></div>
          </div>
        </div>

        <div class="intelliconvo-speak-transcript" id="intelliconvo-speak-transcript">
          <div class="intelliconvo-transcript-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Transcript</span>
          </div>
          <div class="intelliconvo-transcript-messages" id="intelliconvo-transcript-messages">
            <div class="intelliconvo-transcript-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="22"></line>
              </svg>
              <p>Start a voice conversation</p>
              <small>Tap the microphone to speak</small>
            </div>
          </div>
        </div>

        <div class="intelliconvo-speak-controls">
          <button
            class="intelliconvo-speak-btn"
            id="intelliconvo-speak-btn"
            aria-label="Start speaking"
            title="Tap to speak"
          >
            <svg class="intelliconvo-mic-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>
          <button
            class="intelliconvo-speak-stop-btn"
            id="intelliconvo-speak-stop-btn"
            aria-label="Stop speaking"
            title="Stop"
            style="display: none;"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        </div>

        <div class="intelliconvo-speaking-indicator" id="intelliconvo-speaking-indicator" style="display: none;">
          <div class="intelliconvo-speaking-animation">
            <div class="intelliconvo-speaking-dot"></div>
            <div class="intelliconvo-speaking-dot"></div>
            <div class="intelliconvo-speaking-dot"></div>
          </div>
          <span>AI is speaking...</span>
        </div>

        <div class="intelliconvo-processing-indicator" id="intelliconvo-processing-indicator" style="display: none;">
          <div class="intelliconvo-processing-animation">
            <div class="intelliconvo-processing-dot"></div>
            <div class="intelliconvo-processing-dot"></div>
            <div class="intelliconvo-processing-dot"></div>
          </div>
          <span>Processing...</span>
        </div>
      </div>
    `;
  }

  /**
   * Updates the internal settings reference
   * @param settings - New widget settings
   */
  public updateSettings(settings: WidgetSettings | null): void {
    this.settings = settings;
  }

  /**
   * Updates the mobile state
   * @param isMobile - Whether the current view is mobile
   */
  public updateMobileState(isMobile: boolean): void {
    this.isMobile = isMobile;
  }
}
