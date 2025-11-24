import './styles.css';

// Import types from refactored modules
import type {
  WidgetConfig,
  WidgetSettings,
  Message,
  ConversationStarters,
  WidgetState,
  WidgetMode,
  AnalyticsEventData,
} from './types';

// Import utilities
import {
  validateConfig,
  sanitizeHtml,
  debounce,
  throttle,
  RateLimiter,
  FocusTrap,
} from './utils';

// Import constants
import {
  WIDGET_ERRORS,
  MESSAGES_PER_PAGE,
  DEFAULT_API_URL,
  STARTERS_TIMEOUT,
  NOTIFICATION_PREVIEW_LENGTH,
  BREAKPOINTS,
  STORAGE_KEYS,
  MARK_READ_DELAY,
  DEBOUNCE_DELAY,
  THROTTLE_DELAY,
  RATE_LIMITS,
} from './constants';

// Import core
import { WidgetError } from './core/WidgetError';
import { StateManager } from './core/StateManager';

// Import managers
import { StorageManager } from './managers/StorageManager';
import { NotificationManager } from './managers/NotificationManager';
import { AnalyticsManager } from './managers/AnalyticsManager';
import { SettingsManager } from './managers/SettingsManager';
import { SocketManager } from './managers/SocketManager';

// Import handlers
import { MessageHandler } from './handlers/MessageHandler';
import { FileHandler } from './handlers/FileHandler';
import { VoiceHandler } from './handlers/VoiceHandler';
import { KeyboardHandler } from './handlers/KeyboardHandler';

// Import renderers
import { LauncherRenderer } from './renderers/LauncherRenderer';
import { ChatWindowRenderer } from './renderers/ChatWindowRenderer';
import { ComponentRenderer } from './renderers/ComponentRenderer';

// Import speech recognition types from types module
import type { WebKitSpeechRecognition } from './types/speech';

declare global {
  interface Window {
    webkitSpeechRecognition: new () => WebKitSpeechRecognition;
    lastAssistantMessage?: HTMLElement;
  }
}

class IntelligentconvoWidget {
  private config: WidgetConfig;
  private sessionId: string;
  private container: HTMLElement | null = null;
  private messages: Message[] = [];
  private stateManager: StateManager;
  private speechRecognition: WebKitSpeechRecognition | null = null;
  private settings: WidgetSettings | null = null;
  private isMobile: boolean = false;
  private isTablet: boolean = false;
  private notificationAudio: HTMLAudioElement | null = null;
  private notificationPermission: NotificationPermission = 'default';
  private pendingFiles: File[] = [];
  private quickReplies: string[] = [];

  // Event handler references for cleanup
  private resizeHandler: (() => void) | null = null;
  private escapeKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  // Rate limiters
  private messageRateLimiter: RateLimiter;
  private fileRateLimiter: RateLimiter;

  // Focus trap for modal accessibility
  private focusTrap: FocusTrap | null = null;

  // Managers
  private storageManager: StorageManager;
  private notificationManager: NotificationManager;
  private analyticsManager: AnalyticsManager;
  private settingsManager: SettingsManager;
  private socketManager: SocketManager;

  // Handlers
  private messageHandler: MessageHandler;
  private fileHandler: FileHandler;
  private voiceHandler: VoiceHandler;
  private keyboardHandler: KeyboardHandler;

  // Renderers
  private launcherRenderer: LauncherRenderer;
  private chatWindowRenderer: ChatWindowRenderer;
  private componentRenderer: ComponentRenderer;

