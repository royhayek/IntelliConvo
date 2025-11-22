/**
 * Admin Subscription Service
 * Handles subscription management operations for admin panel
 */

import { SubscriptionStatus, PlanType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BusinessRuleError } from '../../middleware/errors';
import { adminExportService, ExportResult } from './AdminExportService';

interface GetSubscriptionsParams {
  page: number;
  limit: number;
  status?: SubscriptionStatus;
  planType?: PlanType;
  userId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'currentPeriodEnd' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  planType?: PlanType;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date | null;
}

class AdminSubscriptionService {
  /**
   * Get paginated list of subscriptions with filters
   */
  async getSubscriptions(params: GetSubscriptionsParams) {
    const {
      page,
      limit,
      status,
      planType,
      userId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (planType) {
      where.planType = planType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { site: { siteName: { contains: search, mode: 'insensitive' } } },
        { stripeSubscriptionId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          site: {
            select: {
              id: true,
              siteName: true,
              siteUrl: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get subscription by ID with full details
   */
  async getSubscriptionById(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
            billingInfo: true,
          },
        },
        site: {
          select: {
            id: true,
            siteName: true,
            siteUrl: true,
            createdAt: true,
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

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    // Get billing transactions for this subscription's site
    const transactions = await prisma.billingTransaction.findMany({
      where: { siteId: subscription.siteId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      ...subscription,
      recentTransactions: transactions,
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: string, data: UpdateSubscriptionData) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
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
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated,
    };
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (subscription.status !== 'CANCELLED') {
      throw new BusinessRuleError('Only cancelled subscriptions can be reactivated');
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        cancelledAt: null,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: updated,
    };
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    return {
      success: true,
      message: 'Subscription deleted successfully',
    };
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
      monthlySubscriptions,
      annualSubscriptions,
      recentSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      prisma.subscription.count({ where: { planType: 'PREMIUM_MONTHLY' } }),
      prisma.subscription.count({ where: { planType: 'PREMIUM_ANNUAL' } }),
      prisma.subscription.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get expiring soon (within 7 days)
    const expiringSoon = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    });

    return {
      total: totalSubscriptions,
      byStatus: {
        active: activeSubscriptions,
        trial: trialSubscriptions,
        cancelled: cancelledSubscriptions,
        expired: expiredSubscriptions,
      },
      byPlan: {
        monthly: monthlySubscriptions,
        annual: annualSubscriptions,
      },
      recentSubscriptions,
      expiringSoon,
    };
  }

  /**
   * Extend trial period
   */
  async extendTrial(subscriptionId: string, days: number) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (subscription.status !== 'TRIAL') {
      throw new BusinessRuleError('Can only extend trial for subscriptions in trial status');
    }

    const currentTrialEnd = subscription.trialEndsAt || new Date();
    const newTrialEnd = new Date(currentTrialEnd.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        trialEndsAt: newTrialEnd,
        currentPeriodEnd: newTrialEnd,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Trial extended by ${days} days`,
      subscription: updated,
    };
  }

  /**
   * Export subscriptions as CSV or JSON
   */
  async exportSubscriptions(format: 'csv' | 'json', filters?: Partial<GetSubscriptionsParams>): Promise<ExportResult> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.planType) {
      where.planType = filters.planType;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.search) {
      where.OR = [
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { site: { siteName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        site: {
          select: {
            siteName: true,
            siteUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = subscriptions.map((sub) => ({
      id: sub.id,
      userEmail: sub.user.email,
      userName: sub.user.fullName || '',
      siteName: sub.site?.siteName || '',
      siteUrl: sub.site?.siteUrl || '',
      status: sub.status,
      planType: sub.planType,
      stripeSubscriptionId: sub.stripeSubscriptionId || '',
      stripePriceId: sub.stripePriceId || '',
      currentPeriodStart: sub.currentPeriodStart?.toISOString() || '',
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || '',
      trialEndsAt: sub.trialEndsAt?.toISOString() || '',
      cancelledAt: sub.cancelledAt?.toISOString() || '',
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));

    return adminExportService.formatForExport(
      exportData,
      format,
      adminExportService.generateFilename('subscriptions')
    );
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
