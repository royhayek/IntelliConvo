/**
 * Admin Billing Routes
 * Route handlers for admin billing and transaction management
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminBillingService } from '../../services/admin';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/billing/transactions:
 *   get:
 *     summary: Get paginated list of transactions
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      userId,
      siteId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminBillingService.getTransactions({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      userId: userId as string | undefined,
      siteId: siteId as string | undefined,
      status: status as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      sortBy: sortBy as 'createdAt' | 'amount',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/transactions/export:
 *   get:
 *     summary: Export transactions
 *     description: Export transactions as CSV or JSON
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/transactions/export',
  asyncHandler(async (req, res) => {
    const { format = 'json', userId, siteId, status, dateFrom, dateTo } = req.query;

    const result = await adminBillingService.exportTransactions(
      format as 'csv' | 'json',
      {
        userId: userId as string | undefined,
        siteId: siteId as string | undefined,
        status: status as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      }
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } else {
      res.json({ data: result });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/transactions/{transactionId}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/transactions/:transactionId',
  asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const transaction = await adminBillingService.getTransactionById(transactionId);
    res.json({ data: transaction });
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/transactions/{transactionId}/status:
 *   patch:
 *     summary: Update transaction status
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/transactions/:transactionId/status',
  asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const transaction = await adminBillingService.updateTransactionStatus(transactionId, status);
    res.json({ data: transaction });
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/transactions:
 *   post:
 *     summary: Create manual transaction
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/transactions',
  asyncHandler(async (req, res) => {
    const { userId, siteId, amount, currency, status } = req.body;

    if (!userId || !siteId || amount === undefined || !status) {
      return res.status(400).json({ error: 'userId, siteId, amount, and status are required' });
    }

    const transaction = await adminBillingService.createManualTransaction({
      userId,
      siteId,
      amount,
      currency,
      status,
    });

    res.json({ data: transaction });
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/transactions/{transactionId}:
 *   delete:
 *     summary: Delete transaction
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/transactions/:transactionId',
  asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    const result = await adminBillingService.deleteTransaction(transactionId);
    res.json(result);
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/info:
 *   get:
 *     summary: Get paginated list of billing info records
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/info',
  asyncHandler(async (req, res) => {
    const {
      page = '1',
      limit = '20',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminBillingService.getBillingInfoList({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string | undefined,
      sortBy: sortBy as 'createdAt' | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ data: result });
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/info/{billingInfoId}:
 *   get:
 *     summary: Get billing info by ID
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/info/:billingInfoId',
  asyncHandler(async (req, res) => {
    const { billingInfoId } = req.params;
    const billingInfo = await adminBillingService.getBillingInfoById(billingInfoId);
    res.json({ data: billingInfo });
  })
);

/**
 * @swagger
 * /api/v1/admin/billing/stats:
 *   get:
 *     summary: Get billing statistics
 *     tags: [Admin - Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await adminBillingService.getBillingStats();
    res.json({ data: stats });
  })
);

export default router;