  constructor(config: WidgetConfig) {
    this.validateConfig(config);

    this.config = {
      mode: 'button',
      position: 'bottom-right',
      apiUrl: DEFAULT_API_URL,
      theme: 'auto',
      language: 'en',
      loadSettingsFromServer: true,
      ...config,
    };

    // Initialize centralized state manager
    this.stateManager = new StateManager({
      isOpen: false,
      isConnected: false,
      isTyping: false,
      hasError: false,
      currentMode: 'chat',
      emojiPickerVisible: false,
      conversationLoaded: false,
      loadedMessageCount: 0,
      unreadCount: 0,
    });

    // Initialize rate limiters
    this.messageRateLimiter = new RateLimiter(
      RATE_LIMITS.MESSAGES_PER_MINUTE,
      RATE_LIMITS.MESSAGES_TIME_WINDOW
    );
    this.fileRateLimiter = new RateLimiter(
      RATE_LIMITS.FILES_PER_MINUTE,
      RATE_LIMITS.FILES_TIME_WINDOW
    );

    // Initialize managers
    this.storageManager = new StorageManager(this.config.siteId);
    this.sessionId = this.storageManager.getOrCreateSession();

    // Create a simple state object that will be kept in sync
    const compatibleState: WidgetState = {
      isOpen: false,
      isConnected: false,
      isTyping: false,
      hasError: false,
    };

    // Subscribe to state changes and update the compatible state object
    this.stateManager.subscribe((newState) => {
      compatibleState.isOpen = newState.isOpen;
      compatibleState.isConnected = newState.isConnected;
      compatibleState.isTyping = newState.isTyping;
      compatibleState.hasError = newState.hasError;
      compatibleState.errorMessage = newState.errorMessage;
    });

    this.notificationManager = new NotificationManager(compatibleState, () => this.openChat());
    this.analyticsManager = new AnalyticsManager(this.config.siteId, () => this.sessionId);
    this.settingsManager = new SettingsManager(
      this.config.siteId,
      this.config.apiUrl || DEFAULT_API_URL,
      this.config.loadSettingsFromServer !== false
    );

    // Initialize socket manager with event handlers
    this.socketManager = new SocketManager(
      this.config,
      compatibleState,
      {
        onConnect: () => {
          console.log('[Widget] Socket onConnect fired');
          // Update state through StateManager
          this.stateManager.setConnected(true);
          console.log('[Widget] State updated - isConnected:', this.stateManager.getState().isConnected);
          this.stateManager.setError(false);

          if (this.config.onConnect) {
            this.config.onConnect();
          }
        },
        onDisconnect: (_reason: string) => {
          // Update state through StateManager
          this.stateManager.setConnected(false);

          if (this.config.onDisconnect) {
            this.config.onDisconnect();
          }
        },
        onStream: (chunk: string) => {
          try {
            // Create assistant message on first chunk
            if (!window.lastAssistantMessage) {
              this.displayMessage('assistant', '');
              this.setTyping(false); // Hide typing indicator once we start receiving
            }
            this.appendToLastMessage(chunk);
          } catch {
            this.handleError(new Error('Failed to process message stream'), 'stream');
          }
        },
        onComplete: (content: string, quickReplies?: string[]) => {
          this.setTyping(false);

          // Play notification sound and show desktop notification
          this.playNotificationSound();
          this.showDesktopNotification(
            this.settings?.botName || 'Assistant',
            content.substring(0, NOTIFICATION_PREVIEW_LENGTH) + (content.length > NOTIFICATION_PREVIEW_LENGTH ? '...' : '')
          );

          // Track message received
          this.trackAnalyticsEvent('message_received', { length: content.length });

          // Save conversation
          this.saveConversation();

          // Mark messages as read if chat is open
          if (this.stateManager.getState().isOpen) {
            this.markAllMessagesAsRead();
          }

          // Render quick replies if provided
          if (quickReplies && quickReplies.length > 0) {
            this.renderQuickReplies(quickReplies);
          }
        },
        onError: (message: string) => {
          const error = new WidgetError(message || 'Unknown socket error', WIDGET_ERRORS.CONNECTION_FAILED);
          this.handleError(error, 'socket');
          this.setTyping(false);
        },
        onTyping: (isTyping: boolean) => {
          this.setTyping(isTyping);
        },
        onConnectionError: (error: Error) => {
          this.handleError(
            new WidgetError(
              'Failed to connect to chat service',
              WIDGET_ERRORS.CONNECTION_FAILED,
              { message: error.message, stack: error.stack }
            ),
            'connect'
          );
        },
        onTrialExpired: (data) => {
          this.setTyping(false);
          this.displayTrialExpiredMessage(data.reason);
          this.trackAnalyticsEvent('trial_expired', { reason: data.reason });
        }
      }
    );

    // Initialize message handler
    this.messageHandler = new MessageHandler({
      getSocket: () => this.socketManager.getSocket(),
      sessionId: this.sessionId,
      siteId: this.config.siteId,
      settings: this.settings,
      messages: this.messages,
      isConnected: () => this.stateManager.getState().isConnected,
      onMessage: this.config.onMessage,
      onError: this.config.onError,
      setTyping: this.setTyping.bind(this),
      trackAnalyticsEvent: (eventName: string, eventData?: AnalyticsEventData) => {
        this.analyticsManager.trackAnalyticsEvent(eventName, eventData);
      },
      saveConversation: () => {
        this.storageManager.saveConversation(this.messages, this.sessionId, this.settings);
      },
      showErrorMessage: this.showErrorMessage.bind(this),
      prepareFileAttachments: this.prepareFileAttachments.bind(this),
      clearPendingFiles: () => {
        this.pendingFiles = [];
      },
      updateFilePreview: this.updateFilePreview.bind(this),
      rateLimiter: this.messageRateLimiter,
    });

    // Initialize file handler
    this.fileHandler = new FileHandler({
      settings: this.settings,
      pendingFiles: this.pendingFiles,
      showErrorMessage: this.showErrorMessage.bind(this),
      trackAnalyticsEvent: (eventName: string, eventData?: AnalyticsEventData) => {
        this.analyticsManager.trackAnalyticsEvent(eventName, eventData);
      },
      sanitizeHtml: (html: string) => sanitizeHtml(html),
      rateLimiter: this.fileRateLimiter,
    });

    // Initialize voice handler
    this.voiceHandler = new VoiceHandler({
      settings: this.settings,
      sendMessage: this.sendMessage.bind(this),
      onError: this.config.onError,
    });

    // Initialize keyboard handler
    this.keyboardHandler = new KeyboardHandler({
      settings: this.settings,
    });

    // Initialize renderers
    this.launcherRenderer = new LauncherRenderer(this.settings, this.config);
    this.chatWindowRenderer = new ChatWindowRenderer(this.settings, this.config, this.isMobile);
    this.componentRenderer = new ComponentRenderer(this.settings);

    this.detectDevice();
    this.init();
  }

