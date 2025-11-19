import { io, Socket } from 'socket.io-client';
import './styles.css';

interface WidgetConfig {
  siteId: string;
  mode?: 'button' | 'widget';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  apiUrl?: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  customStyles?: Partial<CSSStyleDeclaration>;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  // New: option to skip loading settings from server
  loadSettingsFromServer?: boolean;
}

// Widget settings from the server
interface WidgetSettings {
  // Appearance & Branding
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightBold: number;
  borderRadius: number;
  borderRadiusSmall: number;
  borderRadiusButton: number;
  borderWidth: number;
  shadowColor: string;
  shadowSize: string;

  // Launcher Button
  launcherIcon: string;
  launcherCustomIconUrl?: string;
  launcherSize: string;
  launcherPosition: string;
  launcherOffsetX: number;
  launcherOffsetY: number;
  launcherShape: string;
  launcherBackgroundColor?: string;
  launcherIconColor: string;
  launcherBorderColor?: string;
  launcherBorderWidth: number;
  launcherText?: string;
  launcherTooltip: string;
  launcherShowTooltip: boolean;
  launcherShowBadge: boolean;
  launcherBadgeColor: string;
  launcherBadgeTextColor: string;
  launcherAnimation: string;
  launcherAnimationDelay: number;

  // Chat Window
  chatWindowWidth: number;
  chatWindowHeight: number;
  chatWindowMaxHeight: string;
  chatWindowZIndex: number;
  headerBackgroundColor?: string;
  headerTextColor: string;
  headerHeight: number;
  headerTitle: string;
  headerSubtitle?: string;
  headerShowAvatar: boolean;
  headerAvatarUrl?: string;
  headerShowStatus: boolean;
  headerShowCloseButton: boolean;
  headerShowMinimizeButton: boolean;
  messageAreaBackgroundColor?: string;
  messageAreaPadding: number;
  userBubbleBackgroundColor?: string;
  userBubbleTextColor: string;
  userBubbleBorderRadius: number;
  userBubbleAlignment: string;
  assistantBubbleBackgroundColor: string;
  assistantBubbleTextColor: string;
  assistantBubbleBorderRadius: number;
  assistantBubbleAlignment: string;
  messageMaxWidth: string;
  messageFontSize: number;
  messageLineHeight: number;
  messageTimestampShow: boolean;
  messageTimestampFormat: string;
  showMessageAvatar: boolean;
  botAvatarUrl?: string;
  botAvatarFallback: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  inputBorderRadius: number;
  inputPlaceholder: string;
  inputMinHeight: number;
  inputMaxHeight: number;
  sendButtonBackgroundColor?: string;
  sendButtonIconColor: string;
  sendButtonShape: string;

  // Behavior & Features
  autoOpenEnabled: boolean;
  autoOpenDelay: number;
  autoOpenOnlyOnce: boolean;
  autoOpenOnMobile: boolean;
  showTypingIndicator: boolean;
  typingIndicatorStyle: string;
  typingIndicatorText: string;
  showReadReceipts: boolean;
  enableSoundNotifications: boolean;
  soundNotificationUrl?: string;
  soundVolume: number;
  enableDesktopNotifications: boolean;
  enableVoiceInput: boolean;
  voiceInputLanguage: string;
  enableFileAttachments: boolean;
  allowedFileTypes: string[];
  maxFileSizeMB: number;
  maxFilesPerMessage: number;
  enableEmojiPicker: boolean;
  persistConversation: boolean;
  conversationTimeout: number;
  maxMessagesHistory: number;
  showQuickReplies: boolean;
  quickRepliesPosition: string;

  // Content & Text
  botName: string;
  botTagline?: string;
  welcomeMessage: string;
  offlineMessage: string;
  errorMessage: string;
  reconnectingMessage: string;
  inputPlaceholderText: string;
  sendButtonAriaLabel: string;
  closeButtonAriaLabel: string;
  minimizeButtonAriaLabel: string;
  showConversationStarters: boolean;
  startersTitle: string;
  showPoweredBy: boolean;
  poweredByText: string;
  poweredByUrl: string;

  // Responsive / Mobile
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  mobileFullScreen: boolean;
  mobileChatWindowWidth: string;
  mobileChatWindowHeight: string;
  mobileHeaderHeight: number;
  mobileFontSize: number;
  mobileInputMinHeight: number;
  mobileLauncherSize: string;
  mobileLauncherOffsetX: number;
  mobileLauncherOffsetY: number;
  mobileMessageMaxWidth: string;
  mobileShowMinimizeButton: boolean;
  tabletChatWindowWidth: number;
  tabletChatWindowHeight: number;
  tabletFontSize: number;
  enableTouchOptimizations: boolean;
  touchTargetMinSize: number;
  adjustForKeyboard: boolean;
  keyboardPaddingBottom: number;

