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
import { isOriginAllowed } from '../../utils/hostValidation';
import { saveFile, deleteFile, FileType } from '../../utils/fileStorage';

/**
 * DTO Interfaces
 */
export interface SiteConfigDTO {
  id: string;
  siteName: string;
  siteUrl: string;
  startersHeadline: string | null;
}

export interface SiteValidationDTO {
  valid: boolean;
  siteName: string;
  status: string;
}

export interface StartersDTO {
  startersHeadline: string | null;
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
      startersHeadline: site.startersHeadline,
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
        startersHeadline: true,
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

    // Check if subscription is active - block EXPIRED and CANCELLED subscriptions
    // Use a generic user-friendly message that doesn't reveal billing details
    if (site.subscription && ['EXPIRED', 'CANCELLED'].includes(site.subscription.status)) {
      throw new AppError(
        503,
        ErrorCode.SERVICE_UNAVAILABLE,
        'This service is temporarily unavailable. Please try again later.'
      );
    }

    // Check if origin is allowed
    if (origin && site.activeHosts.length > 0) {
      const allowedHosts = site.activeHosts
        .filter((host) => host.isEnabled)
        .map((host) => host.hostName);

      if (!isOriginAllowed(origin, allowedHosts)) {
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
   * Get conversation history by session ID
   * @param siteId - Site ID
   * @param sessionId - Session ID
   * @returns Conversation with messages
   */
  async getConversationHistory(siteId: string, sessionId: string): Promise<{ messages: Array<{ id: string; role: string; content: string; createdAt: Date }> }> {
    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Find conversation by sessionId and siteId
    const conversation = await prisma.conversation.findFirst({
      where: {
        sessionId,
        siteId,
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    // If no conversation found, return empty messages array
    if (!conversation) {
      return { messages: [] };
    }

    return {
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role.toLowerCase(),
        content: msg.content,
        createdAt: msg.timestamp,
      })),
    };
  }

  /**
   * Get public widget settings
   * @param siteId - Site ID
   * @returns Public widget settings
   */
  async getPublicSettings(siteId: string): Promise<Partial<WidgetSettings> & { readiness?: { ready: number; total: number; isPartiallyReady: boolean } }> {
    // Verify site exists and get URL readiness stats
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: {
            urls: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundError('Site', siteId);
    }

    // Get readiness stats for progressive availability
    const [readyCount, totalCount] = await Promise.all([
      prisma.siteUrl.count({
        where: {
          siteId,
          embeddingStatus: 'READY',
          isActive: true,
          isExcluded: false,
        },
      }),
      prisma.siteUrl.count({
        where: {
          siteId,
          isActive: true,
          isExcluded: false,
        },
      }),
    ]);

    const settings = await getPublicWidgetSettings(siteId);

    return {
      ...settings,
      // Add readiness info for progressive availability
      readiness: {
        ready: readyCount,
        total: totalCount,
        isPartiallyReady: readyCount > 0 && readyCount < totalCount,
      },
    };
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

  /**
   * Upload a custom launcher logo
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   * @param file - Logo file
   * @returns Logo URL
   */
  async uploadLogo(
    siteId: string,
    userId: string,
    file: Express.Multer.File
  ): Promise<string> {
    await this.verifySiteOwnership(siteId, userId);

    // Save file using organized storage
    const logoUrl = await saveFile({
      fileType: FileType.LOGO,
      siteId,
      buffer: file.buffer,
      originalName: file.originalname,
    });

    // Update widget settings with logo URL
    await updateSettings(siteId, {
      launcherCustomIconUrl: logoUrl,
    });

    return logoUrl;
  }

  /**
   * Delete custom launcher logo
   * @param siteId - Site ID
   * @param userId - User ID (for authorization)
   */
  async deleteLogo(siteId: string, userId: string): Promise<void> {
    await this.verifySiteOwnership(siteId, userId);

    // Get current settings
    const widgetSettings = await getOrCreateWidgetSettings(siteId);

    if (widgetSettings.launcherCustomIconUrl) {
      // Delete file from storage using utility
      await deleteFile(widgetSettings.launcherCustomIconUrl);

      // Remove logo URL from settings
      await updateSettings(siteId, {
        launcherCustomIconUrl: null,
      });
    }
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
