import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  getOrCreateWidgetSettings,
  getPublicWidgetSettings,
  updateWidgetSettings,
  resetWidgetSettings,
  validateWidgetSettings,
} from '../services/widgetSettings';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/widget/{siteId}/starters:
 *   get:
 *     summary: Get conversation starters (public)
 *     description: Retrieve conversation starters for a site's widget (no authentication required)
 *     tags: [Widget]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Conversation starters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StartersResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/starters', async (req, res, next) => {
  try {
    const { siteId } = req.params;

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
      throw new AppError(404, 'Site not found');
    }

    res.json({
      welcomeMessage: site.welcomeMessage,
      starters: site.conversationStarters,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/widget/{siteId}/config:
 *   get:
 *     summary: Get site configuration (public)
 *     description: Retrieve site configuration for widget initialization (no authentication required)
 *     tags: [Widget]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteConfigResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/config', async (req, res, next) => {
  try {
    const { siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        siteName: true,
        welcomeMessage: true,
        conversationStarters: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            starterText: true,
          },
        },
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    res.json(site);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/widget/{siteId}/validate:
 *   get:
 *     summary: Validate site for widget (public)
 *     description: Validate site ID, check subscription status, and verify origin is allowed
 *     tags: [Widget]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site validation successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateSiteResponse'
 *       403:
 *         description: Subscription expired or origin not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/validate', async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const origin = req.get('Origin') || req.get('Referer');

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        activeHosts: true,
        subscription: true,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Check if subscription is active
    if (site.subscription && site.subscription.status === 'EXPIRED') {
      throw new AppError(403, 'Subscription expired');
    }

    // Check if origin is allowed
    if (origin && site.activeHosts.length > 0) {
      const originHost = new URL(origin).hostname;
      const allowedHosts = site.activeHosts
        .filter(host => host.isEnabled)
        .map(host => host.hostName);

      const isAllowed = allowedHosts.some(host => {
        return originHost === host ||
               originHost === `www.${host}` ||
               `www.${originHost}` === host;
      });

      if (!isAllowed) {
        throw new AppError(403, 'Origin not allowed');
      }
    }

    res.json({
      valid: true,
      siteName: site.siteName,
      status: site.subscription?.status || 'TRIAL'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PUBLIC WIDGET SETTINGS ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/widget/{siteId}/settings:
 *   get:
 *     summary: Get public widget settings (public)
 *     description: Retrieve widget settings for the embedded widget (no authentication required)
 *     tags: [Widget]
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Widget settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WidgetSettings'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/settings', async (req, res, next) => {
  try {
    const { siteId } = req.params;

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    const settings = await getPublicWidgetSettings(siteId);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// ============================================
// AUTHENTICATED WIDGET SETTINGS ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/widget/{siteId}/settings/admin:
 *   get:
 *     summary: Get widget settings (admin)
 *     description: Retrieve complete widget settings for authenticated user's site
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Widget settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WidgetSettings'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/settings/admin', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.id;

    // Verify site belongs to user
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    const settings = await getOrCreateWidgetSettings(siteId);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/widget/{siteId}/settings:
 *   patch:
 *     summary: Update widget settings (partial)
 *     description: Partially update widget settings for a site
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial widget settings to update
 *     responses:
 *       200:
 *         description: Widget settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WidgetSettings'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:siteId/settings', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Verify site belongs to user
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Validate the update data
    const validation = validateWidgetSettings(updateData);
    if (!validation.valid) {
      throw new AppError(400, `Validation failed: ${validation.errors.join(', ')}`);
    }

    // Remove any fields that shouldn't be updated
    delete updateData.id;
    delete updateData.siteId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const settings = await updateWidgetSettings(siteId, updateData);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/widget/{siteId}/settings/reset:
 *   put:
 *     summary: Reset widget settings to defaults
 *     description: Reset all widget settings to their default values
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Widget settings reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WidgetSettings'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:siteId/settings/reset', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.id;

    // Verify site belongs to user
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    const settings = await resetWidgetSettings(siteId);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/widget/{siteId}/settings:
 *   put:
 *     summary: Replace all widget settings
 *     description: Replace all widget settings with new values (bulk update)
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Complete widget settings to replace
 *     responses:
 *       200:
 *         description: Widget settings replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WidgetSettings'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:siteId/settings', authenticate, async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    // Verify site belongs to user
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    // Validate the update data
    const validation = validateWidgetSettings(updateData);
    if (!validation.valid) {
      throw new AppError(400, `Validation failed: ${validation.errors.join(', ')}`);
    }

    // Remove any fields that shouldn't be updated
    delete updateData.id;
    delete updateData.siteId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const settings = await updateWidgetSettings(siteId, updateData);

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/widget/{siteId}/settings/category/{category}:
 *   get:
 *     summary: Get widget settings by category
 *     description: Retrieve specific category of widget settings for partial loading
 *     tags: [Widget]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [appearance, launcher, chatWindow, behavior, content, responsive, advanced]
 *         description: Settings category
 *     responses:
 *       200:
 *         description: Category settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Subset of widget settings for the specified category
 *       400:
 *         description: Invalid category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:siteId/settings/category/:category', authenticate, async (req, res, next) => {
  try {
    const { siteId, category } = req.params;
    const userId = req.user!.id;

    // Verify site belongs to user
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId,
      },
    });

    if (!site) {
      throw new AppError(404, 'Site not found');
    }

    const settings = await getOrCreateWidgetSettings(siteId);

    // Define category mappings
    const categories: Record<string, (keyof typeof settings)[]> = {
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
        'focusRingColor', 'focusRingWidth', 'theme', 'darkModeBackgroundColor',
        'darkModeTextColor', 'darkModeBorderColor', 'customCss',
        'lazyLoadMessages', 'preloadWidget', 'sanitizeHtml', 'allowedHtmlTags',
        'enableAnalytics', 'trackMessageEvents', 'trackUserInteractions',
      ],
    };

    if (!categories[category]) {
      throw new AppError(400, `Invalid category. Valid categories: ${Object.keys(categories).join(', ')}`);
    }

    const categorySettings: Record<string, any> = {};
    for (const key of categories[category]) {
      categorySettings[key] = settings[key];
    }

    res.json(categorySettings);
  } catch (error) {
    next(error);
  }
});

export default router;