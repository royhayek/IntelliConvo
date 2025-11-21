/**
 * Billing Service
 * Business logic for billing and transaction management
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../middleware/errors';
import {
  BillingHistoryResponse,
  BillingSummaryResponse,
  TransactionDetailsResponse,
  BillingHistoryQuery,
  TransactionDTO,
  BillingSubscriptionDTO,
  UpcomingChargeDTO,
} from '../../dto/billing.dto';
import { calculatePagination, calculateOffset, normalizePagination } from '../../utils/response';

/**
 * BillingService class
 * Handles all billing-related business logic
 */
export class BillingService {
  /**
   * Get billing transaction history with pagination and filtering
   * @param userId - User ID
   * @param query - Query parameters (page, limit, status, siteId)
   * @returns Paginated billing history with summary
   */
  async getHistory(
    userId: string,
    query: BillingHistoryQuery
  ): Promise<BillingHistoryResponse> {
    const { page = 1, limit = 20, status, siteId } = query;

    // Normalize pagination params
    const { page: normalizedPage, limit: normalizedLimit } = normalizePagination(
      page,
      limit,
      100
    );
    const offset = calculateOffset(normalizedPage, normalizedLimit);

    // Build where clause
    const where: any = { userId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (siteId) {
      // Verify user owns the site
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId },
      });

      if (!site) {
        throw new NotFoundError('Site', siteId);
      }

      where.siteId = siteId;
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.billingTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: normalizedLimit,
      }),
      prisma.billingTransaction.count({ where }),
    ]);

    // Get site information for transactions
    const siteIds = [...new Set(transactions.map((t) => t.siteId))];
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, siteName: true, siteUrl: true },
    });

    const sitesMap = sites.reduce((acc, site) => {
      acc[site.id] = site;
      return acc;
    }, {} as Record<string, any>);

    // Calculate summary statistics
    const summary = await this.calculateSummary(userId);

    // Map transactions to DTOs
    const transactionDTOs: TransactionDTO[] = transactions.map((transaction) => ({
      id: transaction.id,
      invoiceId: transaction.invoiceId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status as 'paid' | 'pending' | 'failed',
      stripeInvoiceId: transaction.stripeInvoiceId,
      createdAt: transaction.createdAt.toISOString(),
      site: sitesMap[transaction.siteId],
    }));

    return {
      transactions: transactionDTOs,
      pagination: calculatePagination(normalizedPage, normalizedLimit, totalCount),
      summary,
    };
  }

  /**
   * Get billing summary for user
   * @param userId - User ID
   * @returns Complete billing summary
   */
  async getSummary(userId: string): Promise<BillingSummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current month transactions
    const currentMonthTransactions = await prisma.billingTransaction.findMany({
      where: {
        userId,
        status: 'paid',
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    });

    // Get all-time transactions
    const allTimeTransactions = await prisma.billingTransaction.findMany({
      where: {
        userId,
        status: 'paid',
      },
      select: { amount: true },
    });

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ['TRIAL', 'ACTIVE'] },
      },
      include: {
        site: {
          select: { id: true, siteName: true, siteUrl: true },
        },
      },
    });

    // Map to DTOs
    const subscriptionDTOs: BillingSubscriptionDTO[] = activeSubscriptions.map((sub) => ({
      id: sub.id,
      planType: sub.planType,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      site: sub.site,
    }));

    // Calculate upcoming charges (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingCharges: UpcomingChargeDTO[] = activeSubscriptions
      .filter((sub) => sub.currentPeriodEnd <= thirtyDaysFromNow)
      .map((sub) => ({
        subscriptionId: sub.id,
        amount: sub.planType === 'PREMIUM_MONTHLY' ? 49.99 : 499.99,
        dueDate: sub.currentPeriodEnd.toISOString(),
        siteName: sub.site.siteName,
      }));

    return {
      currentPeriod: {
        totalAmount: currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0),
        transactionCount: currentMonthTransactions.length,
      },
      allTime: {
        totalAmount: allTimeTransactions.reduce((sum, t) => sum + t.amount, 0),
        transactionCount: allTimeTransactions.length,
      },
      activeSubscriptions: subscriptionDTOs,
      upcomingCharges,
    };
  }

  /**
   * Get transaction details by ID
   * @param transactionId - Transaction ID
   * @param userId - User ID (for authorization)
   * @returns Transaction details
   */
  async getTransactionDetails(
    transactionId: string,
    userId: string
  ): Promise<TransactionDetailsResponse> {
    const transaction = await prisma.billingTransaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', transactionId);
    }

    // Get site information
    const site = await prisma.site.findUnique({
      where: { id: transaction.siteId },
      select: { id: true, siteName: true, siteUrl: true },
    });

    const transactionDTO: TransactionDTO = {
      id: transaction.id,
      invoiceId: transaction.invoiceId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status as 'paid' | 'pending' | 'failed',
      stripeInvoiceId: transaction.stripeInvoiceId,
      createdAt: transaction.createdAt.toISOString(),
      site: site!,
    };

    return {
      transaction: transactionDTO,
    };
  }

  /**
   * Calculate billing summary for user
   * @param userId - User ID
   * @returns Billing summary
   */
  private async calculateSummary(userId: string) {
    const allTransactions = await prisma.billingTransaction.findMany({
      where: { userId },
      select: { amount: true, status: true },
    });

    return {
      totalAmount: allTransactions
        .filter((t) => t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0),
      totalTransactions: allTransactions.length,
      statusCounts: {
        paid: allTransactions.filter((t) => t.status === 'paid').length,
        pending: allTransactions.filter((t) => t.status === 'pending').length,
        failed: allTransactions.filter((t) => t.status === 'failed').length,
      },
    };
  }
}

// Export singleton instance
export const billingService = new BillingService();
