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
      <div class="intelligentconvo-widget" role="main" aria-label="Chat widget">
        <div class="intelligentconvo-header">
          <button class="intelligentconvo-menu" aria-label="Menu" tabindex="0">☰</button>
          <div class="intelligentconvo-tabs" role="tablist">
            <button
              class="intelligentconvo-tab active"
              data-mode="chat"
              role="tab"
              aria-selected="true"
              aria-controls="chat-panel"
              id="chat-tab"
            >Chat</button>
            <button
              class="intelligentconvo-tab"
              data-mode="speak"
              role="tab"
              aria-selected="false"
              aria-controls="speak-panel"
              id="speak-tab"
            >Speak</button>
          </div>
        </div>
        <div class="intelligentconvo-content">
          <div class="intelligentconvo-connection-status" id="intelligentconvo-connection-status">
            <div class="intelligentconvo-connection-dot"></div>
            <span id="intelligentconvo-connection-text">Connecting...</span>
          </div>
          <div
            class="intelligentconvo-messages"
            id="intelligentconvo-messages"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          ></div>
          <div class="intelligentconvo-starters" id="intelligentconvo-starters"></div>
          <div class="intelligentconvo-typing" id="intelligentconvo-typing" style="display: none;" aria-live="polite">
            <div class="intelligentconvo-typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <div class="intelligentconvo-input" role="form">
          <label for="intelligentconvo-input" class="sr-only">Type your message</label>
          <input
            type="text"
            placeholder="Type your message..."
            id="intelligentconvo-input"
            aria-label="Type your message"
            autocomplete="off"
            maxlength="1000"
          />
          <button
            class="intelligentconvo-mic"
            id="intelligentconvo-mic"
            aria-label="Start voice input"
            title="Start voice input"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor"/>
              <path d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z" fill="currentColor"/>
            </svg>
          </button>
          <button
            class="intelligentconvo-send"
            id="intelligentconvo-send"
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
      <div class="intelligentconvo-chat-window intelligentconvo-${position}" id="intelligentconvo-chat-window" role="dialog" aria-labelledby="chat-title" aria-modal="true">
        <div class="intelligentconvo-chat-header">
          <div class="intelligentconvo-chat-title">
            <div class="intelligentconvo-header-info">
              ${this.settings?.headerShowAvatar ? `
                <div class="intelligentconvo-header-avatar">
                  ${this.settings?.headerAvatarUrl
                    ? `<img src="${this.settings.headerAvatarUrl}" alt="${this.settings?.botName || 'Assistant'}" />`
                    : `<span>${this.settings?.botAvatarFallback || 'AI'}</span>`
                  }
                  ${this.settings?.headerShowStatus !== false ? `
                    <div class="intelligentconvo-status-dot" id="intelligentconvo-status-dot"></div>
                  ` : ''}
                </div>
              ` : ''}
              <div class="intelligentconvo-header-text">
                <h4 id="chat-title">${headerTitle}</h4>
                ${headerSubtitle ? `<span class="intelligentconvo-header-subtitle">${headerSubtitle}</span>` : ''}
              </div>
            </div>
            <div class="intelligentconvo-header-actions">
              ${showMinimize ? `
                <button
                  class="intelligentconvo-minimize"
                  id="intelligentconvo-minimize"
                  aria-label="${this.settings?.minimizeButtonAriaLabel || 'Minimize chat'}"
                  title="Minimize"
                >−</button>
              ` : ''}
              ${showCloseButton ? `
                <button
                  class="intelligentconvo-close"
                  id="intelligentconvo-close"
                  aria-label="${closeLabel}"
                  title="Close"
                >×</button>
              ` : ''}
            </div>
          </div>
          <div class="intelligentconvo-tabs" role="tablist">
            <button
              class="intelligentconvo-tab active"
              data-mode="chat"
              role="tab"
              aria-selected="true"
              aria-controls="chat-panel"
            >Chat</button>
            <button
              class="intelligentconvo-tab"
              data-mode="speak"
              role="tab"
              aria-selected="false"
              aria-controls="speak-panel"
            >Speak</button>
          </div>
        </div>
        <div class="intelligentconvo-content">
          <div
            class="intelligentconvo-messages"
            id="intelligentconvo-messages"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          ></div>
          <div class="intelligentconvo-starters" id="intelligentconvo-starters"></div>
          ${showTypingIndicator ? `
            <div class="intelligentconvo-typing" id="intelligentconvo-typing" style="display: none;" aria-live="polite">
              ${(this.settings?.typingIndicatorStyle || 'dots') === 'dots' ? `
                <div class="intelligentconvo-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ` : `<span>${typingText}</span>`}
            </div>
          ` : ''}
        </div>
        <div class="intelligentconvo-input" role="form">
          <label for="intelligentconvo-input" class="sr-only">${placeholder}</label>
          <input
            type="text"
            placeholder="${placeholder}"
            id="intelligentconvo-input"
            aria-label="${placeholder}"
            autocomplete="off"
            maxlength="1000"
          />
          ${this.settings?.enableFileAttachments ? `
            <button
              class="intelligentconvo-attach"
              id="intelligentconvo-attach"
              aria-label="Attach file"
              title="Attach file"
            >📎</button>
          ` : ''}
          ${this.settings?.enableEmojiPicker ? `
            <button
              class="intelligentconvo-emoji-btn"
              id="intelligentconvo-emoji-btn"
              aria-label="Open emoji picker"
              title="Emoji"
            >😊</button>
          ` : ''}
          ${showVoiceInput ? `
            <button
              class="intelligentconvo-mic"
              id="intelligentconvo-mic"
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
            class="intelligentconvo-send intelligentconvo-btn-shape-${sendButtonShape}"
            id="intelligentconvo-send"
            aria-label="${sendLabel}"
            title="Send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        ${showPoweredBy ? `
          <div class="intelligentconvo-powered-by">
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
      <div class="intelligentconvo-speak-mode" id="intelligentconvo-speak-mode" style="display: none;">
        <div class="intelligentconvo-speak-header">
          <div class="intelligentconvo-speak-avatar-wrapper">
            <div class="intelligentconvo-speak-avatar">
              ${this.settings?.botAvatarUrl
                ? `<img src="${this.settings.botAvatarUrl}" alt="${speakTitle}" />`
                : `<div class="intelligentconvo-speak-avatar-fallback">${this.settings?.botAvatarFallback || 'AI'}</div>`
              }
              <div class="intelligentconvo-speak-pulse"></div>
            </div>
          </div>
          <div class="intelligentconvo-speak-status-wrapper">
            <h3 class="intelligentconvo-speak-title">${speakTitle}</h3>
            <div class="intelligentconvo-speak-status" id="intelligentconvo-speak-status">
              <span class="intelligentconvo-status-text">Ready to listen</span>
            </div>
          </div>
        </div>

        <div class="intelligentconvo-speak-waveform-container">
          <div class="intelligentconvo-speak-waveform" id="intelligentconvo-speak-waveform">
            <div class="intelligentconvo-wave-bar"></div>
            <div class="intelligentconvo-wave-bar"></div>
            <div class="intelligentconvo-wave-bar"></div>
            <div class="intelligentconvo-wave-bar"></div>
            <div class="intelligentconvo-wave-bar"></div>
          </div>
        </div>

        <div class="intelligentconvo-speak-transcript" id="intelligentconvo-speak-transcript">
          <div class="intelligentconvo-transcript-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Conversation</span>
          </div>
          <div class="intelligentconvo-transcript-messages" id="intelligentconvo-transcript-messages">
            <div class="intelligentconvo-transcript-empty">
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

        <div class="intelligentconvo-speak-controls">
          <button
            class="intelligentconvo-speak-btn"
            id="intelligentconvo-speak-btn"
            aria-label="Start speaking"
            title="Tap to speak"
          >
            <svg class="intelligentconvo-mic-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          </button>
          <button
            class="intelligentconvo-speak-stop-btn"
            id="intelligentconvo-speak-stop-btn"
            aria-label="Stop speaking"
            title="Stop"
            style="display: none;"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        </div>

        <div class="intelligentconvo-speaking-indicator" id="intelligentconvo-speaking-indicator" style="display: none;">
          <div class="intelligentconvo-speaking-animation">
            <div class="intelligentconvo-speaking-dot"></div>
            <div class="intelligentconvo-speaking-dot"></div>
            <div class="intelligentconvo-speaking-dot"></div>
          </div>
          <span>AI is speaking...</span>
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
