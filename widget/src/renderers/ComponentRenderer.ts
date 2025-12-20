import { WidgetSettings } from '../types/settings';
import { ConversationStarters } from '../types/message';

/**
 * ComponentRenderer handles rendering of smaller UI components
 * like conversation starters, quick replies, and emoji picker
 */
export class ComponentRenderer {
  private settings: WidgetSettings | null;
  private quickReplies: string[] = [];

  constructor(settings: WidgetSettings | null) {
    this.settings = settings;
  }

  /**
   * Renders conversation starters into the container
   * @param data - Conversation starters data
   * @param onSendMessage - Callback function when a starter is clicked
   * @param sanitizeHtml - Function to sanitize HTML content
   */
  public renderStarters(
    data: ConversationStarters,
    onSendMessage: (text: string) => void,
    sanitizeHtml: (html: string) => string
  ): void {
    const container = document.getElementById('intelliconvo-starters');
    if (!container) return;

    // Check if starters should be shown
    if (this.settings?.showConversationStarters === false) {
      container.style.display = 'none';
      return;
    }

    // Sanitize starters headline - use settings welcomeMessage if available for backwards compatibility
    // Note: settings.welcomeMessage is the bot's greeting, but can also serve as starters headline
    const startersHeadline = this.settings?.welcomeMessage || data.startersHeadline;
    const sanitizedHeadline = sanitizeHtml(startersHeadline);

    // Get starters title
    const startersTitle = this.settings?.startersTitle || 'Suggested questions';

    container.innerHTML = `
      <div class="intelliconvo-welcome" role="heading" aria-level="3">${sanitizedHeadline}</div>
      ${data.starters.length > 0 ? `
        <div class="intelliconvo-starters-title">${startersTitle}</div>
        <div class="intelliconvo-starter-buttons" role="group" aria-label="Conversation starters">
          ${data.starters.map((starter) => {
            const sanitizedText = sanitizeHtml(starter.starterText);
            return `<button
              class="intelliconvo-starter-btn"
              data-text="${sanitizedText}"
              aria-label="Send: ${sanitizedText}"
              tabindex="0"
            >
              ${sanitizedText}
            </button>`;
          }).join('')}
        </div>
      ` : ''}
    `;

    // Add click and keyboard handlers to starter buttons
    container.querySelectorAll('.intelliconvo-starter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = (e.target as HTMLElement).getAttribute('data-text');
        if (text) {
          onSendMessage(text);
        }
      });

