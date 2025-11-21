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
    const container = document.getElementById('intelligentconvo-starters');
    if (!container) return;

    // Check if starters should be shown
    if (this.settings?.showConversationStarters === false) {
      container.style.display = 'none';
      return;
    }

    // Sanitize welcome message - use settings welcomeMessage if available
    const welcomeMessage = this.settings?.welcomeMessage || data.welcomeMessage;
    const sanitizedWelcome = sanitizeHtml(welcomeMessage);

    // Get starters title
    const startersTitle = this.settings?.startersTitle || 'Suggested questions';

    container.innerHTML = `
      <div class="intelligentconvo-welcome" role="heading" aria-level="3">${sanitizedWelcome}</div>
      ${data.starters.length > 0 ? `
        <div class="intelligentconvo-starters-title">${startersTitle}</div>
        <div class="intelligentconvo-starter-buttons" role="group" aria-label="Conversation starters">
          ${data.starters.map((starter) => {
            const sanitizedText = sanitizeHtml(starter.starterText);
            return `<button
              class="intelligentconvo-starter-btn"
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
    container.querySelectorAll('.intelligentconvo-starter-btn').forEach(btn => {
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

    let container = document.getElementById('intelligentconvo-quick-replies');
    if (!container) {
      container = document.createElement('div');
      container.id = 'intelligentconvo-quick-replies';
      container.className = `intelligentconvo-quick-replies intelligentconvo-quick-replies-${this.settings.quickRepliesPosition}`;

      // Position based on setting
      if (this.settings.quickRepliesPosition === 'above-input') {
        const inputArea = document.querySelector('.intelligentconvo-input');
        if (inputArea) {
          inputArea.parentElement?.insertBefore(container, inputArea);
        }
      } else {
        const messagesArea = document.getElementById('intelligentconvo-messages');
        if (messagesArea) {
          messagesArea.parentElement?.insertBefore(container, messagesArea.nextSibling);
        }
      }
    }

    container.innerHTML = `
      <div class="intelligentconvo-quick-replies-list">
        ${replies.map(reply => `
          <button class="intelligentconvo-quick-reply-btn" data-reply="${sanitizeHtml(reply)}">
            ${sanitizeHtml(reply)}
          </button>
        `).join('')}
      </div>
    `;

    // Add click handlers
    container.querySelectorAll('.intelligentconvo-quick-reply-btn').forEach(btn => {
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
      <div class="intelligentconvo-emoji-grid">
        ${emojis.map(emoji => `
          <button class="intelligentconvo-emoji" aria-label="${emoji}">${emoji}</button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Clears quick replies from the DOM
   */
  public clearQuickReplies(): void {
    const container = document.getElementById('intelligentconvo-quick-replies');
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
}
