import { Message, MessageHandlerDependencies, MessageData } from '../types';
import { WidgetError } from '../core/WidgetError';
import { WIDGET_ERRORS } from '../constants';
import { sanitizeHtml, sanitizeHtmlWithConfig, markdownToHtml } from '../utils/sanitization';

export class MessageHandler {
  private dependencies: MessageHandlerDependencies;

  constructor(dependencies: MessageHandlerDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Updates the settings reference
   * @param settings - New widget settings
   */
  public setSettings(settings: MessageHandlerDependencies['settings']): void {
    this.dependencies.settings = settings;
  }

  /**
   * Handles the send message action from the UI
   */
  public handleSendMessage(): void {
    const input = document.getElementById('intelliconvo-input') as HTMLInputElement;
    const sendBtn = document.getElementById('intelliconvo-send');
    const text = input.value.trim();

    if (!text) {
      input.focus();
      return;
    }

    const socket = this.dependencies.getSocket();
    const connected = this.dependencies.isConnected();
    console.log('[MessageHandler] Checking connection - socket:', !!socket, 'connected:', connected);
    if (!socket || !connected) {
      this.dependencies.showErrorMessage('Not connected to chat service. Please wait while we reconnect.');
      return;
    }

    // Disable input during send
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.setAttribute('disabled', 'true');

    try {
      this.sendMessage(text);
      input.value = '';
    } finally {
      // Re-enable input
      if (input) {
        input.disabled = false;
        input.focus();
      }
      if (sendBtn) sendBtn.removeAttribute('disabled');
    }
  }

  /**
   * Sends a message through the socket connection
   */
  public async sendMessage(text: string): Promise<void> {
    try {
      if (!text.trim()) {
        throw new WidgetError('Message cannot be empty', WIDGET_ERRORS.MESSAGE_SEND_FAILED);
      }

      const socket = this.dependencies.getSocket();
      if (!socket || !this.dependencies.isConnected()) {
        throw new WidgetError('Not connected to chat service', WIDGET_ERRORS.CONNECTION_FAILED);
      }

      // Check rate limit
      if (!this.dependencies.rateLimiter.tryAcquire()) {
        const waitTime = Math.ceil(this.dependencies.rateLimiter.getWaitTime() / 1000);
        throw new WidgetError(
          `Please slow down. You can send another message in ${waitTime} second${waitTime !== 1 ? 's' : ''}.`,
          WIDGET_ERRORS.MESSAGE_SEND_FAILED
        );
      }

      // Reset lastAssistantMessage for new response
      window.lastAssistantMessage = undefined;

      const message: Message = {
        id: this.generateMessageId(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      this.displayMessage('user', text.trim(), message.id);
      this.dependencies.messages.push(message);

      // Hide starters after first message
      const starters = document.getElementById('intelliconvo-starters');
      if (starters) {
        starters.style.display = 'none';
      }

      // Prepare message data
      const messageData: MessageData = {
        sessionId: this.dependencies.sessionId,
        siteId: this.dependencies.siteId,
        content: text.trim(),
        messageId: message.id,
      };

      // Include file attachments if any
      if (this.dependencies.prepareFileAttachments) {
        try {
          const attachments = await this.dependencies.prepareFileAttachments();
          if (attachments.length > 0) {
            messageData.attachments = attachments;
            this.dependencies.clearPendingFiles?.();
            this.dependencies.updateFilePreview?.();
          }
        } catch (error) {
          console.warn('Failed to attach files:', error);
        }
      }

      socket.emit('message', messageData);

      this.dependencies.setTyping(true);

      // Track message sent
      this.dependencies.trackAnalyticsEvent('message_sent', { length: text.trim().length });

      // Save conversation
      this.dependencies.saveConversation();

      if (this.dependencies.onMessage) {
        this.dependencies.onMessage(message);
      }
    } catch (error) {
      const err = error instanceof WidgetError ? error : new WidgetError('Failed to send message', WIDGET_ERRORS.MESSAGE_SEND_FAILED);
      if (this.dependencies.onError) {
        this.dependencies.onError(err);
      }
      this.dependencies.showErrorMessage(err.message);
    }
  }

  /**
   * Displays a message in the chat UI
   */
  public displayMessage(role: 'user' | 'assistant' | 'agent', content: string, messageId?: string, agentId?: string): void {
    const messagesContainer = document.getElementById('intelliconvo-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `intelliconvo-transcript-message intelliconvo-transcript-${role}`;
    messageDiv.setAttribute('data-message-id', messageId || this.generateMessageId());
    if (agentId) {
      messageDiv.setAttribute('data-agent-id', agentId);
    }

    // Sanitize HTML - use configured tags for assistant/agent messages, escape all for user
    const sanitizedContent = (role === 'assistant' || role === 'agent')
      ? sanitizeHtmlWithConfig(content, this.dependencies.settings)
      : sanitizeHtml(content);

    // Format timestamp
    const showTimestamp = this.dependencies.settings?.messageTimestampShow !== false;
    const timestampFormat = this.dependencies.settings?.messageTimestampFormat || 'HH:mm';
    const now = new Date();
    let formattedTime = '';
    if (showTimestamp) {
      if (timestampFormat === 'HH:mm') {
        formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (timestampFormat === 'hh:mm A') {
        formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      } else if (timestampFormat === 'HH:mm:ss') {
        formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      } else {
        formattedTime = now.toLocaleTimeString();
      }
    }

    // Show avatar for assistant/agent messages if enabled
    const showAvatar = this.dependencies.settings?.showMessageAvatar && (role === 'assistant' || role === 'agent');
    const avatarHtml = showAvatar ? `
      <div class="intelliconvo-transcript-avatar">
        ${role === 'agent'
          ? `<span class="intelliconvo-agent-avatar">A</span>`
          : this.dependencies.settings?.botAvatarUrl
            ? `<img src="${this.dependencies.settings.botAvatarUrl}" alt="${this.dependencies.settings?.botName || 'Assistant'}" />`
            : `<span>${this.dependencies.settings?.botAvatarFallback || 'AI'}</span>`
        }
      </div>
    ` : '';

    messageDiv.innerHTML = `
      ${avatarHtml}
      <div class="intelliconvo-transcript-wrapper">
        <div class="intelliconvo-transcript-content">${sanitizedContent || ''}</div>
        ${showTimestamp ? `<div class="intelliconvo-transcript-time">${formattedTime}</div>` : ''}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    if (role === 'assistant' || role === 'agent') {
      const message: Message = {
        id: messageId || this.generateMessageId(),
        role,
        content: sanitizedContent,
        timestamp: new Date().toISOString(),
        agentId,
      };
      this.dependencies.messages.push(message);

      // Store the message element for streaming (assistant only)
      if (role === 'assistant') {
        window.lastAssistantMessage = messageDiv;
      }
      // Store the message ID for updating content during streaming
      messageDiv.setAttribute('data-message-id', message.id);

      // Only call onMessage callback if there's actual content (not for streaming start)
      if (content && this.dependencies.onMessage) {
        this.dependencies.onMessage(message);
      }
    }
  }

  /**
   * Displays a system message in the chat UI
   */
  public displaySystemMessage(content: string): void {
    const messagesContainer = document.getElementById('intelliconvo-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'intelliconvo-system-message';

    const sanitizedContent = sanitizeHtml(content);
    messageDiv.innerHTML = `
      <div class="intelliconvo-system-message-content">${sanitizedContent}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * Appends a chunk of text to the last assistant message (for streaming)
   */
  public appendToLastMessage(chunk: string): void {
    try {
      const lastMessage = window.lastAssistantMessage;
      if (lastMessage) {
        const contentDiv = lastMessage.querySelector('.intelliconvo-transcript-content');
        if (contentDiv) {
          // First, update the message content in the messages array (raw markdown)
          const messageId = lastMessage.getAttribute('data-message-id');
          let fullContent = '';

          if (messageId) {
            const messageObj = this.dependencies.messages.find(m => m.id === messageId);
            if (messageObj) {
              messageObj.content += chunk;
              fullContent = messageObj.content;
            }
          }

          // Convert the accumulated markdown to HTML and render it
          if (fullContent) {
            const htmlContent = markdownToHtml(fullContent);
            contentDiv.innerHTML = htmlContent;
          }
        }

        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to append message chunk:', error);
    }
  }

  /**
   * Generates a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Scrolls the messages container to the bottom
   */
  private scrollToBottom(): void {
    const messagesContainer = document.getElementById('intelliconvo-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
}
