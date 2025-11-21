import { WidgetSettings } from '../types';
import { adjustColor, injectCustomCss as injectCss } from '../utils';
import {
  SETTINGS_TIMEOUT,
  STORAGE_KEYS,
  LAUNCHER_SIZES,
  HIGH_CONTRAST_COLORS,
  COLOR_ADJUSTMENTS,
  CUSTOM_CSS_ID
} from '../constants';

export class SettingsManager {
  private settings: WidgetSettings | null = null;
  private isMobile: boolean = false;
  private isTablet: boolean = false;

  constructor(
    private siteId: string,
    private apiUrl: string,
    private loadFromServer: boolean = true
  ) {}

  async loadSettings(): Promise<void> {
    if (!this.loadFromServer) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SETTINGS_TIMEOUT);

      const response = await fetch(`${this.apiUrl}/api/v1/widget/${this.siteId}/settings`, {
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
        sessionStorage.setItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${this.siteId}`, JSON.stringify(this.settings));
      } catch (error) {
        // Log storage error but continue - not critical
        console.warn('Failed to cache widget settings:', error instanceof Error ? error.message : 'Unknown error');
      }
    } catch (error) {
      // Try to load from cache
      try {
        const cached = sessionStorage.getItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${this.siteId}`);
        if (cached) {
          this.settings = JSON.parse(cached);
          this.applySettings();
          console.log('Loaded widget settings from cache');
        }
      } catch {
        console.warn('Failed to load widget settings:', error);
      }
    }
  }

  getSettings(): WidgetSettings | null {
    return this.settings;
  }

  setDeviceType(isMobile: boolean, isTablet: boolean): void {
    this.isMobile = isMobile;
    this.isTablet = isTablet;
    this.applyResponsiveSettings();
  }

  private applySettings(): void {
    if (!this.settings) return;

    const root = document.documentElement;

    // Apply colors
    root.style.setProperty('--ic-primary', this.settings.primaryColor);
    root.style.setProperty('--ic-primary-dark', adjustColor(this.settings.primaryColor, COLOR_ADJUSTMENTS.DARKEN_PRIMARY));
    root.style.setProperty('--ic-primary-light', this.settings.secondaryColor);
    root.style.setProperty('--ic-bg', this.settings.backgroundColor);
    root.style.setProperty('--ic-bg-secondary', adjustColor(this.settings.backgroundColor, COLOR_ADJUSTMENTS.DARKEN_BACKGROUND));
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

    // Apply message alignment
    root.style.setProperty('--ic-user-bubble-align', this.settings.userBubbleAlignment === 'left' ? 'flex-start' : 'flex-end');
    root.style.setProperty('--ic-assistant-bubble-align', this.settings.assistantBubbleAlignment === 'right' ? 'flex-end' : 'flex-start');

    // Apply message area settings
    root.style.setProperty('--ic-message-area-bg', this.settings.messageAreaBackgroundColor || adjustColor(this.settings.backgroundColor, -5));
    root.style.setProperty('--ic-message-area-padding', `${this.settings.messageAreaPadding}px`);

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
      small: LAUNCHER_SIZES.SMALL,
      medium: LAUNCHER_SIZES.MEDIUM,
      large: LAUNCHER_SIZES.LARGE,
    };
    root.style.setProperty('--ic-launcher-size', launcherSizes[this.settings.launcherSize] || LAUNCHER_SIZES.MEDIUM);
    root.style.setProperty('--ic-launcher-bg', this.settings.launcherBackgroundColor || this.settings.primaryColor);
    root.style.setProperty('--ic-launcher-icon', this.settings.launcherIconColor);
    root.style.setProperty('--ic-launcher-offset-x', `${this.settings.launcherOffsetX}px`);
    root.style.setProperty('--ic-launcher-offset-y', `${this.settings.launcherOffsetY}px`);
    root.style.setProperty('--ic-launcher-border-color', this.settings.launcherBorderColor || 'transparent');
    root.style.setProperty('--ic-launcher-border-width', `${this.settings.launcherBorderWidth}px`);
    root.style.setProperty('--ic-launcher-badge-bg', this.settings.launcherBadgeColor);
    root.style.setProperty('--ic-launcher-badge-text', this.settings.launcherBadgeTextColor);
    root.style.setProperty('--ic-launcher-animation-delay', `${this.settings.launcherAnimationDelay}ms`);

    // Apply border width
    root.style.setProperty('--ic-border-width', `${this.settings.borderWidth}px`);

    // Apply input max height
    root.style.setProperty('--ic-input-max-height', `${this.settings.inputMaxHeight}px`);

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
    const isDarkMode = this.settings.theme === 'dark' ||
      (this.settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkMode) {
      root.style.setProperty('--ic-primary', this.settings.darkModePrimaryColor);
      root.style.setProperty('--ic-primary-light', this.settings.darkModeSecondaryColor);
      root.style.setProperty('--ic-bg', this.settings.darkModeBackgroundColor);
      root.style.setProperty('--ic-bg-secondary', this.settings.darkModeBackgroundColor);
      root.style.setProperty('--ic-text', this.settings.darkModeTextColor);
      root.style.setProperty('--ic-text-secondary', this.settings.darkModeTextSecondaryColor);
      root.style.setProperty('--ic-border', this.settings.darkModeBorderColor);
      root.style.setProperty('--ic-message-area-bg', this.settings.messageAreaBackgroundColor || this.settings.darkModeSecondaryBackgroundColor);
      root.style.setProperty('--ic-assistant-bubble-bg', this.settings.darkModeSecondaryBackgroundColor);
      root.style.setProperty('--ic-assistant-bubble-text', this.settings.darkModeTextColor);
      root.style.setProperty('--ic-input-bg', this.settings.darkModeSecondaryBackgroundColor);
      root.style.setProperty('--ic-input-text', this.settings.darkModeTextColor);
      root.style.setProperty('--ic-input-border', this.settings.darkModeTextSecondaryColor);
    }

    // Respect reduced motion preference
    if (this.settings.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.style.setProperty('--ic-animation-duration', '0ms');
    }

    // Apply high contrast mode
    if (this.settings.enableHighContrast) {
      root.style.setProperty('--ic-text', HIGH_CONTRAST_COLORS.TEXT);
      root.style.setProperty('--ic-bg', HIGH_CONTRAST_COLORS.BACKGROUND);
      root.style.setProperty('--ic-border', HIGH_CONTRAST_COLORS.BORDER);
    }

    // Inject custom CSS if provided
    if (this.settings.customCss) {
      injectCss(this.settings.customCss, CUSTOM_CSS_ID);
    }

    // Apply responsive settings
    this.applyResponsiveSettings();
  }

  private applyResponsiveSettings(): void {
    if (!this.settings) return;

    const root = document.documentElement;

    if (this.isMobile) {
      root.style.setProperty('--ic-window-width', this.settings.mobileChatWindowWidth);
      root.style.setProperty('--ic-window-height', this.settings.mobileChatWindowHeight);
      root.style.setProperty('--ic-header-height', `${this.settings.mobileHeaderHeight}px`);
      root.style.setProperty('--ic-font-size', `${this.settings.mobileFontSize}px`);
      root.style.setProperty('--ic-input-min-height', `${this.settings.mobileInputMinHeight}px`);
      root.style.setProperty('--ic-message-max-width', this.settings.mobileMessageMaxWidth);
      root.style.setProperty('--ic-launcher-offset-x', `${this.settings.mobileLauncherOffsetX}px`);
      root.style.setProperty('--ic-launcher-offset-y', `${this.settings.mobileLauncherOffsetY}px`);

      const launcherSizes: Record<string, string> = {
        small: LAUNCHER_SIZES.SMALL,
        medium: LAUNCHER_SIZES.MEDIUM,
        large: LAUNCHER_SIZES.LARGE,
      };
      root.style.setProperty('--ic-launcher-size', launcherSizes[this.settings.mobileLauncherSize] || LAUNCHER_SIZES.MEDIUM);

      document.body.classList.add('ic-mobile');
      document.body.classList.remove('ic-tablet');

      if (this.settings.mobileFullScreen) {
        document.body.classList.add('ic-mobile-fullscreen');
      } else {
        document.body.classList.remove('ic-mobile-fullscreen');
      }
    } else if (this.isTablet) {
      root.style.setProperty('--ic-window-width', `${this.settings.tabletChatWindowWidth}px`);
      root.style.setProperty('--ic-window-height', `${this.settings.tabletChatWindowHeight}px`);
      root.style.setProperty('--ic-font-size', `${this.settings.tabletFontSize}px`);

      document.body.classList.add('ic-tablet');
      document.body.classList.remove('ic-mobile');
    } else {
      document.body.classList.remove('ic-mobile', 'ic-tablet');
    }
  }
}
