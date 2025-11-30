import { Message, WidgetSettings } from '../types';
import { generateSessionId } from '../utils';
import { STORAGE_KEYS, MS_PER_SECOND, DEFAULT_API_URL } from '../constants';

interface BackendMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export class StorageManager {
  private conversationLoaded: boolean = false;
  private apiUrl: string;

  constructor(private siteId: string, apiUrl?: string) {
    this.apiUrl = apiUrl || DEFAULT_API_URL;
  }

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

  /**
   * Load conversation from backend API first, fallback to localStorage
   */
  async loadPersistedConversation(
    settings: WidgetSettings | null,
    sessionId: string
  ): Promise<{ messages: Message[]; sessionId?: string } | null> {
    if (!settings?.persistConversation || this.conversationLoaded) {
      return null;
    }

    try {
      // First, try to load from backend API
      const backendConversation = await this.loadConversationFromBackend(sessionId);

      if (backendConversation && backendConversation.messages.length > 0) {
        this.conversationLoaded = true;
        return {
          messages: backendConversation.messages,
          sessionId,
        };
      }

      // Fallback to localStorage if API fails or returns no messages
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

  /**
   * Load conversation from backend API
   */
  private async loadConversationFromBackend(sessionId: string): Promise<{ messages: Message[] } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/widget/${this.siteId}/conversation/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to load conversation from backend:', response.status);
        return null;
      }

      const data = await response.json();

      // Transform backend messages to widget message format
      const messages: Message[] = data.messages.map((msg: BackendMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt).getTime(),
      }));

      return { messages };
    } catch (error) {
      console.warn('Error loading conversation from backend:', error);
      return null;
    }
  }
}
