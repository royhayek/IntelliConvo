import { Message, MessageHandlerDependencies, MessageData } from '../types';
import { WidgetError } from '../core/WidgetError';
import { WIDGET_ERRORS } from '../constants';
import { sanitizeHtml, sanitizeHtmlWithConfig } from '../utils/sanitization';

export class MessageHandler {
  private dependencies: MessageHandlerDependencies;

  constructor(dependencies: MessageHandlerDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Handles the send message action from the UI
   */
  public handleSendMessage(): void {
    const input = document.getElementById('intelligentconvo-input') as HTMLInputElement;
    const sendBtn = document.getElementById('intelligentconvo-send');
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
      const starters = document.getElementById('intelligentconvo-starters');
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
  public displayMessage(role: 'user' | 'assistant', content: string, messageId?: string): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `intelligentconvo-message intelligentconvo-${role}`;
    messageDiv.setAttribute('data-message-id', messageId || this.generateMessageId());

    // Sanitize HTML - use configured tags for assistant messages, escape all for user
    const sanitizedContent = role === 'assistant'
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

    // Show avatar for assistant messages if enabled
    const showAvatar = this.dependencies.settings?.showMessageAvatar && role === 'assistant';
    const avatarHtml = showAvatar ? `
      <div class="intelligentconvo-message-avatar">
        ${this.dependencies.settings?.botAvatarUrl
          ? `<img src="${this.dependencies.settings.botAvatarUrl}" alt="${this.dependencies.settings?.botName || 'Assistant'}" />`
          : `<span>${this.dependencies.settings?.botAvatarFallback || 'AI'}</span>`
        }
      </div>
    ` : '';

    messageDiv.innerHTML = `
      ${avatarHtml}
      <div class="intelligentconvo-message-wrapper">
        <div class="intelligentconvo-message-content">${sanitizedContent || ''}</div>
        ${showTimestamp ? `<div class="intelligentconvo-message-time">${formattedTime}</div>` : ''}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    if (role === 'assistant') {
      const message: Message = {
        id: messageId || this.generateMessageId(),
        role,
        content: sanitizedContent,
        timestamp: new Date().toISOString(),
      };
      this.dependencies.messages.push(message);

      // Store the message element for streaming
      window.lastAssistantMessage = messageDiv;
      // Store the message ID for updating content during streaming
      messageDiv.setAttribute('data-message-id', message.id);

      // Only call onMessage callback if there's actual content (not for streaming start)
      if (content && this.dependencies.onMessage) {
        this.dependencies.onMessage(message);
      }
    }
  }

  /**
   * Appends a chunk of text to the last assistant message (for streaming)
   */
  public appendToLastMessage(chunk: string): void {
    try {
      const lastMessage = window.lastAssistantMessage;
      if (lastMessage) {
        const contentDiv = lastMessage.querySelector('.intelligentconvo-message-content');
        if (contentDiv) {
          // Use textContent to prevent HTML injection
          contentDiv.textContent += chunk;
        }

        // Also update the message content in the messages array
        const messageId = lastMessage.getAttribute('data-message-id');
        if (messageId) {
          const messageObj = this.dependencies.messages.find(m => m.id === messageId);
          if (messageObj) {
            messageObj.content += chunk;
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
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
}
