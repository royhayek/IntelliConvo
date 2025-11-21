/**
 * Widget Service
 * Business logic for widget configuration and settings management
 */

import { WidgetSettings } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, AppError, ErrorCode } from '../../middleware/errors';
import {
  getOrCreateWidgetSettings,
  getPublicWidgetSettings,
  updateWidgetSettings as updateSettings,
  resetWidgetSettings as resetSettings,
  validateWidgetSettings as validateSettings,
  defaultWidgetSettings,
} from '../widgetSettings';

/**
 * DTO Interfaces
 */
export interface SiteConfigDTO {
  id: string;
  siteName: string;
  siteUrl: string;
  welcomeMessage: string | null;
}

export interface SiteValidationDTO {
  valid: boolean;
  siteName: string;
  status: string;
}

export interface StartersDTO {
  welcomeMessage: string | null;
  starters: ConversationStarterDTO[];
}

export interface ConversationStarterDTO {
  id: string;
  starterText: string;
  orderIndex: number;
  isActive: boolean;
}

// Category field mappings for partial settings retrieval
const CATEGORY_FIELDS: Record<string, string[]> = {
  appearance: [
    'primaryColor', 'secondaryColor', 'backgroundColor', 'textColor',
    'textSecondaryColor', 'borderColor', 'fontFamily', 'fontSize',
    'fontWeightNormal', 'fontWeightMedium', 'fontWeightBold',
    'borderRadius', 'borderRadiusSmall', 'borderRadiusButton',
    'borderWidth', 'shadowColor', 'shadowSize',
  ],
  launcher: [
    'launcherIcon', 'launcherCustomIconUrl', 'launcherSize', 'launcherPosition',
    'launcherOffsetX', 'launcherOffsetY', 'launcherShape', 'launcherBackgroundColor',
    'launcherIconColor', 'launcherBorderColor', 'launcherBorderWidth',
    'launcherText', 'launcherTooltip', 'launcherShowTooltip',
    'launcherShowBadge', 'launcherBadgeColor', 'launcherBadgeTextColor',
    'launcherAnimation', 'launcherAnimationDelay',
  ],
  chatWindow: [
    'chatWindowWidth', 'chatWindowHeight', 'chatWindowMaxHeight', 'chatWindowZIndex',
    'headerBackgroundColor', 'headerTextColor', 'headerHeight', 'headerTitle',
    'headerSubtitle', 'headerShowAvatar', 'headerAvatarUrl', 'headerShowStatus',
    'headerShowCloseButton', 'headerShowMinimizeButton', 'messageAreaBackgroundColor',
    'messageAreaPadding', 'userBubbleBackgroundColor', 'userBubbleTextColor',
    'userBubbleBorderRadius', 'userBubbleAlignment', 'assistantBubbleBackgroundColor',
    'assistantBubbleTextColor', 'assistantBubbleBorderRadius', 'assistantBubbleAlignment',
    'messageMaxWidth', 'messageFontSize', 'messageLineHeight', 'messageTimestampShow',
    'messageTimestampFormat', 'showMessageAvatar', 'botAvatarUrl', 'botAvatarFallback',
    'inputBackgroundColor', 'inputTextColor', 'inputBorderColor', 'inputBorderRadius',
    'inputPlaceholder', 'inputMinHeight', 'inputMaxHeight', 'sendButtonBackgroundColor',
    'sendButtonIconColor', 'sendButtonShape',
  ],
  behavior: [
    'autoOpenEnabled', 'autoOpenDelay', 'autoOpenOnlyOnce', 'autoOpenOnMobile',
    'showTypingIndicator', 'typingIndicatorStyle', 'typingIndicatorText',
    'showReadReceipts', 'enableSoundNotifications', 'soundNotificationUrl',
    'soundVolume', 'enableDesktopNotifications', 'enableVoiceInput',
    'voiceInputLanguage', 'enableFileAttachments', 'allowedFileTypes',
    'maxFileSizeMB', 'maxFilesPerMessage', 'enableEmojiPicker',
    'persistConversation', 'conversationTimeout', 'maxMessagesHistory',
    'showQuickReplies', 'quickRepliesPosition',
  ],
  content: [
    'botName', 'botTagline', 'welcomeMessage', 'offlineMessage',
    'errorMessage', 'reconnectingMessage', 'inputPlaceholderText',
    'sendButtonAriaLabel', 'closeButtonAriaLabel', 'minimizeButtonAriaLabel',
    'showConversationStarters', 'startersTitle', 'showPoweredBy',
    'poweredByText', 'poweredByUrl',
  ],
  responsive: [
    'mobileBreakpoint', 'tabletBreakpoint', 'mobileFullScreen',
    'mobileChatWindowWidth', 'mobileChatWindowHeight', 'mobileHeaderHeight',
    'mobileFontSize', 'mobileInputMinHeight', 'mobileLauncherSize',
    'mobileLauncherOffsetX', 'mobileLauncherOffsetY', 'mobileMessageMaxWidth',
    'mobileShowMinimizeButton', 'tabletChatWindowWidth', 'tabletChatWindowHeight',
    'tabletFontSize', 'enableTouchOptimizations', 'touchTargetMinSize',
    'adjustForKeyboard', 'keyboardPaddingBottom',
  ],
  advanced: [
    'enableAnimations', 'animationDuration', 'animationEasing',
    'enableHighContrast', 'respectReducedMotion', 'enableKeyboardNavigation',
    'focusRingColor', 'focusRingWidth', 'theme', 'darkModePrimaryColor',
    'darkModeSecondaryColor', 'darkModeBackgroundColor', 'darkModeSecondaryBackgroundColor',
    'darkModeTextColor', 'darkModeTextSecondaryColor', 'darkModeBorderColor', 'customCss',
    'lazyLoadMessages', 'preloadWidget', 'sanitizeHtml', 'allowedHtmlTags',
    'enableAnalytics', 'trackMessageEvents', 'trackUserInteractions',
  ],
};