  // Advanced
  enableAnimations: boolean;
  animationDuration: number;
  animationEasing: string;
  enableHighContrast: boolean;
  respectReducedMotion: boolean;
  enableKeyboardNavigation: boolean;
  focusRingColor: string;
  focusRingWidth: number;
  theme: string;
  darkModeBackgroundColor: string;
  darkModeTextColor: string;
  darkModeBorderColor: string;
  customCss?: string;
  lazyLoadMessages: boolean;
  preloadWidget: boolean;
  sanitizeHtml: boolean;
  allowedHtmlTags: string[];
  enableAnalytics: boolean;
  trackMessageEvents: boolean;
  trackUserInteractions: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ConversationStarters {
  welcomeMessage: string;
  starters: { starterText: string }[];
}

interface WidgetState {
  isOpen: boolean;
  isConnected: boolean;
  isTyping: boolean;
  hasError: boolean;
  errorMessage?: string;
}

type WidgetMode = 'chat' | 'speak';

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface WebKitSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => WebKitSpeechRecognition;
    lastAssistantMessage?: HTMLElement;
  }
}

class WidgetError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WidgetError';
  }
}

const WIDGET_ERRORS = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  MESSAGE_SEND_FAILED: 'MESSAGE_SEND_FAILED',
  SPEECH_NOT_SUPPORTED: 'SPEECH_NOT_SUPPORTED',
  INVALID_CONFIG: 'INVALID_CONFIG'
} as const;

class IntelligentconvoWidget {
  private config: WidgetConfig;
  private socket: Socket | null = null;
  private sessionId: string;
  private container: HTMLElement | null = null;
  private messages: Message[] = [];
  private state: WidgetState;
  private currentMode: WidgetMode = 'chat';
  private speechRecognition: WebKitSpeechRecognition | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private settings: WidgetSettings | null = null;
  private isMobile: boolean = false;
  private isTablet: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(config: WidgetConfig) {
    this.validateConfig(config);

    this.config = {
      mode: 'button',
      position: 'bottom-right',
      apiUrl: 'http://localhost:5001',
      theme: 'auto',
      language: 'en',
      loadSettingsFromServer: true,
      ...config,
    };

    this.state = {
      isOpen: false,
      isConnected: false,
      isTyping: false,
      hasError: false
    };

    this.sessionId = this.getOrCreateSession();
    this.detectDevice();
    this.init();
  }

