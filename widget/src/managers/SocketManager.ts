import { io, Socket } from 'socket.io-client';
import { WidgetConfig } from '../types/config';
import { WidgetState } from '../types/state';
import { MessageData } from '../types/handlers';
import { MAX_RECONNECT_ATTEMPTS, CONNECTION_TIMEOUT, INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY } from '../constants';

// Socket event data types
interface StreamEventData {
  chunk: string;
}

interface CompleteEventData {
  messageId: string;
  conversationId: string;
  content: string;
  quickReplies?: string[];
  suggestsHandoff?: boolean;
}

interface ErrorEventData {
  message: string;
}

interface TypingEventData {
  isTyping: boolean;
}

interface MessageRoutedToAgentEventData {
  conversationId: string;
  messageId: string;
}

// Human handoff event data types
interface ConversationStatusChangedEventData {
  conversationId: string;
  status: 'ACTIVE' | 'NEEDS_AGENT' | 'AGENT_ACTIVE' | 'RESOLVED';
  previousStatus: 'ACTIVE' | 'NEEDS_AGENT' | 'AGENT_ACTIVE' | 'RESOLVED';
}

interface AgentJoinedEventData {
  agentId: string;
  agentName: string;
  agentEmail: string;
}

interface AgentTypingEventData {
  agentId: string;
  isTyping: boolean;
}

interface AgentMessageEventData {
  messageId: string;
  agentId: string;
  content: string;
  timestamp: string;
}

interface AgentLeftEventData {
  agentId: string;
  agentName: string;
}

interface ConversationMessageEventData {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'AGENT';
  content: string;
  timestamp: string;
  agentId?: string;
}

interface ConversationResolvedEventData {
  conversationId: string;
  message: string;
  requestFeedback: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

// Socket event handlers interface
export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (message: string, code?: string) => void;
  onStream?: (chunk: string) => void;
  onComplete?: (content: string, conversationId: string, quickReplies?: string[], suggestsHandoff?: boolean) => void;
  onTyping?: (isTyping: boolean) => void;
  onConnectionError?: (error: Error) => void;
  onMessageRoutedToAgent?: (data: MessageRoutedToAgentEventData) => void;
  // Human handoff event handlers
  onConversationStatusChanged?: (data: ConversationStatusChangedEventData) => void;
  onAgentJoined?: (data: AgentJoinedEventData) => void;
  onAgentTyping?: (data: AgentTypingEventData) => void;
  onAgentMessage?: (data: AgentMessageEventData) => void;
  onAgentLeft?: (data: AgentLeftEventData) => void;
  onConversationMessage?: (data: ConversationMessageEventData) => void;
  onConversationResolved?: (data: ConversationResolvedEventData) => void;
}