      btn.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          const text = (e.target as HTMLElement).getAttribute('data-text');
          if (text) {
            onSendMessage(text);
          }
        }
      });
    });
  }

  /**
   * Renders quick reply buttons
   * @param replies - Array of quick reply texts
   * @param onSendMessage - Callback function when a reply is clicked
   * @param sanitizeHtml - Function to sanitize HTML content
   */
  public renderQuickReplies(
    replies: string[],
    onSendMessage: (text: string) => void,
    sanitizeHtml: (html: string) => string
  ): void {
    if (!this.settings?.showQuickReplies || replies.length === 0) return;

    this.quickReplies = replies;

    let container = document.getElementById('intelliconvo-quick-replies');
    if (!container) {
      container = document.createElement('div');
      container.id = 'intelliconvo-quick-replies';
      container.className = `intelliconvo-quick-replies intelliconvo-quick-replies-${this.settings.quickRepliesPosition}`;

      // Position based on setting
      if (this.settings.quickRepliesPosition === 'above-input') {
        const inputArea = document.querySelector('.intelliconvo-input');
        if (inputArea) {
          inputArea.parentElement?.insertBefore(container, inputArea);
        }
      } else {
        const messagesArea = document.getElementById('intelliconvo-messages');
        if (messagesArea) {
          messagesArea.parentElement?.insertBefore(container, messagesArea.nextSibling);
        }
      }
    }

    container.innerHTML = `
      <div class="intelliconvo-quick-replies-list">
        ${replies.map(reply => `
          <button class="intelliconvo-quick-reply-btn" data-reply="${sanitizeHtml(reply)}">
            ${sanitizeHtml(reply)}
          </button>
        `).join('')}
      </div>
    `;

    // Add click handlers
    container.querySelectorAll('.intelliconvo-quick-reply-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const reply = (e.target as HTMLElement).getAttribute('data-reply');
        if (reply) {
          onSendMessage(reply);
          // Clear quick replies after use
          if (container) container.remove();
        }
      });
    });
  }

  /**
   * Gets the emoji picker HTML
   * @returns HTML string for the emoji picker
   */
  public getEmojiPickerHTML(): string {
    const emojis = [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
      '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '❓', '❗'
    ];

    return `
      <div class="intelliconvo-emoji-grid">
        ${emojis.map(emoji => `
          <button class="intelliconvo-emoji" aria-label="${emoji}">${emoji}</button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Clears quick replies from the DOM
   */
  public clearQuickReplies(): void {
    const container = document.getElementById('intelliconvo-quick-replies');
    if (container) {
      container.remove();
    }
    this.quickReplies = [];
  }

  /**
   * Gets the current quick replies
   * @returns Array of quick reply strings
   */
  public getQuickReplies(): string[] {
    return this.quickReplies;
  }

  /**
   * Updates the internal settings reference
   * @param settings - New widget settings
   */
  public updateSettings(settings: WidgetSettings | null): void {
    this.settings = settings;
  }

  /**
   * Renders the "Talk to Human" button
   * @param onClick - Callback function when button is clicked
   * @param sanitizeHtml - Function to sanitize HTML content
   */
  public renderHandoffButton(
    onClick: () => void,
    sanitizeHtml: (html: string) => string
  ): void {
    // Check if human handoff is enabled
    if (!this.settings?.enableHumanHandoff || !this.settings?.humanHandoffButtonShow) {
      return;
    }

    const position = this.settings.humanHandoffButtonPosition || 'in-chat';
    const buttonText = sanitizeHtml(this.settings.humanHandoffButtonText || 'Talk to a Human');

    // Determine where to insert the button based on position
    let container: HTMLElement | null = null;

    if (position === 'header') {
      // Add to chat header
      container = document.querySelector('.intelliconvo-header-actions') as HTMLElement;
      if (!container) return;
    } else if (position === 'in-chat') {
      // Add to messages area (above input)
      const messagesArea = document.getElementById('intelliconvo-messages');
      if (!messagesArea?.parentElement) return;

      // Create container if it doesn't exist
      container = document.getElementById('intelliconvo-handoff-button-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'intelliconvo-handoff-button-container';
        container.className = 'intelliconvo-handoff-button-container';
        messagesArea.parentElement.insertBefore(container, messagesArea.nextSibling);
      }
    } else if (position === 'floating') {
      // Create floating container
      container = document.getElementById('intelliconvo-handoff-button-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'intelliconvo-handoff-button-container';
        container.className = 'intelliconvo-handoff-button-container intelliconvo-handoff-floating';
        const chatWindow = document.getElementById('intelliconvo-chat-window');
        chatWindow?.appendChild(container);
      }
    }

    if (!container) return;

    container.innerHTML = `
      <button
        id="intelliconvo-handoff-button"
        class="intelliconvo-handoff-button"
        aria-label="${buttonText}"
      >
        <svg class="intelliconvo-handoff-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>${buttonText}</span>
      </button>
    `;

    // Add click handler
    const button = document.getElementById('intelliconvo-handoff-button');
    if (button) {
      button.addEventListener('click', onClick);
    }
  }

  /**
   * Hides the handoff button
   */
  public hideHandoffButton(): void {
    const container = document.getElementById('intelliconvo-handoff-button-container');
    if (container) {
      container.style.display = 'none';
    }
  }

  /**
   * Shows the handoff button
   */
  public showHandoffButton(): void {
    const container = document.getElementById('intelliconvo-handoff-button-container');
    if (container) {
      container.style.display = '';
    }
  }

  /**
   * Shows the agent typing indicator
   * @param sanitizeHtml - Function to sanitize HTML content
   */
  public showAgentTyping(sanitizeHtml: (html: string) => string): void {
    const messagesContainer = document.getElementById('intelliconvo-messages');
    if (!messagesContainer) return;

    // Remove existing typing indicator
    this.hideAgentTyping();

    const typingText = sanitizeHtml(this.settings?.agentTypingText || 'Agent is typing...');

    const typingDiv = document.createElement('div');
    typingDiv.id = 'intelliconvo-agent-typing';
    typingDiv.className = 'intelliconvo-typing-indicator intelliconvo-agent-typing';
    typingDiv.innerHTML = `
      <div class="intelliconvo-typing-bubble">
        <div class="intelliconvo-typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="intelliconvo-typing-text">${typingText}</div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Hides the agent typing indicator
   */
  public hideAgentTyping(): void {
    const typingIndicator = document.getElementById('intelliconvo-agent-typing');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
}
