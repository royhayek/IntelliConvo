import { Message, WidgetSettings } from '../types';
import { generateSessionId } from '../utils';
import { STORAGE_KEYS, MS_PER_SECOND } from '../constants';

export class StorageManager {
  private conversationLoaded: boolean = false;

  constructor(private siteId: string) {}

  getOrCreateSession(): string {
    let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION);

    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEYS.SESSION, sessionId);
    }

    return sessionId;
  }

  saveConversation(
    messages: Message[],
    sessionId: string,
    settings: WidgetSettings | null
  ): void {
    if (!settings?.persistConversation) return;

    try {
      const conversationData = {
        messages: messages.slice(-settings.maxMessagesHistory),
        timestamp: Date.now(),
        sessionId,
      };

      localStorage.setItem(
        `${STORAGE_KEYS.CONVERSATION_PREFIX}${this.siteId}`,
        JSON.stringify(conversationData)
      );
    } catch (e) {
      console.warn('Failed to save conversation:', e);
    }
  }

  /**
   * Reset the conversation loaded flag to allow reloading on next open
   */
  resetConversationLoaded(): void {
    this.conversationLoaded = false;
  }

  loadPersistedConversation(
    settings: WidgetSettings | null
  ): { messages: Message[]; sessionId?: string } | null {
    if (!settings?.persistConversation || this.conversationLoaded) {
      return null;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CONVERSATION_PREFIX}${this.siteId}`);
      if (!stored) return null;

      const data = JSON.parse(stored);
      const timeout = settings.conversationTimeout * MS_PER_SECOND;

      // Check if conversation has expired
      if (Date.now() - data.timestamp > timeout) {
        localStorage.removeItem(`${STORAGE_KEYS.CONVERSATION_PREFIX}${this.siteId}`);
        return null;
      }

      this.conversationLoaded = true;

      return {
        messages: data.messages || [],
        sessionId: data.sessionId,
      };
    } catch (e) {
      console.warn('Failed to load conversation:', e);
      return null;
    }
  }
}
