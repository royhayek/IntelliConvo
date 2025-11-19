import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const billingHistoryQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  status: z.enum(['paid', 'pending', 'failed', 'all']).optional(),
  siteId: z.string().optional(),
});

/**
 * @swagger
 * /api/billing/history:
 *   get:
 *     summary: Get billing transaction history
 *     description: Retrieve the user's billing transaction history with pagination and filtering
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, pending, failed, all]
 *         description: Filter by transaction status
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Filter by specific site
 *     responses:
 *       200:
 *         description: Billing history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       invoiceId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                         format: float
 *                       currency:
 *                         type: string
 *                         default: USD
 *                       status:
 *                         type: string
 *                         enum: [paid, pending, failed]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       site:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           siteName:
 *                             type: string
 *                           siteUrl:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                     totalTransactions:
 *                       type: integer
 *                     statusCounts:
 *                       type: object
 *                       properties:
 *                         paid:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      siteId,
    } = billingHistoryQuerySchema.parse(req.query);

    // Validate pagination params
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(100, Math.max(1, limit));
    const offset = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = { userId: req.user!.id };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (siteId) {
      // Verify user owns the site
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: req.user!.id },
      });

      if (!site) {
        throw new AppError(404, 'Site not found');
      }

      where.siteId = siteId;
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.billingTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNumber,
        include: {
          _count: true,
        },
      }),
      prisma.billingTransaction.count({ where }),
    ]);

    // Get site information for transactions
    const siteIds = [...new Set(transactions.map(t => t.siteId))];
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, siteName: true, siteUrl: true },
    });

    const sitesMap = sites.reduce((acc, site) => {
      acc[site.id] = site;
      return acc;
    }, {} as Record<string, any>);

    // Calculate summary statistics
    const allTransactions = await prisma.billingTransaction.findMany({
      where: { userId: req.user!.id },
      select: { amount: true, status: true },
    });

    const summary = {
      totalAmount: allTransactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0),
      totalTransactions: allTransactions.length,
      statusCounts: {
        paid: allTransactions.filter(t => t.status === 'paid').length,
        pending: allTransactions.filter(t => t.status === 'pending').length,
        failed: allTransactions.filter(t => t.status === 'failed').length,
      },
    };

    res.json({
      transactions: transactions.map(transaction => ({
        ...transaction,
        site: sitesMap[transaction.siteId],
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNumber),
      },
      summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/summary:
 *   get:
 *     summary: Get billing summary
 *     description: Get a summary of the user's billing information and spending
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPeriod:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       description: Total spent this month
 *                     transactionCount:
 *                       type: integer
 *                       description: Number of transactions this month
 *                 allTime:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       description: Total spent all time
 *                     transactionCount:
 *                       type: integer
 *                       description: Total number of transactions
 *                 activeSubscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       planType:
 *                         type: string
 *                       status:
 *                         type: string
 *                       currentPeriodEnd:
 *                         type: string
 *                         format: date-time
 *                       site:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           siteName:
 *                             type: string
 *                           siteUrl:
 *                             type: string
 *                 upcomingCharges:
 *                   type: array
 *                   description: Upcoming subscription renewals
 *                   items:
 *                     type: object
 *                     properties:
 *                       subscriptionId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                         format: float
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       siteName:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current month transactions
    const currentMonthTransactions = await prisma.billingTransaction.findMany({
      where: {
        userId: req.user!.id,
        status: 'paid',
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    });

    // Get all-time transactions
    const allTimeTransactions = await prisma.billingTransaction.findMany({
      where: {
        userId: req.user!.id,
        status: 'paid',
      },
      select: { amount: true },
    });

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.user!.id,
        status: { in: ['TRIAL', 'ACTIVE'] },
      },
      include: {
        site: {
          select: { id: true, siteName: true, siteUrl: true },
        },
      },
    });

    // Calculate upcoming charges (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingCharges = activeSubscriptions
      .filter(sub => sub.currentPeriodEnd <= thirtyDaysFromNow)
      .map(sub => ({
        subscriptionId: sub.id,
        amount: sub.planType === 'PREMIUM_MONTHLY' ? 49.99 : 499.99, // From pricing in analysis
        dueDate: sub.currentPeriodEnd,
        siteName: sub.site.siteName,
      }));

    const summary = {
      currentPeriod: {
        totalAmount: currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0),
        transactionCount: currentMonthTransactions.length,
      },
      allTime: {
        totalAmount: allTimeTransactions.reduce((sum, t) => sum + t.amount, 0),
        transactionCount: allTimeTransactions.length,
      },
      activeSubscriptions: activeSubscriptions.map(sub => ({
        id: sub.id,
        planType: sub.planType,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        site: sub.site,
      })),
      upcomingCharges,
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/transactions/{transactionId}:
 *   get:
 *     summary: Get transaction details
 *     description: Get detailed information about a specific billing transaction
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     invoiceId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       format: float
 *                     currency:
 *                       type: string
 *                     status:
 *                       type: string
 *                     stripeInvoiceId:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     site:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         siteName:
 *                           type: string
 *                         siteUrl:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/transactions/:transactionId', authenticate, async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.billingTransaction.findFirst({
      where: {
        id: transactionId,
        userId: req.user!.id,
      },
    });

    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }

    // Get site information
    const site = await prisma.site.findUnique({
      where: { id: transaction.siteId },
      select: { id: true, siteName: true, siteUrl: true },
    });

    res.json({
      transaction: {
        ...transaction,
        site,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;