  private detectDevice(): void {
    const width = window.innerWidth;
    this.isMobile = width < (this.settings?.mobileBreakpoint || BREAKPOINTS.MOBILE);
    this.isTablet = width >= (this.settings?.mobileBreakpoint || BREAKPOINTS.MOBILE) && width < (this.settings?.tabletBreakpoint || BREAKPOINTS.TABLET);

    // Update SettingsManager with device type
    this.settingsManager.setDeviceType(this.isMobile, this.isTablet);

    // Update chat window renderer with mobile state
    this.chatWindowRenderer.updateMobileState(this.isMobile);

    // Create debounced resize handler
    this.resizeHandler = debounce(() => {
      const newWidth = window.innerWidth;
      const wasMobile = this.isMobile;
      const wasTablet = this.isTablet;

      this.isMobile = newWidth < (this.settings?.mobileBreakpoint || BREAKPOINTS.MOBILE);
      this.isTablet = newWidth >= (this.settings?.mobileBreakpoint || BREAKPOINTS.MOBILE) && newWidth < (this.settings?.tabletBreakpoint || BREAKPOINTS.TABLET);

      // Re-apply settings if device type changed
      if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
        this.settingsManager.setDeviceType(this.isMobile, this.isTablet);
        // Update chat window renderer with new mobile state
        this.chatWindowRenderer.updateMobileState(this.isMobile);
      }
    }, DEBOUNCE_DELAY.RESIZE);

