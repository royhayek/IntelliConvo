/**
 * Notification Service
 * Business logic for user notifications
 */

import { prisma } from '../../lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getIO } from '../socket';

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  siteId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationListResponse {
  notifications: NotificationDTO[];
  unreadCount: number;
}

export interface CreateNotificationInput {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
  siteId?: string;
}

/**
 * NotificationService class
 * Handles all notification-related business logic
 */
export class NotificationService {
  /**
   * Get all notifications for a user
   * @param userId - User ID
   * @param limit - Maximum number of notifications to return
   * @returns List of notifications with unread count
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<NotificationListResponse> {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map(this.mapNotificationToDTO),
      unreadCount,
    };
  }

  /**
   * Get unread notification count for a user
   * @param userId - User ID
   * @returns Unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a notification as read
   * @param notificationId - Notification ID
   * @param userId - User ID (for authorization)
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDTO> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapNotificationToDTO(updated);
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - User ID
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a notification
   * @param notificationId - Notification ID
   * @param userId - User ID (for authorization)
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Create a new notification
   * @param input - Notification data
   * @returns Created notification
   */
  async createNotification(input: CreateNotificationInput): Promise<NotificationDTO> {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type || NotificationType.INFO,
        title: input.title,
        message: input.message,
        link: input.link,
        siteId: input.siteId,
      },
    });

    // Emit real-time notification
    const io = getIO();
    if (io) {
      io.to(`user:${input.userId}`).emit('notification', {
        id: notification.id,
        type: notification.type.toLowerCase(),
        title: notification.title,
        message: notification.message,
        link: notification.link,
        createdAt: notification.createdAt.toISOString(),
      });
    }

    logger.info(`Created notification for user ${input.userId}: ${input.title}`);
    return this.mapNotificationToDTO(notification);
  }

  /**
   * Map notification to DTO
   */
  private mapNotificationToDTO(notification: any): NotificationDTO {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      siteId: notification.siteId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() || null,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