  private detectDevice(): void {
    const width = window.innerWidth;
    this.isMobile = width < (this.settings?.mobileBreakpoint || 768);
    this.isTablet = width >= (this.settings?.mobileBreakpoint || 768) && width < (this.settings?.tabletBreakpoint || 1024);

    // Listen for resize events
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      const wasMobile = this.isMobile;
      const wasTablet = this.isTablet;

      this.isMobile = newWidth < (this.settings?.mobileBreakpoint || 768);
      this.isTablet = newWidth >= (this.settings?.mobileBreakpoint || 768) && newWidth < (this.settings?.tabletBreakpoint || 1024);

      // Re-apply settings if device type changed
      if (wasMobile !== this.isMobile || wasTablet !== this.isTablet) {
        this.applyResponsiveSettings();
      }
    });
  }

  private async loadSettings(): Promise<void> {
    if (!this.config.loadSettingsFromServer) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.apiUrl}/api/widget/${this.config.siteId}/settings`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Failed to load widget settings, using defaults');
        return;
      }

      this.settings = await response.json();
      this.applySettings();

      // Cache settings in session storage
      try {
        sessionStorage.setItem(`ic_settings_${this.config.siteId}`, JSON.stringify(this.settings));
      } catch (e) {
        // Ignore storage errors
      }
    } catch (error) {
      // Try to load from cache
      try {
        const cached = sessionStorage.getItem(`ic_settings_${this.config.siteId}`);
        if (cached) {
          this.settings = JSON.parse(cached);
          this.applySettings();
          console.log('Loaded widget settings from cache');
        }
      } catch (e) {
        console.warn('Failed to load widget settings:', error);
      }
    }
  }

  private applySettings(): void {
    if (!this.settings) return;

    const root = document.documentElement;

    // Apply colors
    root.style.setProperty('--ic-primary', this.settings.primaryColor);
    root.style.setProperty('--ic-primary-dark', this.adjustColor(this.settings.primaryColor, -20));
    root.style.setProperty('--ic-primary-light', this.settings.secondaryColor);
    root.style.setProperty('--ic-bg', this.settings.backgroundColor);
    root.style.setProperty('--ic-bg-secondary', this.adjustColor(this.settings.backgroundColor, -5));
    root.style.setProperty('--ic-text', this.settings.textColor);
    root.style.setProperty('--ic-text-secondary', this.settings.textSecondaryColor);
    root.style.setProperty('--ic-border', this.settings.borderColor);

    // Apply typography
    if (this.settings.fontFamily !== 'system') {
      root.style.setProperty('--ic-font', this.settings.fontFamily);
    }
    root.style.setProperty('--ic-font-size', `${this.settings.fontSize}px`);
    root.style.setProperty('--ic-font-weight-normal', this.settings.fontWeightNormal.toString());
    root.style.setProperty('--ic-font-weight-medium', this.settings.fontWeightMedium.toString());
    root.style.setProperty('--ic-font-weight-bold', this.settings.fontWeightBold.toString());

    // Apply shapes
    root.style.setProperty('--ic-radius', `${this.settings.borderRadius}px`);
    root.style.setProperty('--ic-radius-sm', `${this.settings.borderRadiusSmall}px`);
    root.style.setProperty('--ic-radius-btn', `${this.settings.borderRadiusButton}px`);

    // Apply shadows
    const shadowSizes: Record<string, string> = {
      none: 'none',
      small: `0 2px 4px ${this.settings.shadowColor}`,
      medium: `0 4px 6px -1px ${this.settings.shadowColor}, 0 2px 4px -1px ${this.settings.shadowColor}`,
      large: `0 10px 15px -3px ${this.settings.shadowColor}, 0 4px 6px -2px ${this.settings.shadowColor}`,
    };
    root.style.setProperty('--ic-shadow', shadowSizes[this.settings.shadowSize] || shadowSizes.medium);

    // Apply chat window sizing
    root.style.setProperty('--ic-window-width', `${this.settings.chatWindowWidth}px`);
    root.style.setProperty('--ic-window-height', `${this.settings.chatWindowHeight}px`);
    root.style.setProperty('--ic-window-max-height', this.settings.chatWindowMaxHeight);
    root.style.setProperty('--ic-z-index', this.settings.chatWindowZIndex.toString());

    // Apply header settings
    root.style.setProperty('--ic-header-bg', this.settings.headerBackgroundColor || this.settings.primaryColor);
    root.style.setProperty('--ic-header-text', this.settings.headerTextColor);
    root.style.setProperty('--ic-header-height', `${this.settings.headerHeight}px`);

    // Apply message bubble settings
    root.style.setProperty('--ic-user-bubble-bg', this.settings.userBubbleBackgroundColor || this.settings.primaryColor);
    root.style.setProperty('--ic-user-bubble-text', this.settings.userBubbleTextColor);
    root.style.setProperty('--ic-user-bubble-radius', `${this.settings.userBubbleBorderRadius}px`);
    root.style.setProperty('--ic-assistant-bubble-bg', this.settings.assistantBubbleBackgroundColor);
    root.style.setProperty('--ic-assistant-bubble-text', this.settings.assistantBubbleTextColor);
    root.style.setProperty('--ic-assistant-bubble-radius', `${this.settings.assistantBubbleBorderRadius}px`);
    root.style.setProperty('--ic-message-max-width', this.settings.messageMaxWidth);
    root.style.setProperty('--ic-message-font-size', `${this.settings.messageFontSize}px`);
    root.style.setProperty('--ic-message-line-height', this.settings.messageLineHeight.toString());

    // Apply input settings
    root.style.setProperty('--ic-input-bg', this.settings.inputBackgroundColor);
    root.style.setProperty('--ic-input-text', this.settings.inputTextColor);
    root.style.setProperty('--ic-input-border', this.settings.inputBorderColor);
    root.style.setProperty('--ic-input-radius', `${this.settings.inputBorderRadius}px`);
    root.style.setProperty('--ic-input-min-height', `${this.settings.inputMinHeight}px`);

    // Apply send button settings
    root.style.setProperty('--ic-send-btn-bg', this.settings.sendButtonBackgroundColor || this.settings.primaryColor);
    root.style.setProperty('--ic-send-btn-icon', this.settings.sendButtonIconColor);

    // Apply launcher settings
    const launcherSizes: Record<string, string> = {
      small: '48px',
      medium: '56px',
      large: '64px',
    };
    root.style.setProperty('--ic-launcher-size', launcherSizes[this.settings.launcherSize] || '56px');
    root.style.setProperty('--ic-launcher-bg', this.settings.launcherBackgroundColor || this.settings.primaryColor);
    root.style.setProperty('--ic-launcher-icon', this.settings.launcherIconColor);
    root.style.setProperty('--ic-launcher-offset-x', `${this.settings.launcherOffsetX}px`);
    root.style.setProperty('--ic-launcher-offset-y', `${this.settings.launcherOffsetY}px`);

    // Apply animation settings
    if (!this.settings.enableAnimations) {
      root.style.setProperty('--ic-animation-duration', '0ms');
    } else {
      root.style.setProperty('--ic-animation-duration', `${this.settings.animationDuration}ms`);
    }
    root.style.setProperty('--ic-animation-easing', this.settings.animationEasing);

    // Apply accessibility settings
    root.style.setProperty('--ic-focus-ring-color', this.settings.focusRingColor);
    root.style.setProperty('--ic-focus-ring-width', `${this.settings.focusRingWidth}px`);
    root.style.setProperty('--ic-touch-target-size', `${this.settings.touchTargetMinSize}px`);

    // Apply theme
    if (this.settings.theme === 'dark' || (this.settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.style.setProperty('--ic-bg', this.settings.darkModeBackgroundColor);
      root.style.setProperty('--ic-text', this.settings.darkModeTextColor);
      root.style.setProperty('--ic-border', this.settings.darkModeBorderColor);
    }

    // Respect reduced motion preference
    if (this.settings.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.style.setProperty('--ic-animation-duration', '0ms');
    }

    // Apply high contrast mode
    if (this.settings.enableHighContrast) {
      root.style.setProperty('--ic-text', '#000000');
      root.style.setProperty('--ic-bg', '#ffffff');
      root.style.setProperty('--ic-border', '#000000');
    }

    // Inject custom CSS if provided
    if (this.settings.customCss) {
      this.injectCustomCss(this.settings.customCss);
    }

    // Apply responsive settings
    this.applyResponsiveSettings();
  }

  private applyResponsiveSettings(): void {
    if (!this.settings) return;

    const root = document.documentElement;

    if (this.isMobile) {
      // Mobile-specific settings
      root.style.setProperty('--ic-window-width', this.settings.mobileChatWindowWidth);
      root.style.setProperty('--ic-window-height', this.settings.mobileChatWindowHeight);
      root.style.setProperty('--ic-header-height', `${this.settings.mobileHeaderHeight}px`);
      root.style.setProperty('--ic-font-size', `${this.settings.mobileFontSize}px`);
      root.style.setProperty('--ic-input-min-height', `${this.settings.mobileInputMinHeight}px`);
      root.style.setProperty('--ic-message-max-width', this.settings.mobileMessageMaxWidth);
      root.style.setProperty('--ic-launcher-offset-x', `${this.settings.mobileLauncherOffsetX}px`);
      root.style.setProperty('--ic-launcher-offset-y', `${this.settings.mobileLauncherOffsetY}px`);

      const launcherSizes: Record<string, string> = {
        small: '48px',
        medium: '56px',
        large: '64px',
      };
      root.style.setProperty('--ic-launcher-size', launcherSizes[this.settings.mobileLauncherSize] || '56px');

      // Add mobile class to body
      document.body.classList.add('ic-mobile');
      document.body.classList.remove('ic-tablet');
    } else if (this.isTablet) {
      // Tablet-specific settings
      root.style.setProperty('--ic-window-width', `${this.settings.tabletChatWindowWidth}px`);
      root.style.setProperty('--ic-window-height', `${this.settings.tabletChatWindowHeight}px`);
      root.style.setProperty('--ic-font-size', `${this.settings.tabletFontSize}px`);

      document.body.classList.add('ic-tablet');
      document.body.classList.remove('ic-mobile');
    } else {
      // Desktop
      document.body.classList.remove('ic-mobile', 'ic-tablet');
    }
  }

  private adjustColor(hex: string, percent: number): string {
    // Simple color adjustment function
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  }

  private injectCustomCss(css: string): void {
    const existingStyle = document.getElementById('ic-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'ic-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  private getLauncherIcon(): string {
    if (!this.settings) {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
      </svg>`;
    }

    if (this.settings.launcherCustomIconUrl) {
      return `<img src="${this.settings.launcherCustomIconUrl}" alt="Chat" width="24" height="24" />`;
    }

    const icons: Record<string, string> = {
      chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
      </svg>`,
      message: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
      </svg>`,
      help: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7S10 7.9 10 9H8C8 6.79 9.79 5 12 5S16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" fill="currentColor"/>
      </svg>`,
      support: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 1C5.9 1 1 5.9 1 12S5.9 23 12 23 23 18.1 23 12 18.1 1 12 1ZM12 21C7 21 3 17 3 12S7 3 12 3 21 7 21 12 17 21 12 21ZM12 11C10.3 11 9 9.7 9 8S10.3 5 12 5 15 6.3 15 8 13.7 11 12 11ZM12 13C14.7 13 20 14.3 20 17V19H4V17C4 14.3 9.3 13 12 13Z" fill="currentColor"/>
      </svg>`,
    };

    return icons[this.settings.launcherIcon] || icons.chat;
  }

  private validateConfig(config: WidgetConfig): void {
    if (!config.siteId || typeof config.siteId !== 'string') {
      throw new WidgetError('Site ID is required and must be a string', WIDGET_ERRORS.INVALID_CONFIG);
    }

    if (config.mode && !['button', 'widget'].includes(config.mode)) {
      throw new WidgetError('Mode must be "button" or "widget"', WIDGET_ERRORS.INVALID_CONFIG);
    }

    if (config.position && !['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config.position)) {
      throw new WidgetError('Invalid position specified', WIDGET_ERRORS.INVALID_CONFIG);
    }
  }

  private handleError(error: Error | WidgetError, context?: string): void {
    console.error(`[IntelligentconvoWidget${context ? ` - ${context}` : ''}]:`, error);

    this.state.hasError = true;
    this.state.errorMessage = error.message;

    if (this.config.onError) {
      this.config.onError(error);
    }

    this.showErrorMessage(error.message);
  }

  private showErrorMessage(message: string): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (messagesContainer) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'intelligentconvo-message intelligentconvo-error';
      errorDiv.innerHTML = `
        <div class="intelligentconvo-message-content error">
          <span class="error-icon">⚠️</span>
          ${message}
        </div>
        <div class="intelligentconvo-message-time">${new Date().toLocaleTimeString()}</div>
      `;
      messagesContainer.appendChild(errorDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private async init(): Promise<void> {
    try {
      // Load settings from server first
      await this.loadSettings();

      this.loadStyles();
      this.render();
      await this.connectSocket();
      await this.loadConversationStarters();

      // Handle auto-open if enabled
      if (this.settings?.autoOpenEnabled) {
        const shouldAutoOpen = !this.settings.autoOpenOnMobile || !this.isMobile;
        const hasOpenedBefore = sessionStorage.getItem(`ic_auto_opened_${this.config.siteId}`);

        if (shouldAutoOpen && (!this.settings.autoOpenOnlyOnce || !hasOpenedBefore)) {
          setTimeout(() => {
            this.openChat();
            if (this.settings?.autoOpenOnlyOnce) {
              sessionStorage.setItem(`ic_auto_opened_${this.config.siteId}`, 'true');
            }
          }, this.settings.autoOpenDelay);
        }
      }

      // Setup cleanup on page unload
      window.addEventListener('beforeunload', () => this.cleanup());
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Widget initialization failed'), 'init');
    }
  }

  public cleanup(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }

    // Remove event listeners
    window.removeEventListener('beforeunload', () => this.cleanup());
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
    const position = this.settings?.launcherPosition || this.config.position || 'bottom-right';
    const tooltip = this.settings?.launcherTooltip || 'Open chat';
    const shape = this.settings?.launcherShape || 'circle';
    const animation = this.settings?.launcherAnimation || 'pulse';

    const button = document.createElement('button');
    button.id = 'intelligentconvo-button';
    button.className = `intelligentconvo-button intelligentconvo-${position} intelligentconvo-shape-${shape} intelligentconvo-animation-${animation}`;
    button.setAttribute('aria-label', tooltip);
    button.setAttribute('title', this.settings?.launcherShowTooltip ? tooltip : '');
    button.setAttribute('role', 'button');

    // Apply launcher-specific styles
    if (this.settings) {
      button.style.width = `var(--ic-launcher-size, 56px)`;
      button.style.height = `var(--ic-launcher-size, 56px)`;
      button.style.backgroundColor = `var(--ic-launcher-bg)`;
      button.style.color = `var(--ic-launcher-icon)`;

      if (this.settings.launcherBorderColor && this.settings.launcherBorderWidth > 0) {
        button.style.border = `${this.settings.launcherBorderWidth}px solid ${this.settings.launcherBorderColor}`;
      }
    }

    button.innerHTML = `
      <div class="intelligentconvo-button-inner">
        ${this.getLauncherIcon()}
        ${this.settings?.launcherShowBadge ? `<span class="intelligentconvo-badge" style="background-color: ${this.settings.launcherBadgeColor}; color: ${this.settings.launcherBadgeTextColor};">0</span>` : ''}
      </div>
      ${this.settings?.launcherText ? `<span class="intelligentconvo-launcher-text">${this.settings.launcherText}</span>` : ''}
    `;

    button.addEventListener('click', () => {
      this.toggleChat();
    });

    button.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleChat();
      }
    });

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
            <span>AI is typing...</span>
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
          >🎤</button>
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

  private getChatWindowHTML(): string {
    const headerTitle = this.settings?.headerTitle || 'Chat Assistant';
    const headerSubtitle = this.settings?.headerSubtitle || '';
    const placeholder = this.settings?.inputPlaceholderText || 'Type your message...';
    const typingText = this.settings?.typingIndicatorText || 'AI is typing...';
    const closeLabel = this.settings?.closeButtonAriaLabel || 'Close chat';
    const sendLabel = this.settings?.sendButtonAriaLabel || 'Send message';
    const showVoiceInput = this.settings?.enableVoiceInput !== false;
    const showMinimize = this.settings?.headerShowMinimizeButton || false;
    const showPoweredBy = this.settings?.showPoweredBy !== false;
    const poweredByText = this.settings?.poweredByText || 'Powered by Intelligentconvo';
    const poweredByUrl = this.settings?.poweredByUrl || 'https://intelligentconvo.com';

    return `
      <div class="intelligentconvo-chat-window" id="intelligentconvo-chat-window" role="dialog" aria-labelledby="chat-title" aria-modal="true">
        <div class="intelligentconvo-chat-header">
          <div class="intelligentconvo-chat-title">
            <div class="intelligentconvo-header-info">
              ${this.settings?.headerShowAvatar ? `
                <div class="intelligentconvo-header-avatar">
                  ${this.settings?.headerAvatarUrl
                    ? `<img src="${this.settings.headerAvatarUrl}" alt="${this.settings?.botName || 'Assistant'}" />`
                    : `<span>${this.settings?.botAvatarFallback || 'AI'}</span>`
                  }
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
              <button
                class="intelligentconvo-close"
                id="intelligentconvo-close"
                aria-label="${closeLabel}"
                title="Close"
              >×</button>
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
          ${this.settings?.headerShowStatus !== false ? `
            <div class="intelligentconvo-connection-status" id="intelligentconvo-connection-status">
              <div class="intelligentconvo-connection-dot"></div>
              <span id="intelligentconvo-connection-text">Connecting...</span>
            </div>
          ` : ''}
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
            <span>${typingText}</span>
          </div>
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
          ${showVoiceInput ? `
            <button
              class="intelligentconvo-mic"
              id="intelligentconvo-mic"
              aria-label="Start voice input"
              title="Start voice input"
            >🎤</button>
          ` : ''}
          <button
            class="intelligentconvo-send"
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

  private toggleChat(): void {
    if (this.state.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  private openChat(): void {
    if (this.config.mode === 'button') {
      // Create chat window
      const chatWindow = document.createElement('div');
      chatWindow.innerHTML = this.getChatWindowHTML();
      const windowElement = chatWindow.firstElementChild as HTMLElement;
      document.body.appendChild(windowElement);

      this.setupEventListeners();

      // Update connection status to reflect current state
      if (this.state.isConnected) {
        this.updateConnectionStatus('connected');
      } else {
        this.updateConnectionStatus('connecting');
      }

      // Focus management for accessibility
      const firstFocusable = windowElement.querySelector('button, input, [tabindex]') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    this.state.isOpen = true;
    document.body.classList.add('intelligentconvo-chat-open');

    // Update button aria-label
    const button = document.getElementById('intelligentconvo-button');
    if (button) {
      button.setAttribute('aria-label', 'Close chat');
      button.setAttribute('title', 'Close chat');
    }
  }

  private closeChat(): void {
    if (this.config.mode === 'button') {
      const chatWindow = document.getElementById('intelligentconvo-chat-window');
      if (chatWindow) {
        chatWindow.remove();
      }

      // Return focus to button
      const button = document.getElementById('intelligentconvo-button');
      if (button) {
        button.focus();
      }
    }

    this.state.isOpen = false;
    document.body.classList.remove('intelligentconvo-chat-open');

    // Update button aria-label
    const button = document.getElementById('intelligentconvo-button');
    if (button) {
      button.setAttribute('aria-label', 'Open chat');
      button.setAttribute('title', 'Open chat');
    }
  }

  private setupEventListeners(): void {
    const closeBtn = document.getElementById('intelligentconvo-close');
    const sendBtn = document.getElementById('intelligentconvo-send');
    const input = document.getElementById('intelligentconvo-input') as HTMLInputElement;
    const micBtn = document.getElementById('intelligentconvo-mic');
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
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.closeChat();
      }
    });
  }

  private handleTabSwitch(e: Event): void {
    const clickedTab = e.target as HTMLElement;
    const mode = clickedTab.getAttribute('data-mode') as WidgetMode;

    if (mode && mode !== this.currentMode) {
      // Update visual state
      document.querySelectorAll('.intelligentconvo-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      });

      clickedTab.classList.add('active');
      clickedTab.setAttribute('aria-selected', 'true');

      this.currentMode = mode;

      // Could implement mode-specific functionality here
      console.log(`Switched to ${mode} mode`);
    }
  }

  private async connectSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.apiUrl!, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to Intelligentconvo');
          this.state.isConnected = true;
          this.state.hasError = false;
          this.reconnectAttempts = 0;

          this.updateConnectionStatus('connected');
          this.socket!.emit('join-site', this.config.siteId);

          if (this.config.onConnect) {
            this.config.onConnect();
          }

          resolve();
        });

        this.socket.on('stream', (data: { chunk: string }) => {
          try {
            // Create assistant message on first chunk
            if (!window.lastAssistantMessage) {
              this.displayMessage('assistant', '');
              this.setTyping(false); // Hide typing indicator once we start receiving
            }
            this.appendToLastMessage(data.chunk);
          } catch (error) {
            this.handleError(new Error('Failed to process message stream'), 'stream');
          }
        });

        this.socket.on('complete', (data: { content: string }) => {
          this.setTyping(false);
        });

        this.socket.on('error', (data: { message: string }) => {
          const error = new WidgetError(data.message || 'Unknown socket error', WIDGET_ERRORS.CONNECTION_FAILED);
          this.handleError(error, 'socket');
          this.setTyping(false);
        });

        this.socket.on('typing', (data: { isTyping: boolean }) => {
          this.setTyping(data.isTyping);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('Disconnected from Intelligentconvo:', reason);
          this.state.isConnected = false;
          this.updateConnectionStatus('disconnected');

          if (this.config.onDisconnect) {
            this.config.onDisconnect();
          }

          // Attempt to reconnect if not intentional
          if (reason === 'io server disconnect') {
            this.attemptReconnect();
          }
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('Connection error:', error);
          this.handleError(new WidgetError('Failed to connect to chat service', WIDGET_ERRORS.CONNECTION_FAILED, error), 'connect');
          reject(error);
        });

        // Timeout for initial connection
        setTimeout(() => {
          if (!this.state.isConnected) {
            reject(new WidgetError('Connection timeout', WIDGET_ERRORS.CONNECTION_FAILED));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError(new WidgetError('Max reconnection attempts reached', WIDGET_ERRORS.CONNECTION_FAILED), 'reconnect');
      this.updateConnectionStatus('disconnected');
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionStatus('connecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connectSocket().catch(error => {
        console.error('Reconnection failed:', error);
        this.updateConnectionStatus('disconnected');
      });
    }, delay);
  }

  private updateConnectionStatus(status: 'connected' | 'connecting' | 'disconnected'): void {
    const statusElement = document.getElementById('intelligentconvo-connection-status');
    const textElement = document.getElementById('intelligentconvo-connection-text');

    if (statusElement && textElement) {
      statusElement.className = `intelligentconvo-connection-status ${status}`;

      switch (status) {
        case 'connected':
          textElement.textContent = 'Connected';
          break;
        case 'connecting':
          textElement.textContent = 'Connecting...';
          break;
        case 'disconnected':
          textElement.textContent = 'Disconnected';
          break;
      }
    }
  }

  private async loadConversationStarters(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.apiUrl}/api/widget/${this.config.siteId}/starters`, {
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
    const container = document.getElementById('intelligentconvo-starters');
    if (!container) return;

    // Sanitize welcome message
    const sanitizedWelcome = this.sanitizeHtml(data.welcomeMessage);

    container.innerHTML = `
      <div class="intelligentconvo-welcome" role="heading" aria-level="3">${sanitizedWelcome}</div>
      <div class="intelligentconvo-starter-buttons" role="group" aria-label="Conversation starters">
        ${data.starters.map((starter, index) => {
          const sanitizedText = this.sanitizeHtml(starter.starterText);
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
    `;

    // Add click and keyboard handlers to starter buttons
    container.querySelectorAll('.intelligentconvo-starter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = (e.target as HTMLElement).getAttribute('data-text');
        if (text) {
          this.sendMessage(text);
        }
      });

      btn.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          const text = (e.target as HTMLElement).getAttribute('data-text');
          if (text) {
            this.sendMessage(text);
          }
        }
      });
    });
  }

  private handleSendMessage(): void {
    const input = document.getElementById('intelligentconvo-input') as HTMLInputElement;
    const sendBtn = document.getElementById('intelligentconvo-send');
    const text = input.value.trim();

    if (!text) {
      input.focus();
      return;
    }

    if (!this.state.isConnected) {
      this.showErrorMessage('Not connected to chat service. Please wait while we reconnect.');
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

  private sendMessage(text: string): void {
    try {
      if (!text.trim()) {
        throw new WidgetError('Message cannot be empty', WIDGET_ERRORS.MESSAGE_SEND_FAILED);
      }

      if (!this.socket || !this.state.isConnected) {
        throw new WidgetError('Not connected to chat service', WIDGET_ERRORS.CONNECTION_FAILED);
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
      this.messages.push(message);

      // Hide starters after first message
      const starters = document.getElementById('intelligentconvo-starters');
      if (starters) {
        starters.style.display = 'none';
      }

      this.socket.emit('message', {
        sessionId: this.sessionId,
        siteId: this.config.siteId,
        content: text.trim(),
        messageId: message.id,
      });

      this.setTyping(true);

      if (this.config.onMessage) {
        this.config.onMessage(message);
      }
    } catch (error) {
      this.handleError(error instanceof WidgetError ? error : new Error('Failed to send message'), 'sendMessage');
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private displayMessage(role: 'user' | 'assistant', content: string, messageId?: string): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `intelligentconvo-message intelligentconvo-${role}`;
    messageDiv.setAttribute('data-message-id', messageId || this.generateMessageId());

    // Escape HTML to prevent XSS
    const sanitizedContent = this.sanitizeHtml(content);

    messageDiv.innerHTML = `
      <div class="intelligentconvo-message-content">${sanitizedContent || ''}</div>
      <div class="intelligentconvo-message-time">${new Date().toLocaleTimeString()}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    if (role === 'assistant' && content) {
      const message: Message = {
        id: messageId || this.generateMessageId(),
        role,
        content: sanitizedContent,
        timestamp: new Date().toISOString(),
      };
      this.messages.push(message);

      if (this.config.onMessage) {
        this.config.onMessage(message);
      }
    }

    if (role === 'assistant') {
      // Store the message element for streaming
      window.lastAssistantMessage = messageDiv;
    }
  }

  private sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  private scrollToBottom(): void {
    const messagesContainer = document.getElementById('intelligentconvo-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private appendToLastMessage(chunk: string): void {
    try {
      const lastMessage = window.lastAssistantMessage;
      if (lastMessage) {
        const contentDiv = lastMessage.querySelector('.intelligentconvo-message-content');
        if (contentDiv) {
          // Sanitize chunk to prevent XSS
          const sanitizedChunk = this.sanitizeHtml(chunk);
          contentDiv.textContent += chunk; // Use textContent to prevent HTML injection
        }

        this.scrollToBottom();
      }
    } catch (error) {
      this.handleError(new Error('Failed to append message chunk'), 'appendMessage');
    }
  }

  private setTyping(typing: boolean): void {
    this.state.isTyping = typing;
    const typingIndicator = document.getElementById('intelligentconvo-typing');

    if (typingIndicator) {
      typingIndicator.style.display = typing ? 'flex' : 'none';
    }
  }

  private handleVoiceInput(): void {
    try {
      if (!('webkitSpeechRecognition' in window)) {
        throw new WidgetError('Speech recognition not supported in this browser', WIDGET_ERRORS.SPEECH_NOT_SUPPORTED);
      }

      // Stop any existing recognition
      if (this.speechRecognition) {
        this.speechRecognition.stop();
      }

      this.speechRecognition = new window.webkitSpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;

      this.speechRecognition.onstart = () => {
        const micBtn = document.getElementById('intelligentconvo-mic');
        if (micBtn) {
          micBtn.classList.add('listening');
          micBtn.setAttribute('aria-label', 'Listening...');
        }
      };

      this.speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            this.sendMessage(transcript);
          }
        } catch (error) {
          this.handleError(new Error('Failed to process speech recognition result'), 'speechRecognition');
        }
      };

      this.speechRecognition.onend = () => {
        const micBtn = document.getElementById('intelligentconvo-mic');
        if (micBtn) {
          micBtn.classList.remove('listening');
          micBtn.setAttribute('aria-label', 'Start voice input');
        }
        this.speechRecognition = null;
      };

      this.speechRecognition.onerror = (event: any) => {
        this.handleError(new WidgetError(`Speech recognition error: ${event.error}`, WIDGET_ERRORS.SPEECH_NOT_SUPPORTED), 'speechRecognition');
        const micBtn = document.getElementById('intelligentconvo-mic');
        if (micBtn) {
          micBtn.classList.remove('listening');
        }
      };

      this.speechRecognition.start();
    } catch (error) {
      this.handleError(error instanceof WidgetError ? error : new Error('Voice input failed'), 'voiceInput');
    }
  }

  private getOrCreateSession(): string {
    let sessionId = localStorage.getItem('intelligentconvo_session');

    if (!sessionId) {
      sessionId = 'ic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('intelligentconvo_session', sessionId);
    }

    return sessionId;
  }
}

// Global initialization function
(window as any).intelligentconvo = (window as any).intelligentconvo || function(...args: any[]) {
  ((window as any).intelligentconvo.q = (window as any).intelligentconvo.q || []).push(args);
};

// Process queued commands
(window as any).intelligentconvo._init = () => {
  const commands = (window as any).intelligentconvo.q || [];

  commands.forEach((command: any[]) => {
    if (command[0] === 'init' && command[1]) {
      new IntelligentconvoWidget(command[1]);
    }
  });

  // Replace function to handle future commands
  (window as any).intelligentconvo = (command: string, config?: WidgetConfig) => {
    if (command === 'init' && config) {
      new IntelligentconvoWidget(config);
    }
  };
};

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    (window as any).intelligentconvo._init();
  });
} else {
  (window as any).intelligentconvo._init();
}

export default IntelligentconvoWidget;