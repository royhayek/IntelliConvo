/**
 * Admin Widget Service
 * Handles widget settings management operations for admin panel
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';

interface GetWidgetsParams {
  page: number;
  limit: number;
  search?: string;
  theme?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

class AdminWidgetService {
  /**
   * Get paginated list of widget settings
   */
  async getWidgets(params: GetWidgetsParams) {
    const {
      page,
      limit,
      search,
      theme,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (theme) {
      where.theme = theme;
    }

    if (search) {
      where.OR = [
        { site: { siteName: { contains: search, mode: 'insensitive' } } },
        { site: { siteUrl: { contains: search, mode: 'insensitive' } } },
        { site: { user: { email: { contains: search, mode: 'insensitive' } } } },
        { headerTitle: { contains: search, mode: 'insensitive' } },
        { botName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [widgets, total] = await Promise.all([
      prisma.widgetSettings.findMany({
        where,
        include: {
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.widgetSettings.count({ where }),
    ]);

    // Return simplified widget data for list view
    const simplifiedWidgets = widgets.map(w => ({
      id: w.id,
      siteId: w.siteId,
      theme: w.theme,
      primaryColor: w.primaryColor,
      headerTitle: w.headerTitle,
      botName: w.botName,
      launcherPosition: w.launcherPosition,
      autoOpenEnabled: w.autoOpenEnabled,
      enableAnimations: w.enableAnimations,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      site: w.site,
    }));

    return {
      widgets: simplifiedWidgets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get widget settings by ID with full details
   */
  async getWidgetById(widgetId: string) {
    const widget = await prisma.widgetSettings.findUnique({
      where: { id: widgetId },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            siteDescription: true,
            startersHeadline: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
            subscription: {
              select: {
                id: true,
                status: true,
                planType: true,
              },
            },
            _count: {
              select: {
                conversations: true,
                urls: true,
              },
            },
          },
        },
      },
    });

    if (!widget) {
      throw new NotFoundError('Widget settings', widgetId);
    }

    return widget;
  }

  /**
   * Get widget settings by site ID
   */
  async getWidgetBySiteId(siteId: string) {
    const widget = await prisma.widgetSettings.findUnique({
      where: { siteId },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!widget) {
      throw new NotFoundError('Widget settings for site', siteId);
    }

    return widget;
  }

  /**
   * Update widget settings
   */
  async updateWidget(widgetId: string, data: Record<string, any>) {
    const widget = await prisma.widgetSettings.findUnique({
      where: { id: widgetId },
    });

    if (!widget) {
      throw new NotFoundError('Widget settings', widgetId);
    }

    // Remove any fields that shouldn't be updated directly
    const { id, siteId, createdAt, site, ...updateData } = data;

    const updated = await prisma.widgetSettings.update({
      where: { id: widgetId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Reset widget settings to defaults
   */
  async resetWidgetToDefaults(widgetId: string) {
    const widget = await prisma.widgetSettings.findUnique({
      where: { id: widgetId },
    });

    if (!widget) {
      throw new NotFoundError('Widget settings', widgetId);
    }

    // Default values matching the Prisma schema defaults
    const defaults = {
      // Colors
      primaryColor: '#6366f1',
      secondaryColor: '#818cf8',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      textSecondaryColor: '#64748b',
      borderColor: '#e2e8f0',

      // Typography
      fontFamily: 'system',
      fontSize: 14,
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightBold: 600,

      // Shapes & Borders
      borderRadius: 16,
      borderRadiusSmall: 12,
      borderRadiusButton: 8,
      borderWidth: 1,

      // Shadows
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowSize: 'medium',

      // Launcher
      launcherIcon: 'chat',
      launcherCustomIconUrl: null,
      launcherSize: 'medium',
      launcherPosition: 'bottom-right',
      launcherOffsetX: 20,
      launcherOffsetY: 20,
      launcherShape: 'circle',
      launcherBackgroundColor: null,
      launcherIconColor: '#ffffff',
      launcherBorderColor: null,
      launcherBorderWidth: 0,
      launcherText: null,
      launcherTooltip: 'Chat with us',
      launcherShowTooltip: true,
      launcherShowBadge: false,
      launcherBadgeColor: '#ef4444',
      launcherBadgeTextColor: '#ffffff',
      launcherAnimation: 'pulse',
      launcherAnimationDelay: 3000,

      // Chat Window
      chatWindowWidth: 400,
      chatWindowHeight: 600,
      chatWindowMaxHeight: '90vh',
      chatWindowZIndex: 999998,

      // Header
      headerBackgroundColor: null,
      headerTextColor: '#ffffff',
      headerHeight: 60,
      headerTitle: 'Chat Assistant',
      headerSubtitle: null,
      headerShowAvatar: true,
      headerAvatarUrl: null,
      headerShowStatus: true,
      headerShowCloseButton: true,
      headerShowMinimizeButton: false,

      // Theme
      theme: 'light',

      // Behavior
      autoOpenEnabled: false,
      autoOpenDelay: 5000,
      enableAnimations: true,
      showTypingIndicator: true,
      enableSoundNotifications: false,
      enableVoiceInput: true,
      showPoweredBy: false,
    };

    const updated = await prisma.widgetSettings.update({
      where: { id: widgetId },
      data: {
        ...defaults,
        updatedAt: new Date(),
      },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Widget settings reset to defaults',
      widget: updated,
    };
  }

  /**
   * Delete widget settings (will be recreated with defaults when needed)
   */
  async deleteWidget(widgetId: string) {
    const widget = await prisma.widgetSettings.findUnique({
      where: { id: widgetId },
    });

    if (!widget) {
      throw new NotFoundError('Widget settings', widgetId);
    }

    await prisma.widgetSettings.delete({
      where: { id: widgetId },
    });

    return {
      success: true,
      message: 'Widget settings deleted successfully',
    };
  }

  /**
   * Get widget statistics
   */
  async getWidgetStats() {
    const [
      totalWidgets,
      lightTheme,
      darkTheme,
      autoTheme,
      autoOpenEnabled,
      animationsEnabled,
      soundEnabled,
      voiceEnabled,
    ] = await Promise.all([
      prisma.widgetSettings.count(),
      prisma.widgetSettings.count({ where: { theme: 'light' } }),
      prisma.widgetSettings.count({ where: { theme: 'dark' } }),
      prisma.widgetSettings.count({ where: { theme: 'auto' } }),
      prisma.widgetSettings.count({ where: { autoOpenEnabled: true } }),
      prisma.widgetSettings.count({ where: { enableAnimations: true } }),
      prisma.widgetSettings.count({ where: { enableSoundNotifications: true } }),
      prisma.widgetSettings.count({ where: { enableVoiceInput: true } }),
    ]);

    // Get most used primary colors
    const colorGroups = await prisma.widgetSettings.groupBy({
      by: ['primaryColor'],
      _count: true,
      orderBy: {
        _count: {
          primaryColor: 'desc',
        },
      },
      take: 5,
    });

    // Get launcher positions distribution
    const positionGroups = await prisma.widgetSettings.groupBy({
      by: ['launcherPosition'],
      _count: true,
    });

    return {
      total: totalWidgets,
      byTheme: {
        light: lightTheme,
        dark: darkTheme,
        auto: autoTheme,
      },
      features: {
        autoOpenEnabled,
        animationsEnabled,
        soundEnabled,
        voiceEnabled,
      },
      topColors: colorGroups.map(g => ({
        color: g.primaryColor,
        count: g._count,
      })),
      launcherPositions: positionGroups.map(g => ({
        position: g.launcherPosition,
        count: g._count,
      })),
    };
  }

  /**
   * Bulk update widgets (for applying changes across multiple widgets)
   */
  async bulkUpdateWidgets(widgetIds: string[], data: Record<string, any>) {
    // Remove any fields that shouldn't be updated
    const { id, siteId, createdAt, site, ...updateData } = data;

    const result = await prisma.widgetSettings.updateMany({
      where: { id: { in: widgetIds } },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Updated ${result.count} widget settings`,
      count: result.count,
    };
  }
}

export const adminWidgetService = new AdminWidgetService();
