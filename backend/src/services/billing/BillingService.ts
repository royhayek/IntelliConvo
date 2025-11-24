/**
 * Billing Service
 * Business logic for billing and transaction management
 */

import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../middleware/errors';
import { logger } from '../../utils/logger';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});
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

    // Calculate summary statistics (filtered by siteId if provided)
    const summary = await this.calculateSummary(userId, siteId);

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
   * @param siteId - Optional site ID to filter by specific site
   * @returns Complete billing summary
   */
  async getSummary(userId: string, siteId?: string): Promise<BillingSummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build where clause with optional siteId filter
    const transactionWhere: { userId: string; status: string; createdAt?: { gte: Date }; siteId?: string } = {
      userId,
      status: 'paid',
    };
    if (siteId) {
      transactionWhere.siteId = siteId;
    }

    // Get current month transactions
    const currentMonthTransactions = await prisma.billingTransaction.findMany({
      where: {
        ...transactionWhere,
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    });

    // Get all-time transactions
    const allTimeTransactions = await prisma.billingTransaction.findMany({
      where: transactionWhere,
      select: { amount: true },
    });

    // Get active subscriptions with site info
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ['TRIAL', 'ACTIVE'] },
        ...(siteId && { siteId }),
      },
      include: {
        site: {
          select: { id: true, siteName: true, siteUrl: true },
        },
      },
    });

    // Map to DTOs - include all required fields from OpenAPI schema
    // Prices should match what's configured in Stripe ($29/month, $279/year)
    const subscriptionDTOs: BillingSubscriptionDTO[] = activeSubscriptions.map((sub) => ({
      id: sub.id,
      siteId: sub.siteId,
      siteName: sub.site.siteName,
      planType: sub.planType,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      amount: sub.planType === 'PREMIUM_MONTHLY' ? 29 : 279,
      site: {
        id: sub.site.id,
        siteName: sub.site.siteName,
      },
    }));

    // Calculate upcoming charges (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingCharges: UpcomingChargeDTO[] = activeSubscriptions
      .filter((sub) => sub.currentPeriodEnd <= thirtyDaysFromNow && !sub.cancelAtPeriodEnd)
      .map((sub) => ({
        siteId: sub.siteId,
        siteName: sub.site.siteName,
        amount: sub.planType === 'PREMIUM_MONTHLY' ? 29 : 279,
        dueDate: sub.currentPeriodEnd.toISOString(),
        planType: sub.planType,
      }));

    // Calculate next billing date from active subscriptions (exclude those scheduled to cancel)
    const billableSubscriptions = activeSubscriptions.filter(sub => !sub.cancelAtPeriodEnd);
    const nextBillingDate = billableSubscriptions.length > 0
      ? billableSubscriptions
          .map(sub => sub.currentPeriodEnd)
          .sort((a, b) => a.getTime() - b.getTime())[0]?.toISOString() || null
      : null;

    return {
      totalSpent: allTimeTransactions.reduce((sum, t) => sum + t.amount, 0),
      currentMonthSpent: currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: allTimeTransactions.length,
      nextBillingDate,
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
   * Get receipt URL from Stripe
   * @param transactionId - Transaction ID
   * @param userId - User ID (for authorization)
   * @returns Receipt URL to open in browser
   */
  async getReceiptUrl(
    transactionId: string,
    userId: string
  ): Promise<{ receiptUrl: string }> {
    // Fetch the transaction and verify ownership
    const transaction = await prisma.billingTransaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', transactionId);
    }

    // Check if the transaction has a Stripe invoice ID
    if (!transaction.stripeInvoiceId) {
      throw new ValidationError('This transaction does not have an associated receipt');
    }

    // Check if the transaction is paid
    if (transaction.status !== 'paid') {
      throw new ValidationError('Receipt is only available for paid transactions');
    }

    try {
      // Fetch the invoice from Stripe to get the charge
      const invoice = await stripe.invoices.retrieve(transaction.stripeInvoiceId);

      // Get the receipt URL from the charge
      if (invoice.charge) {
        const chargeId = typeof invoice.charge === 'string' ? invoice.charge : invoice.charge.id;
        const charge = await stripe.charges.retrieve(chargeId);

        if (charge.receipt_url) {
          return { receiptUrl: charge.receipt_url };
        }
      }

      // Fallback to hosted invoice URL if no receipt available
      if (invoice.hosted_invoice_url) {
        return { receiptUrl: invoice.hosted_invoice_url };
      }

      throw new ValidationError('Receipt is not available for this transaction');
    } catch (error) {
      // Handle Stripe-specific errors
      if (error instanceof Stripe.errors.StripeError) {
        logger.error('Stripe error fetching receipt:', {
          transactionId,
          stripeInvoiceId: transaction.stripeInvoiceId,
          error: error.message,
        });

        if (error.code === 'resource_missing') {
          throw new NotFoundError('Stripe Receipt', transaction.stripeInvoiceId);
        }

        throw new ValidationError(`Failed to retrieve receipt: ${error.message}`);
      }

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Error fetching receipt URL:', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new ValidationError('Failed to get receipt URL');
    }
  }

  /**
   * Calculate billing summary for user
   * @param userId - User ID
   * @returns Billing summary
   */
  private async calculateSummary(userId: string, siteId?: string) {
    const where: { userId: string; siteId?: string } = { userId };
    if (siteId) {
      where.siteId = siteId;
    }

    const allTransactions = await prisma.billingTransaction.findMany({
      where,
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
