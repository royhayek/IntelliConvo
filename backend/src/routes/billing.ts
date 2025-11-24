/**
 * Billing Routes
 * Route handlers using service layer and asyncHandler
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateQuery, validateParams } from '../middleware/validate';
import { billingService } from '../services/billing/BillingService';
import { subscriptionService } from '../services';
import { billingHistoryQuerySchema, billingSummaryQuerySchema, transactionParamsSchema } from '../schemas';

const router = Router();

/**
 * @swagger
 * /api/v1/billing/history:
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/history',
  authenticate,
  validateQuery(billingHistoryQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const history = await billingService.getHistory(req.user!.id, req.query);
    res.json(history);
  })
);

/**
 * @swagger
 * /api/v1/billing/summary:
 *   get:
 *     summary: Get billing summary
 *     description: Get a summary of the user's billing information and spending
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing summary retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/summary',
  authenticate,
  validateQuery(billingSummaryQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.query.siteId as string | undefined;
    const summary = await billingService.getSummary(req.user!.id, siteId);
    res.json(summary);
  })
);

/**
 * @swagger
 * /api/v1/billing/transactions/{transactionId}:
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/transactions/:transactionId',
  authenticate,
  validateParams(transactionParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const details = await billingService.getTransactionDetails(
      req.params.transactionId,
      req.user!.id
    );
    res.json(details);
  })
);

/**
 * @swagger
 * /api/v1/billing/plans:
 *   get:
 *     summary: Get available plans
 *     description: Fetches subscription plans from Stripe (cached for 1 hour)
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/plans',
  asyncHandler(async (req: Request, res: Response) => {
    const plans = await subscriptionService.getAvailablePlans();
    res.json(plans);
  })
);

/**
 * @swagger
 * /api/v1/billing/receipts/{transactionId}:
 *   get:
 *     summary: Get receipt URL
 *     description: Get the Stripe hosted receipt URL for a transaction
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
 *         description: Receipt URL retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/receipts/:transactionId',
  authenticate,
  validateParams(transactionParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await billingService.getReceiptUrl(
      req.params.transactionId,
      req.user!.id
    );
    res.json(result);
  })
);

export default router;
