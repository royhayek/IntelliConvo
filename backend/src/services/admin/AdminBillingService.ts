/**
 * Admin Billing Service
 * Handles billing and transaction management operations for admin panel
 */

import { prisma } from '../../lib/prisma';
import { NotFoundError, ValidationError } from '../../middleware/errors';
import { adminExportService, ExportResult } from './AdminExportService';

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

    const validStatuses = ['paid', 'pending', 'failed', 'refunded'];
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
}

export const adminBillingService = new AdminBillingService();