/**
 * WidgetService class
 * Handles all widget-related business logic
 */
export class WidgetService {
  // ============================================
  // Public Endpoints (No Auth Required)
  // ============================================

  /**
   * Get conversation starters for public widget
   * @param siteId - Site ID
   * @returns Starters with welcome message
   */
  async getPublicStarters(siteId: string): Promise<StartersDTO> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        conversationStarters: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    return {
      welcomeMessage: site.welcomeMessage,
      starters: site.conversationStarters.map((s) => ({
        id: s.id,
        starterText: s.starterText,
        orderIndex: s.orderIndex,
        isActive: s.isActive,
      })),
    };
  }

  /**
   * Get site configuration for public widget
   * @param siteId - Site ID
   * @returns Site configuration
   */
  async getPublicConfig(siteId: string): Promise<SiteConfigDTO> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        siteName: true,
        siteUrl: true,
        welcomeMessage: true,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    return site;
  }

  /**
   * Validate site for widget embedding
   * @param siteId - Site ID
   * @param origin - Request origin (optional)
   * @returns Validation result
   */
  async validateSite(siteId: string, origin?: string): Promise<SiteValidationDTO> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        activeHosts: true,
        subscription: true,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Check if subscription is active
    if (site.subscription && site.subscription.status === 'EXPIRED') {
      throw new AppError(403, ErrorCode.FORBIDDEN, 'Subscription expired');
    }

    // Check if origin is allowed
    if (origin && site.activeHosts.length > 0) {
      const originHost = new URL(origin).hostname;
      const allowedHosts = site.activeHosts
        .filter((host) => host.isEnabled)
        .map((host) => host.hostName);

      const isAllowed = allowedHosts.some((host) => {
        return (
          originHost === host ||
          originHost === `www.${host}` ||
          `www.${originHost}` === host
        );
      });

      if (!isAllowed) {
        throw new AppError(403, ErrorCode.FORBIDDEN, 'Origin not allowed');
      }
    }

    return {
      valid: true,
      siteName: site.siteName,
      status: site.subscription?.status || 'TRIAL',
    };
  }

  /**
   * Get public widget settings
   * @param siteId - Site ID
   * @returns Public widget settings
   */
  async getPublicSettings(siteId: string): Promise<Partial<WidgetSettings>> {
    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    const settings = await getPublicWidgetSettings(siteId);
    return settings || {};
  }

  // ============================================
  // Admin Endpoints (Auth Required)
  // ============================================

  /**
   * Get admin widget settings
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @returns Full widget settings
   */
  async getAdminSettings(siteId: string, userId: string): Promise<WidgetSettings> {
    await this.verifySiteOwnership(siteId, userId);
    return getOrCreateWidgetSettings(siteId);
  }

  /**
   * Get widget settings by category
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param category - Settings category
   * @returns Category-specific settings
   */
  async getSettingsByCategory(
    siteId: string,
    userId: string,
    category: string
  ): Promise<Record<string, any>> {
    await this.verifySiteOwnership(siteId, userId);

    const categoryFields = CATEGORY_FIELDS[category];
    if (!categoryFields) {
      const validCategories = Object.keys(CATEGORY_FIELDS).join(', ');
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        `Invalid category. Valid categories: ${validCategories}`
      );
    }

    const settings = await getOrCreateWidgetSettings(siteId);

    // Filter to only requested category fields
    const categorySettings: Record<string, any> = {};
    for (const key of categoryFields) {
      if (key in settings) {
        categorySettings[key] = (settings as any)[key];
      }
    }

    return categorySettings;
  }

  /**
   * Update widget settings (partial)
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param data - Settings to update
   * @returns Updated settings
   */
  async updateSettings(
    siteId: string,
    userId: string,
    data: Partial<WidgetSettings>
  ): Promise<WidgetSettings> {
    await this.verifySiteOwnership(siteId, userId);

    // Validate settings
    const validation = validateSettings(data);
    if (!validation.valid) {
      throw new AppError(
        400,
        ErrorCode.VALIDATION_ERROR,
        `Validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Remove protected fields
    const sanitizedData = this.sanitizeSettingsData(data);

    return updateSettings(siteId, sanitizedData);
  }

  /**
   * Reset widget settings to defaults
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @returns Reset settings
   */
  async resetSettings(siteId: string, userId: string): Promise<WidgetSettings> {
    await this.verifySiteOwnership(siteId, userId);
    return resetSettings(siteId);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Verify user owns the site
   */
  private async verifySiteOwnership(siteId: string, userId: string): Promise<void> {
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }
  }

  /**
   * Remove protected fields from update data
   */
  private sanitizeSettingsData(
    data: Partial<WidgetSettings>
  ): Partial<WidgetSettings> {
    const sanitized = { ...data };
    delete (sanitized as any).id;
    delete (sanitized as any).siteId;
    delete (sanitized as any).createdAt;
    delete (sanitized as any).updatedAt;
    return sanitized;
  }
}

// Export singleton instance
export const widgetService = new WidgetService();
