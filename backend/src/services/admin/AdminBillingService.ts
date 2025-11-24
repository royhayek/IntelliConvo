/**
 * Admin Billing Service
 * Handles billing and transaction management operations for admin panel
 */

import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../middleware/errors';
import { adminExportService, ExportResult } from './AdminExportService';
import { logger } from '../../utils/logger';
import { queueRefundConfirmationEmail } from '../../queues';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface GetTransactionsParams {
  page: number;
  limit: number;
  userId?: string;
  siteId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

interface GetBillingInfoParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

class AdminBillingService {
  /**
   * Get paginated list of billing transactions
   */
  async getTransactions(params: GetTransactionsParams) {
    const {
      page,
      limit,
      userId,
      siteId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.billingTransaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.billingTransaction.count({ where }),
    ]);

    // Enhance transactions with site info
    const siteIds = [...new Set(transactions.map(t => t.siteId))];
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: {
        id: true,
        siteName: true,
        siteUrl: true,
      },
    });

    const siteMap = new Map(sites.map(s => [s.id, s]));

    const enhancedTransactions = transactions.map(t => ({
      ...t,
      site: siteMap.get(t.siteId) || null,
    }));

    return {
      transactions: enhancedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    const transaction = await prisma.billingTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            billingInfo: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', transactionId);
    }

    // Get site info
    const site = await prisma.site.findUnique({
      where: { id: transaction.siteId },
      select: {
        id: true,
        siteName: true,
        siteUrl: true,
        subscription: {
          select: {
            id: true,
            status: true,
            planType: true,
          },
        },
      },
    });

    return {
      ...transaction,
      site,
    };
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(transactionId: string, status: string) {
    const transaction = await prisma.billingTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', transactionId);
    }

    const validStatuses = ['paid', 'pending', 'failed', 'refunded', 'partially_refunded', 'disputed'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await prisma.billingTransaction.update({
      where: { id: transactionId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId: string) {
    const transaction = await prisma.billingTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', transactionId);
    }

    await prisma.billingTransaction.delete({
      where: { id: transactionId },
    });

    return {
      success: true,
      message: 'Transaction deleted successfully',
    };
  }

  /**
   * Get paginated list of billing info records
   */
  async getBillingInfoList(params: GetBillingInfoParams) {
    const {
      page,
      limit,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [billingInfos, total] = await Promise.all([
      prisma.billingInfo.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.billingInfo.count({ where }),
    ]);

    return {
      billingInfos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get billing info by ID
   */
  async getBillingInfoById(billingInfoId: string) {
    const billingInfo = await prisma.billingInfo.findUnique({
      where: { id: billingInfoId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            subscriptions: {
              select: {
                id: true,
                status: true,
                planType: true,
                site: {
                  select: {
                    id: true,
                    siteName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!billingInfo) {
      throw new NotFoundError('Billing info', billingInfoId);
    }

    // Get transaction history for this user
    const transactions = await prisma.billingTransaction.findMany({
      where: { userId: billingInfo.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      ...billingInfo,
      recentTransactions: transactions,
    };
  }

  /**
   * Get billing statistics
   */
  async getBillingStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTransactions,
      paidTransactions,
      pendingTransactions,
      failedTransactions,
      totalRevenue,
      monthlyRevenue,
      recentTransactions,
      billingInfoCount,
    ] = await Promise.all([
      prisma.billingTransaction.count(),
      prisma.billingTransaction.count({ where: { status: 'paid' } }),
      prisma.billingTransaction.count({ where: { status: 'pending' } }),
      prisma.billingTransaction.count({ where: { status: 'failed' } }),
      prisma.billingTransaction.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.billingTransaction.aggregate({
        where: {
          status: 'paid',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.billingTransaction.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.billingInfo.count(),
    ]);

    // Get revenue by currency
    const revenueByCurrency = await prisma.billingTransaction.groupBy({
      by: ['currency'],
      where: { status: 'paid' },
      _sum: { amount: true },
      _count: true,
    });

    return {
      transactions: {
        total: totalTransactions,
        paid: paidTransactions,
        pending: pendingTransactions,
        failed: failedTransactions,
        recent: recentTransactions,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        monthly: monthlyRevenue._sum.amount || 0,
        byCurrency: revenueByCurrency.map(r => ({
          currency: r.currency,
          total: r._sum.amount || 0,
          count: r._count,
        })),
      },
      billingInfoCount,
    };
  }

  /**
   * Create manual transaction (for admin adjustments)
   */
  async createManualTransaction(data: {
    userId: string;
    siteId: string;
    amount: number;
    currency?: string;
    status: string;
    notes?: string;
  }) {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundError('User', data.userId);
    }

    // Verify site exists
    const site = await prisma.site.findUnique({ where: { id: data.siteId } });
    if (!site) {
      throw new NotFoundError('Site', data.siteId);
    }

    const transaction = await prisma.billingTransaction.create({
      data: {
        userId: data.userId,
        siteId: data.siteId,
        invoiceId: `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return transaction;
  }

  /**
   * Export transactions as CSV or JSON
   */
  async exportTransactions(format: 'csv' | 'json', filters?: Partial<GetTransactionsParams>): Promise<ExportResult> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters?.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const transactions = await prisma.billingTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get site info for all transactions
    const siteIds = [...new Set(transactions.map(t => t.siteId))];
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: {
        id: true,
        siteName: true,
        siteUrl: true,
      },
    });

    const siteMap = new Map(sites.map(s => [s.id, s]));

    const exportData = transactions.map((txn) => {
      const site = siteMap.get(txn.siteId);
      return {
        id: txn.id,
        invoiceId: txn.invoiceId || '',
        userEmail: txn.user.email,
        userName: txn.user.fullName || '',
        siteName: site?.siteName || '',
        siteUrl: site?.siteUrl || '',
        amount: txn.amount,
        currency: txn.currency,
        status: txn.status,
        stripeInvoiceId: txn.stripeInvoiceId || '',
        createdAt: txn.createdAt.toISOString(),
      };
    });

    return adminExportService.formatForExport(
      exportData,
      format,
      adminExportService.generateFilename('transactions')
    );
  }

  /**
   * Issue a refund for a transaction via Stripe
   */
  async issueRefund(transactionId: string, data: {
    amount?: number; // Optional partial refund amount (in dollars)
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    adminNotes?: string;
  }) {
    const transaction = await prisma.billingTransaction.findUnique({
      where: { id: transactionId },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction', transactionId);
    }

    if (!transaction.stripeInvoiceId) {
      throw new ValidationError('Cannot refund: No Stripe invoice ID associated with this transaction');
    }

    if (transaction.status === 'refunded') {
      throw new ValidationError('This transaction has already been refunded');
    }

    if (transaction.status !== 'paid') {
      throw new ValidationError('Can only refund paid transactions');
    }

    try {
      // Get the invoice to find the payment intent or charge
      const invoice = await stripe.invoices.retrieve(transaction.stripeInvoiceId);

      if (!invoice.charge) {
        throw new ValidationError('No charge found for this invoice');
      }

      const chargeId = typeof invoice.charge === 'string' ? invoice.charge : invoice.charge.id;

      // Calculate refund amount (convert to cents)
      const refundAmountCents = data.amount
        ? Math.round(data.amount * 100)
        : Math.round(transaction.amount * 100);

      // Issue refund via Stripe
      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: refundAmountCents,
        reason: data.reason || 'requested_by_customer',
        metadata: {
          transactionId: transaction.id,
          adminNotes: data.adminNotes || '',
        },
      });

      logger.info(`Refund issued: ${refund.id} for transaction ${transactionId}, amount: ${refundAmountCents / 100}`);

      // Determine if full or partial refund
      const isFullRefund = refundAmountCents >= Math.round(transaction.amount * 100);
      const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

      // Update transaction status
      const updatedTransaction = await prisma.billingTransaction.update({
        where: { id: transactionId },
        data: { status: newStatus },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Get site info for email
      const site = await prisma.site.findUnique({
        where: { id: transaction.siteId },
        select: { siteName: true },
      });

      // Send refund confirmation email
      if (transaction.user) {
        try {
          await queueRefundConfirmationEmail(transaction.user.id, transaction.user.email, {
            userName: transaction.user.fullName || '',
            email: transaction.user.email,
            siteName: site?.siteName || 'Unknown Site',
            amount: `$${(refundAmountCents / 100).toFixed(2)} ${transaction.currency}`,
            refundDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            transactionId: transaction.id,
            reason: data.reason,
          });
        } catch (emailError) {
          logger.error('Failed to send refund confirmation email:', emailError);
        }
      }

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmountCents / 100,
        currency: transaction.currency,
        status: newStatus,
        transaction: updatedTransaction,
      };
    } catch (error: any) {
      logger.error('Stripe refund error:', error);
      if (error instanceof Stripe.errors.StripeError) {
        throw new ValidationError(`Stripe error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get list of disputes from Stripe
   */
  async getDisputes(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = params;

    try {
      // Fetch disputes from Stripe
      // Note: Stripe disputes.list doesn't support status filter directly
      // We'll fetch all and filter client-side if needed
      const disputes = await stripe.disputes.list({
        limit: Math.min(limit, 100),
      });

      // Filter by status if provided
      let filteredDisputes = disputes.data;
      if (status && status !== 'all') {
        filteredDisputes = disputes.data.filter(d => d.status === status);
      }

      // Enrich with local transaction data
      const enrichedDisputes = await Promise.all(
        filteredDisputes.map(async (dispute) => {
          const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
          let localTransaction = null;
          let user = null;
          let site = null;

          if (chargeId) {
            try {
              const charge = await stripe.charges.retrieve(chargeId);
              if (charge.invoice) {
                const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;
                localTransaction = await prisma.billingTransaction.findFirst({
                  where: { stripeInvoiceId: invoiceId },
                });

                if (localTransaction) {
                  user = await prisma.user.findUnique({
                    where: { id: localTransaction.userId },
                    select: { id: true, email: true, fullName: true },
                  });
                  site = await prisma.site.findUnique({
                    where: { id: localTransaction.siteId },
                    select: { id: true, siteName: true },
                  });
                }
              }
            } catch (e) {
              logger.warn(`Could not enrich dispute ${dispute.id}:`, e);
            }
          }

          return {
            id: dispute.id,
            amount: dispute.amount / 100,
            currency: dispute.currency.toUpperCase(),
            status: dispute.status,
            reason: dispute.reason,
            created: new Date(dispute.created * 1000).toISOString(),
            evidenceDueBy: dispute.evidence_details?.due_by
              ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
              : null,
            isChargeRefundable: dispute.is_charge_refundable,
            chargeId,
            localTransaction: localTransaction ? {
              id: localTransaction.id,
              status: localTransaction.status,
            } : null,
            user,
            site,
            stripeUrl: `https://dashboard.stripe.com/disputes/${dispute.id}`,
          };
        })
      );

      return {
        disputes: enrichedDisputes,
        hasMore: disputes.has_more,
        pagination: {
          page,
          limit,
          total: enrichedDisputes.length, // Stripe doesn't provide total count
        },
      };
    } catch (error: any) {
      logger.error('Error fetching disputes from Stripe:', error);
      throw new ValidationError(`Failed to fetch disputes: ${error.message}`);
    }
  }

  /**
   * Get dispute details by ID
   */
  async getDisputeById(disputeId: string) {
    try {
      const dispute = await stripe.disputes.retrieve(disputeId);

      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      let localTransaction = null;
      let user = null;
      let site = null;
      let subscription = null;

      if (chargeId) {
        const charge = await stripe.charges.retrieve(chargeId);
        if (charge.invoice) {
          const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;
          localTransaction = await prisma.billingTransaction.findFirst({
            where: { stripeInvoiceId: invoiceId },
          });

          if (localTransaction) {
            user = await prisma.user.findUnique({
              where: { id: localTransaction.userId },
              select: {
                id: true,
                email: true,
                fullName: true,
                createdAt: true,
              },
            });
            site = await prisma.site.findUnique({
              where: { id: localTransaction.siteId },
              select: { id: true, siteName: true, siteUrl: true },
            });
            subscription = await prisma.subscription.findFirst({
              where: { siteId: localTransaction.siteId },
              select: {
                id: true,
                status: true,
                planType: true,
                createdAt: true,
              },
            });
          }
        }
      }

      return {
        id: dispute.id,
        amount: dispute.amount / 100,
        currency: dispute.currency.toUpperCase(),
        status: dispute.status,
        reason: dispute.reason,
        created: new Date(dispute.created * 1000).toISOString(),
        evidenceDueBy: dispute.evidence_details?.due_by
          ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
          : null,
        hasEvidence: dispute.evidence_details?.has_evidence || false,
        submissionCount: dispute.evidence_details?.submission_count || 0,
        isChargeRefundable: dispute.is_charge_refundable,
        networkReasonCode: dispute.network_reason_code,
        chargeId,
        localTransaction,
        user,
        site,
        subscription,
        stripeUrl: `https://dashboard.stripe.com/disputes/${dispute.id}`,
        // Evidence details (what has been submitted)
        evidence: {
          customerName: dispute.evidence?.customer_name,
          customerEmail: dispute.evidence?.customer_email_address,
          productDescription: dispute.evidence?.product_description,
          serviceDate: dispute.evidence?.service_date,
        },
      };
    } catch (error: any) {
      logger.error('Error fetching dispute from Stripe:', error);
      if (error.code === 'resource_missing') {
        throw new NotFoundError('Dispute', disputeId);
      }
      throw new ValidationError(`Failed to fetch dispute: ${error.message}`);
    }
  }

  /**
   * Get enhanced billing stats including disputes
   */
  async getBillingStatsEnhanced() {
    const basicStats = await this.getBillingStats();

    // Get dispute stats from Stripe
    let disputeStats = {
      total: 0,
      needsResponse: 0,
      underReview: 0,
      won: 0,
      lost: 0,
      amountAtRisk: 0,
    };

    try {
      // Fetch all disputes and categorize by status
      const allDisputes = await stripe.disputes.list({ limit: 100 });

      const needsResponse = allDisputes.data.filter(d => d.status === 'needs_response');
      const underReview = allDisputes.data.filter(d => d.status === 'under_review');
      const won = allDisputes.data.filter(d => d.status === 'won');
      const lost = allDisputes.data.filter(d => d.status === 'lost');

      disputeStats = {
        total: allDisputes.data.length,
        needsResponse: needsResponse.length,
        underReview: underReview.length,
        won: won.length,
        lost: lost.length,
        amountAtRisk: [...needsResponse, ...underReview].reduce((sum, d) => sum + d.amount, 0) / 100,
      };
    } catch (error) {
      logger.warn('Could not fetch dispute stats from Stripe:', error);
    }

    // Get refund stats
    const [refundedCount, partiallyRefundedCount, refundedAmount] = await Promise.all([
      prisma.billingTransaction.count({ where: { status: 'refunded' } }),
      prisma.billingTransaction.count({ where: { status: 'partially_refunded' } }),
      prisma.billingTransaction.aggregate({
        where: { status: { in: ['refunded', 'partially_refunded'] } },
        _sum: { amount: true },
      }),
    ]);

    return {
      ...basicStats,
      transactions: {
        ...basicStats.transactions,
        refunded: refundedCount,
        partiallyRefunded: partiallyRefundedCount,
        disputed: await prisma.billingTransaction.count({ where: { status: 'disputed' } }),
      },
      refunds: {
        total: refundedCount + partiallyRefundedCount,
        amount: refundedAmount._sum.amount || 0,
      },
      disputes: disputeStats,
    };
  }
}

export const adminBillingService = new AdminBillingService();