    // Listen for resize events
    window.addEventListener('resize', this.resizeHandler);
  }

  private async loadSettings(): Promise<void> {
    await this.settingsManager.loadSettings();
    this.settings = this.settingsManager.getSettings();

    // Update other managers with settings
    this.notificationManager.setSettings(this.settings);
    this.analyticsManager.setSettings(this.settings);

    // Update renderers with loaded settings
    this.launcherRenderer.updateSettings(this.settings);
    this.chatWindowRenderer.updateSettings(this.settings);
    this.componentRenderer.updateSettings(this.settings);
  }

  private validateConfig(config: WidgetConfig): void {
    validateConfig(config);
  }

  private handleError(error: Error | WidgetError, context?: string): void {
    console.error(`[IntelligentconvoWidget${context ? ` - ${context}` : ''}]:`, error);

    this.stateManager.setError(true, error.message);

    if (this.config.onError) {
      this.config.onError(error);
    }

    this.showErrorMessage(error.message);
  }

  private showErrorMessage(message: string): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (messagesContainer) {
      // Use the configured error message or fallback to the provided message
      const displayMessage = this.settings?.errorMessage || message || 'Something went wrong. Please try again.';

      // Check if there's already an error message in the last position
      const lastMessage = messagesContainer.lastElementChild;
      const isLastMessageError = lastMessage?.classList.contains('intelligentconvo-error');

      if (isLastMessageError && lastMessage) {
        // Update the existing error message instead of creating a new one
        const errorContent = lastMessage.querySelector('.intelligentconvo-message-content');
        const errorTime = lastMessage.querySelector('.intelligentconvo-message-time');

        if (errorContent) {
          errorContent.innerHTML = `
            <span class="error-icon">⚠️</span>
            ${displayMessage}
          `;
        }
        if (errorTime) {
          errorTime.textContent = new Date().toLocaleTimeString();
        }
      } else {
        // Create a new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'intelligentconvo-message intelligentconvo-error';
        errorDiv.innerHTML = `
          <div class="intelligentconvo-message-content error">
            <span class="error-icon">⚠️</span>
            ${displayMessage}
          </div>
          <div class="intelligentconvo-message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(errorDiv);
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private displayTrialExpiredMessage(reason: string): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (messagesContainer) {
      const trialDiv = document.createElement('div');
      trialDiv.className = 'intelligentconvo-message intelligentconvo-trial-expired';
      trialDiv.innerHTML = `
        <div class="intelligentconvo-trial-expired-content">
          <div class="intelligentconvo-trial-expired-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="intelligentconvo-trial-expired-text">
            <strong>Free Trial Ended</strong>
            <p>Your free trial has ended. Please upgrade to continue using this assistant.</p>
          </div>
        </div>
      `;
      messagesContainer.appendChild(trialDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Disable input
      const input = document.getElementById('intelligentconvo-input') as HTMLInputElement;
      const sendBtn = document.getElementById('intelligentconvo-send');
      if (input) {
        input.disabled = true;
        input.placeholder = 'Upgrade to continue...';
      }
      if (sendBtn) {
        sendBtn.setAttribute('disabled', 'true');
      }
    }
  }

  private async init(): Promise<void> {
    try {
      // Load settings from server first
      await this.loadSettings();

      this.loadStyles();
      this.render();
      this.initializeNotifications();

      // If preloadWidget is enabled, connect immediately
      // Otherwise, connect lazily when chat is first opened
      if (this.settings?.preloadWidget !== false) {
        await this.socketManager.connect();
        this.socketManager.joinSite(this.config.siteId);
        await this.loadConversationStarters();
      }

      // Track widget initialization
      this.trackAnalyticsEvent('widget_initialized');

      // Handle auto-open if enabled
      if (this.settings?.autoOpenEnabled) {
        const shouldAutoOpen = !this.settings.autoOpenOnMobile || !this.isMobile;
        const hasOpenedBefore = sessionStorage.getItem(`${STORAGE_KEYS.AUTO_OPENED_PREFIX}${this.config.siteId}`);

        if (shouldAutoOpen && (!this.settings.autoOpenOnlyOnce || !hasOpenedBefore)) {
          setTimeout(() => {
            this.openChat();
            if (this.settings?.autoOpenOnlyOnce) {
              sessionStorage.setItem(`${STORAGE_KEYS.AUTO_OPENED_PREFIX}${this.config.siteId}`, 'true');
            }
          }, this.settings.autoOpenDelay);
        }
      }

      // Setup cleanup on page unload
      this.beforeUnloadHandler = () => this.cleanup();
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Widget initialization failed'), 'init');
    }
  }

  public cleanup(): void {
    // Disconnect socket
    this.socketManager.disconnect();

    // Cleanup handlers
    this.voiceHandler.cleanup();
    this.keyboardHandler.cleanup();

    // Cleanup state manager
    this.stateManager.cleanup();

    // Stop speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }

    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.escapeKeyHandler) {
      document.removeEventListener('keydown', this.escapeKeyHandler);
      this.escapeKeyHandler = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  private loadStyles() {
    // Styles are injected via webpack
  }

  private render() {
    if (this.config.mode === 'button') {
      this.renderButton();
    } else {
      this.renderWidget();
    }
  }

  private renderButton(): void {
    const button = this.launcherRenderer.renderButton(() => this.toggleChat());
    document.body.appendChild(button);
    this.container = button;
  }

  private renderWidget() {
    const widget = document.createElement('div');
    widget.id = 'intelligentconvo-widget';
    widget.className = 'intelligentconvo-widget-container';
    widget.innerHTML = this.getWidgetHTML();

    // Find a container or append to body
    const targetContainer = document.querySelector('#intelligentconvo-container') || document.body;
    targetContainer.appendChild(widget);

    this.container = widget;
    this.setupEventListeners();
  }

  private getWidgetHTML(): string {
    return this.chatWindowRenderer.getWidgetHTML();
  }

  private getChatWindowHTML(): string {
    return this.chatWindowRenderer.getChatWindowHTML();
  }

  private toggleChat(): void {
    if (this.stateManager.getState().isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  private async openChat(): Promise<void> {
    if (this.config.mode === 'button') {
      // Create chat window
      const chatWindow = document.createElement('div');
      chatWindow.innerHTML = this.getChatWindowHTML();
      const windowElement = chatWindow.firstElementChild as HTMLElement;
      document.body.appendChild(windowElement);

      this.setupEventListeners();

      // Setup keyboard navigation if enabled
      this.setupKeyboardNavigation();

      // Setup lazy loading if enabled
      this.setupLazyLoading();

      // Load persisted conversation if enabled
      this.loadPersistedConversation();

      // If preloadWidget was false, connect now
      if (this.settings?.preloadWidget === false && !this.socketManager.isConnected()) {
        try {
          await this.socketManager.connect();
          this.socketManager.joinSite(this.config.siteId);
          await this.loadConversationStarters();
        } catch (error) {
          console.error('Failed to connect:', error);
        }
      }


      // Setup focus trap for accessibility
      this.focusTrap = new FocusTrap(windowElement);
      this.focusTrap.activate();

      // Mark all messages as read when opening
      setTimeout(() => this.markAllMessagesAsRead(), MARK_READ_DELAY);
    }

    this.stateManager.setOpen(true);
    document.body.classList.add('intelligentconvo-chat-open');

    // Track chat opened
    this.trackAnalyticsEvent('chat_opened');

    // Update button aria-label
    const button = document.getElementById('intelligentconvo-button');
    if (button) {
      button.setAttribute('aria-label', 'Close chat');
      button.setAttribute('title', 'Close chat');
    }
  }

  private closeChat(): void {
    // Deactivate focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }

    if (this.config.mode === 'button') {
      const chatWindow = document.getElementById('intelligentconvo-chat-window');
      if (chatWindow) {
        chatWindow.remove();
      }
    }

    // Reset conversation loaded flag to allow reloading on next open
    this.storageManager.resetConversationLoaded();

    // Clear the messages array in place (not reassign) to maintain reference for MessageHandler
    this.messages.length = 0;

    this.stateManager.setOpen(false);
    document.body.classList.remove('intelligentconvo-chat-open');

    // Track chat closed
    this.trackAnalyticsEvent('chat_closed');

    // Update button aria-label
    const button = document.getElementById('intelligentconvo-button');
    if (button) {
      button.setAttribute('aria-label', 'Open chat');
      button.setAttribute('title', 'Open chat');
    }
  }

  private setupEventListeners(): void {
    const closeBtn = document.getElementById('intelligentconvo-close');
    const minimizeBtn = document.getElementById('intelligentconvo-minimize');
    const sendBtn = document.getElementById('intelligentconvo-send');
    const input = document.getElementById('intelligentconvo-input') as HTMLInputElement;
    const micBtn = document.getElementById('intelligentconvo-mic');
    const attachBtn = document.getElementById('intelligentconvo-attach');
    const emojiBtn = document.getElementById('intelligentconvo-emoji-btn');
    const tabs = document.querySelectorAll('.intelligentconvo-tab');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeChat());
      closeBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.closeChat();
        }
      });
    }

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.closeChat());
      minimizeBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.closeChat();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSendMessage());
      sendBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    if (input) {
      input.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      // Auto-resize input for better UX
      input.addEventListener('input', () => {
        if (input.value.length > 0) {
          sendBtn?.removeAttribute('disabled');
        } else {
          sendBtn?.setAttribute('disabled', 'true');
        }
      });
    }

    if (micBtn) {
      micBtn.addEventListener('click', () => this.handleVoiceInput());
      micBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleVoiceInput();
        }
      });
    }

    if (attachBtn) {
      attachBtn.addEventListener('click', () => this.handleFileAttachment());
      attachBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleFileAttachment();
        }
      });
    }

    if (emojiBtn) {
      emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
      emojiBtn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleEmojiPicker();
        }
      });
    }

    // Tab navigation
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => this.handleTabSwitch(e));
      tab.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          this.handleTabSwitch(e);
        }
      });
    });

    // Escape key to close chat
    this.escapeKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.stateManager.getState().isOpen) {
        this.closeChat();
      }
    };
    document.addEventListener('keydown', this.escapeKeyHandler);
  }

  private handleTabSwitch(e: Event): void {
    const clickedTab = e.target as HTMLElement;
    const mode = clickedTab.getAttribute('data-mode') as WidgetMode;

    if (mode && mode !== this.stateManager.getState().currentMode) {
      // Update visual state
      document.querySelectorAll('.intelligentconvo-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      });

      clickedTab.classList.add('active');
      clickedTab.setAttribute('aria-selected', 'true');

      this.stateManager.setMode(mode);

      // Could implement mode-specific functionality here
      console.log(`Switched to ${mode} mode`);
    }
  }

  private async loadConversationStarters(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STARTERS_TIMEOUT);

      const response = await fetch(`${this.config.apiUrl}/api/v1/widget/${this.config.siteId}/starters`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new WidgetError('Site not found', WIDGET_ERRORS.SITE_NOT_FOUND);
        }
        throw new WidgetError(`Failed to load conversation starters: ${response.status}`, WIDGET_ERRORS.CONNECTION_FAILED);
      }

      const data: ConversationStarters = await response.json();
      this.renderStarters(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.handleError(new WidgetError('Request timeout', WIDGET_ERRORS.CONNECTION_FAILED), 'loadStarters');
      } else {
        this.handleError(error instanceof WidgetError ? error : new Error('Failed to load conversation starters'), 'loadStarters');
      }
    }
  }

  private renderStarters(data: ConversationStarters): void {
    this.componentRenderer.renderStarters(
      data,
      (text: string) => this.sendMessage(text),
      (html: string) => sanitizeHtml(html)
    );
  }

  private handleSendMessage(): void {
    this.messageHandler.handleSendMessage();
  }

  private async sendMessage(text: string): Promise<void> {
    await this.messageHandler.sendMessage(text);
  }


  private displayMessage(role: 'user' | 'assistant', content: string, messageId?: string): void {
    this.messageHandler.displayMessage(role, content, messageId);
  }

  private sanitizeHtml(html: string): string {
    return sanitizeHtml(html);
  }


  private appendToLastMessage(chunk: string): void {
    this.messageHandler.appendToLastMessage(chunk);
  }

  private setTyping(typing: boolean): void {
    this.stateManager.setTyping(typing);
    const typingIndicator = document.getElementById('intelligentconvo-typing');

    if (typingIndicator) {
      typingIndicator.style.display = typing ? 'flex' : 'none';
    }
  }

  private handleVoiceInput(): void {
    this.voiceHandler.handleVoiceInput();
  }

  private initializeNotifications(): void {
    this.notificationManager.initializeNotifications();
  }

  private playNotificationSound(): void {
    this.notificationManager.playNotificationSound();
  }

  private showDesktopNotification(title: string, body: string): void {
    this.notificationManager.showDesktopNotification(title, body);
  }

  private trackAnalyticsEvent(eventName: string, eventData?: AnalyticsEventData): void {
    this.analyticsManager.trackAnalyticsEvent(eventName, eventData);
  }

  // Read Receipts
  private markMessageAsRead(messageId: string): void {
    if (!this.settings?.showReadReceipts) return;

    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement && !messageElement.classList.contains('read')) {
      messageElement.classList.add('read');

      // Add read receipt indicator
      const wrapper = messageElement.querySelector('.intelligentconvo-message-wrapper');
      if (wrapper && !wrapper.querySelector('.intelligentconvo-read-receipt')) {
        const receipt = document.createElement('span');
        receipt.className = 'intelligentconvo-read-receipt';
        receipt.innerHTML = '✓✓';
        receipt.setAttribute('aria-label', 'Read');
        wrapper.appendChild(receipt);
      }

      // Track read receipt
      this.trackAnalyticsEvent('message_read', { messageId });
    }
  }

  private markAllMessagesAsRead(): void {
    if (!this.settings?.showReadReceipts) return;

    const messages = document.querySelectorAll('.intelligentconvo-message.intelligentconvo-user:not(.read)');
    messages.forEach(message => {
      const messageId = message.getAttribute('data-message-id');
      if (messageId) {
        this.markMessageAsRead(messageId);
      }
    });
  }

  private handleFileAttachment(): void {
    this.fileHandler.handleFileAttachment();
  }

  private updateFilePreview(): void {
    this.fileHandler.updateFilePreview();
  }

  private async prepareFileAttachments(): Promise<Array<{ name: string; type: string; data: string }>> {
    return await this.fileHandler.prepareFileAttachments();
  }


  // Emoji Picker
  private toggleEmojiPicker(): void {
    if (!this.settings?.enableEmojiPicker) return;

    const newVisibility = !this.stateManager.getState().emojiPickerVisible;
    this.stateManager.setEmojiPicker(newVisibility);

    let picker = document.getElementById('intelligentconvo-emoji-picker');

    if (newVisibility) {
      if (!picker) {
        picker = document.createElement('div');
        picker.id = 'intelligentconvo-emoji-picker';
        picker.className = 'intelligentconvo-emoji-picker';
        picker.innerHTML = this.getEmojiPickerHTML();

        const inputArea = document.querySelector('.intelligentconvo-input');
        if (inputArea) {
          // Insert inside the input area so absolute positioning works
          inputArea.insertBefore(picker, inputArea.firstChild);
        }

        // Add emoji click handlers
        picker.querySelectorAll('.intelligentconvo-emoji').forEach(emoji => {
          emoji.addEventListener('click', (e) => {
            const emojiChar = (e.target as HTMLElement).textContent;
            this.insertEmoji(emojiChar || '');
          });
        });
      }
      picker.style.display = 'block';
    } else if (picker) {
      picker.style.display = 'none';
    }

    this.trackAnalyticsEvent('emoji_picker_toggled', { visible: this.stateManager.getState().emojiPickerVisible });
  }

  private getEmojiPickerHTML(): string {
    return this.componentRenderer.getEmojiPickerHTML();
  }

  private insertEmoji(emoji: string): void {
    const input = document.getElementById('intelligentconvo-input') as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;
      input.value = text.substring(0, start) + emoji + text.substring(end);
      input.selectionStart = input.selectionEnd = start + emoji.length;
      input.focus();
    }
    this.toggleEmojiPicker(); // Close picker after selection
  }

  // Conversation Persistence
  private saveConversation(): void {
    this.storageManager.saveConversation(this.messages, this.sessionId, this.settings);
  }

  private loadPersistedConversation(): void {
    const data = this.storageManager.loadPersistedConversation(this.settings);

    if (data && data.messages.length > 0) {
      // Push loaded messages to existing array (don't reassign to maintain MessageHandler reference)
      this.messages.push(...data.messages);

      if (data.sessionId) {
        this.sessionId = data.sessionId;
      }

      // Display loaded messages (render only, don't add to array again)
      data.messages.forEach((msg: Message) => {
        this.renderPersistedMessage(msg);
      });

      // Hide starters if there are messages
      const starters = document.getElementById('intelligentconvo-starters');
      if (starters) {
        starters.style.display = 'none';
      }
    }
  }

  /**
   * Renders a persisted message to the DOM without adding to messages array
   */
  private renderPersistedMessage(msg: Message): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `intelligentconvo-message intelligentconvo-${msg.role}`;
    messageDiv.setAttribute('data-message-id', msg.id);

    // Format timestamp from message
    const showTimestamp = this.settings?.messageTimestampShow !== false;
    const timestampFormat = this.settings?.messageTimestampFormat || 'HH:mm';
    const msgDate = new Date(msg.timestamp);
    let formattedTime = '';
    if (showTimestamp) {
      if (timestampFormat === 'HH:mm') {
        formattedTime = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (timestampFormat === 'hh:mm A') {
        formattedTime = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      } else if (timestampFormat === 'HH:mm:ss') {
        formattedTime = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      } else {
        formattedTime = msgDate.toLocaleTimeString();
      }
    }

    // Show avatar for assistant messages if enabled
    const showAvatar = this.settings?.showMessageAvatar && msg.role === 'assistant';
    const avatarHtml = showAvatar ? `
      <div class="intelligentconvo-message-avatar">
        ${this.settings?.botAvatarUrl
          ? `<img src="${this.settings.botAvatarUrl}" alt="${this.settings?.botName || 'Assistant'}" />`
          : `<span>${this.settings?.botAvatarFallback || 'AI'}</span>`
        }
      </div>
    ` : '';

    const sanitizedContent = msg.role === 'assistant'
      ? this.sanitizeHtml(msg.content)
      : this.sanitizeHtml(msg.content);

    messageDiv.innerHTML = `
      ${avatarHtml}
      <div class="intelligentconvo-message-wrapper">
        <div class="intelligentconvo-message-content">${sanitizedContent || ''}</div>
        ${showTimestamp ? `<div class="intelligentconvo-message-time">${formattedTime}</div>` : ''}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private renderQuickReplies(replies: string[]): void {
    this.quickReplies = replies;
    this.componentRenderer.renderQuickReplies(
      replies,
      (text: string) => this.sendMessage(text),
      (html: string) => sanitizeHtml(html)
    );
  }

  private setupKeyboardNavigation(): void {
    this.keyboardHandler.setupKeyboardNavigation();
  }

  // Lazy Load Messages
  private setupLazyLoading(): void {
    if (!this.settings?.lazyLoadMessages) return;

    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (!messagesContainer) return;

    // Throttle scroll event for better performance
    const throttledScroll = throttle(() => {
      // Load more messages when scrolled to top
      if (messagesContainer.scrollTop === 0 && this.messages.length > this.stateManager.getState().loadedMessageCount) {
        this.loadMoreMessages();
      }
    }, THROTTLE_DELAY.SCROLL);

    messagesContainer.addEventListener('scroll', throttledScroll);
  }

  private loadMoreMessages(): void {
    if (!this.settings?.lazyLoadMessages) return;

    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (!messagesContainer) return;

    const previousScrollHeight = messagesContainer.scrollHeight;
    const currentLoaded = this.stateManager.getState().loadedMessageCount;
    const startIndex = Math.max(0, this.messages.length - currentLoaded - MESSAGES_PER_PAGE);
    const endIndex = this.messages.length - currentLoaded;

    const messagesToLoad = this.messages.slice(startIndex, endIndex);

    // Prepend messages
    messagesToLoad.reverse().forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `intelligentconvo-message intelligentconvo-${msg.role}`;
      messageDiv.setAttribute('data-message-id', msg.id);

      const sanitizedContent = this.sanitizeHtml(msg.content);
      messageDiv.innerHTML = `
        <div class="intelligentconvo-message-wrapper">
          <div class="intelligentconvo-message-content">${sanitizedContent}</div>
        </div>
      `;

      messagesContainer.insertBefore(messageDiv, messagesContainer.firstChild);
    });

    this.stateManager.setLoadedMessageCount(
      this.stateManager.getState().loadedMessageCount + messagesToLoad.length
    );

    // Maintain scroll position
    messagesContainer.scrollTop = messagesContainer.scrollHeight - previousScrollHeight;
  }

}