export class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private config: WidgetConfig;
  private state: WidgetState;
  private eventHandlers: SocketEventHandlers;

  constructor(
    config: WidgetConfig,
    state: WidgetState,
    eventHandlers: SocketEventHandlers = {}
  ) {
    this.config = config;
    this.state = state;
    this.eventHandlers = eventHandlers;
  }

  /**
   * Connect to the socket.io server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.apiUrl!, {
          transports: ['websocket', 'polling'],
          timeout: CONNECTION_TIMEOUT,
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: INITIAL_RECONNECT_DELAY,
        });

        this.setupEventListeners();

        // Resolve on successful connection
        this.socket.once('connect', () => {
          resolve();
        });

        // Reject on connection error
        this.socket.once('connect_error', (error: Error) => {
          reject(error);
        });

        // Timeout for initial connection
        setTimeout(() => {
          if (!this.state.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, CONNECTION_TIMEOUT);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup all socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('Connected to IntelliConvo');
      // NOTE: State is now managed by parent widget through onConnect callback
      // to avoid direct mutation and state synchronization issues
      this.reconnectAttempts = 0;

      this.updateConnectionStatus('connected');
      this.socket!.emit('join-site', this.config.siteId);

      if (this.config.onConnect) {
        this.config.onConnect();
      }

      if (this.eventHandlers.onConnect) {
        this.eventHandlers.onConnect();
      }
    });

    // Streaming message chunks
    this.socket.on('stream', (data: StreamEventData) => {
      if (this.eventHandlers.onStream) {
        this.eventHandlers.onStream(data.chunk);
      }
    });

    // Message complete
    this.socket.on('complete', (data: CompleteEventData) => {
      if (this.eventHandlers.onComplete) {
        this.eventHandlers.onComplete(data.content, data.conversationId, data.quickReplies, data.suggestsHandoff);
      }
    });

    // Socket error
    this.socket.on('error', (data: ErrorEventData) => {
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(data.message || 'Unknown socket error');
      }
    });

    // Typing indicator
    this.socket.on('typing', (data: TypingEventData) => {
      if (this.eventHandlers.onTyping) {
        this.eventHandlers.onTyping(data.isTyping);
      }
    });

    // Message routed to agent (stops typing indicator)
    this.socket.on('message-routed-to-agent', (data: MessageRoutedToAgentEventData) => {
      console.log('[SocketManager] Message routed to agent:', data);
      if (this.eventHandlers.onMessageRoutedToAgent) {
        this.eventHandlers.onMessageRoutedToAgent(data);
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from IntelliConvo:', reason);
      // NOTE: State is now managed by parent widget through onDisconnect callback
      this.updateConnectionStatus('disconnected');

      if (this.config.onDisconnect) {
        this.config.onDisconnect();
      }

      if (this.eventHandlers.onDisconnect) {
        this.eventHandlers.onDisconnect(reason);
      }

      // Attempt to reconnect if not intentional
      if (reason === 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);

      if (this.eventHandlers.onConnectionError) {
        this.eventHandlers.onConnectionError(error);
      }
    });

    // Human handoff events
    this.socket.on('conversation-status-changed', (data: ConversationStatusChangedEventData) => {
      if (this.eventHandlers.onConversationStatusChanged) {
        this.eventHandlers.onConversationStatusChanged(data);
      }
    });

    this.socket.on('agent-joined', (data: AgentJoinedEventData) => {
      if (this.eventHandlers.onAgentJoined) {
        this.eventHandlers.onAgentJoined(data);
      }
    });

    this.socket.on('agent-typing', (data: AgentTypingEventData) => {
      if (this.eventHandlers.onAgentTyping) {
        this.eventHandlers.onAgentTyping(data);
      }
    });

    this.socket.on('agent-message', (data: AgentMessageEventData) => {
      if (this.eventHandlers.onAgentMessage) {
        this.eventHandlers.onAgentMessage(data);
      }
    });

    this.socket.on('agent-left', (data: AgentLeftEventData) => {
      if (this.eventHandlers.onAgentLeft) {
        this.eventHandlers.onAgentLeft(data);
      }
    });

    this.socket.on('conversation-message', (data: ConversationMessageEventData) => {
      console.log('[SocketManager] Received conversation-message:', data);
      if (this.eventHandlers.onConversationMessage) {
        this.eventHandlers.onConversationMessage(data);
      }
    });

    this.socket.on('conversation-resolved', (data: ConversationResolvedEventData) => {
      console.log('[SocketManager] Conversation resolved:', data);
      if (this.eventHandlers.onConversationResolved) {
        this.eventHandlers.onConversationResolved(data);
      }
    });
  }

  /**
   * Send a message through the socket
   */
  sendMessage(messageData: MessageData): void {
    if (!this.socket || !this.state.isConnected) {
      throw new Error('Socket is not connected');
    }

    this.socket.emit('message', messageData);
  }

  /**
   * Join a site room
   */
  joinSite(siteId: string): void {
    if (!this.socket || !this.state.isConnected) {
      throw new Error('Socket is not connected');
    }

    this.socket.emit('join-site', siteId);
  }

  /**
   * Join a conversation room for real-time updates
   */
  joinConversation(conversationId: string): void {
    if (!this.socket || !this.state.isConnected) {
      throw new Error('Socket is not connected');
    }

    this.socket.emit('join-conversation', conversationId);
  }

  /**
   * Request a human agent
   */
  requestAgent(conversationId: string, reason?: string): void {
    if (!this.socket || !this.state.isConnected) {
      throw new Error('Socket is not connected');
    }

    this.socket.emit('request-agent', { conversationId, reason });
  }

  /**
   * Submit feedback rating
   */
  submitFeedback(conversationId: string, rating: number, comment?: string): void {
    if (!this.socket || !this.state.isConnected) {
      throw new Error('Socket is not connected');
    }

    this.socket.emit('submit-feedback', { conversationId, rating, comment });
  }

  /**
   * Disconnect the socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.updateConnectionStatus('disconnected');

      if (this.eventHandlers.onError) {
        this.eventHandlers.onError('Max reconnection attempts reached');
      }
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionStatus('connecting');

    // Exponential backoff with max delay
    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_DELAY);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        this.updateConnectionStatus('disconnected');
      });
    }, delay);
  }

  /**
   * Update the connection status indicator in the UI
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    const statusDot = document.getElementById('intelliconvo-status-dot');

    if (statusDot) {
      statusDot.className = `intelliconvo-status-dot ${status}`;

      // Update aria-label for accessibility
      switch (status) {
        case 'connected':
          statusDot.setAttribute('aria-label', 'Connected');
          statusDot.setAttribute('title', 'Connected');
          break;
        case 'connecting':
          statusDot.setAttribute('aria-label', 'Connecting...');
          statusDot.setAttribute('title', 'Connecting...');
          break;
        case 'disconnected':
          statusDot.setAttribute('aria-label', 'Disconnected');
          statusDot.setAttribute('title', 'Disconnected');
          break;
      }
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}
