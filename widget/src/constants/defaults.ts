// Connection & Network
export const MAX_RECONNECT_ATTEMPTS = 5;
export const CONNECTION_TIMEOUT = 10000;
export const SETTINGS_TIMEOUT = 5000;
export const STARTERS_TIMEOUT = 5000;
export const INITIAL_RECONNECT_DELAY = 1000;
export const MAX_RECONNECT_DELAY = 30000;

// Pagination
export const MESSAGES_PER_PAGE = 20;

// Timeouts & Delays
export const NOTIFICATION_AUTO_CLOSE_TIMEOUT = 5000;
export const MARK_READ_DELAY = 100;

// Preview & Display
export const NOTIFICATION_PREVIEW_LENGTH = 100;

// File Size Conversion
export const BYTES_PER_KB = 1024;
export const MS_PER_SECOND = 1000;

// Defaults
export const DEFAULT_API_URL = process.env.WIDGET_API_URL || 'http://localhost:5001';
export const DEFAULT_SOUND_VOLUME = 0.5;
export const DEFAULT_NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQIl';
export const DEFAULT_POWERED_BY_TEXT = 'Powered by IntelliConvo';
export const DEFAULT_POWERED_BY_URL = 'https://intelliconvo.com';

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SESSION: 'intelliconvo_session',
  CONVERSATION_PREFIX: 'ic_conversation_',
  AUTO_OPENED_PREFIX: 'ic_auto_opened_',
  SETTINGS_PREFIX: 'ic_settings_',
} as const;

// Notification Tags
export const NOTIFICATION_TAG = 'intelliconvo-message';

// UI Sizes
export const LAUNCHER_SIZES = {
  SMALL: '48px',
  MEDIUM: '56px',
  LARGE: '64px',
} as const;

export const ICON_SIZE = 24; // SVG icon size in pixels

// Colors
export const HIGH_CONTRAST_COLORS = {
  TEXT: '#000000',
  BACKGROUND: '#ffffff',
  BORDER: '#000000',
} as const;

// Color Adjustments (percentages)
export const COLOR_ADJUSTMENTS = {
  DARKEN_PRIMARY: -20,
  DARKEN_BACKGROUND: -5,
} as const;

// CSS IDs
export const CUSTOM_CSS_ID = 'ic-custom-css';

// Performance
export const DEBOUNCE_DELAY = {
  RESIZE: 150,
  SCROLL: 100,
  INPUT: 300,
} as const;

export const THROTTLE_DELAY = {
  SCROLL: 200,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 20,
  MESSAGES_TIME_WINDOW: 60000, // 1 minute in milliseconds
  FILES_PER_MINUTE: 5,
  FILES_TIME_WINDOW: 60000,
} as const;