// Import global types
import type { WidgetCommand, IntelligentconvoQueue, IntelligentconvoInit } from './types/global';

// Global initialization function
const intelligentconvoGlobal = window.intelligentconvo as IntelligentconvoQueue;
window.intelligentconvo = intelligentconvoGlobal || function(...args: unknown[]) {
  ((window.intelligentconvo as IntelligentconvoQueue).q =
    (window.intelligentconvo as IntelligentconvoQueue).q || []).push(args as WidgetCommand);
};

// Process queued commands
(window.intelligentconvo as IntelligentconvoQueue)._init = () => {
  const commands = (window.intelligentconvo as IntelligentconvoQueue).q || [];

  commands.forEach((command: WidgetCommand) => {
    if (command[0] === 'init' && command[1]) {
      new IntelligentconvoWidget(command[1] as WidgetConfig);
    }
  });

  // Replace function to handle future commands
  const initFn: IntelligentconvoInit = (command: string, config?: WidgetConfig) => {
    if (command === 'init' && config) {
      new IntelligentconvoWidget(config);
    }
  };
  window.intelligentconvo = initFn;
};

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    (window.intelligentconvo as IntelligentconvoQueue)._init?.();
  });
} else {
  (window.intelligentconvo as IntelligentconvoQueue)._init?.();
}

export default IntelligentconvoWidget;