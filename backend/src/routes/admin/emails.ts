/**
 * Admin Email Routes
 * Routes for viewing email logs and managing email operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { emailService } from '../../services/email/EmailService';
import { prisma } from '../../lib/prisma';
import { EmailType, EmailStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/v1/admin/emails
 * Get paginated list of email logs
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '50',
      type,
      status,
      userId,
      email,
      startDate,
      endDate,
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (type && Object.values(EmailType).includes(type as EmailType)) {
      where.type = type;
    }

    if (status && Object.values(EmailStatus).includes(status as EmailStatus)) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (email) {
      where.email = { contains: email as string, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' },
        take: limitNum,
        skip: offset,
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
      prisma.emailLog.count({ where }),
    ]);

    res.json({
      data: {
        logs: logs.map((log) => ({
          id: log.id,
          email: log.email,
          type: log.type,
          subject: log.subject,
          status: log.status,
          provider: log.provider,
          messageId: log.messageId,
          errorMessage: log.errorMessage,
          attempts: log.attempts,
          lastAttemptAt: log.lastAttemptAt?.toISOString() || null,
          sentAt: log.sentAt?.toISOString() || null,
          createdAt: log.createdAt.toISOString(),
          user: log.user ? {
            id: log.user.id,
            email: log.user.email,
            fullName: log.user.fullName,
          } : null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/emails/stats
 * Get email statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalEmails,
      sentCount,
      failedCount,
      pendingCount,
      byType,
      recentActivity,
    ] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: EmailStatus.SENT } }),
      prisma.emailLog.count({ where: { status: EmailStatus.FAILED } }),
      prisma.emailLog.count({ where: { status: { in: [EmailStatus.PENDING, EmailStatus.QUEUED] } } }),
      prisma.emailLog.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.emailLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Calculate daily counts for the last 7 days
    const dailyCounts: Record<string, { sent: number; failed: number }> = {};
    recentActivity.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!dailyCounts[date]) {
        dailyCounts[date] = { sent: 0, failed: 0 };
      }
      if (log.status === EmailStatus.SENT) {
        dailyCounts[date].sent++;
      } else if (log.status === EmailStatus.FAILED) {
        dailyCounts[date].failed++;
      }
    });

    res.json({
      data: {
        total: totalEmails,
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        successRate: totalEmails > 0 ? ((sentCount / totalEmails) * 100).toFixed(1) : '0',
        byType: byType.map((t) => ({
          type: t.type,
          count: t._count.type,
        })),
        dailyActivity: Object.entries(dailyCounts).map(([date, counts]) => ({
          date,
          ...counts,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/emails/:id
 * Get a specific email log with full details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const log = await prisma.emailLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Email log not found' });
    }

    res.json({
      data: {
        id: log.id,
        email: log.email,
        type: log.type,
        subject: log.subject,
        status: log.status,
        provider: log.provider,
        messageId: log.messageId,
        templateData: log.templateData,
        errorMessage: log.errorMessage,
        attempts: log.attempts,
        lastAttemptAt: log.lastAttemptAt?.toISOString() || null,
        sentAt: log.sentAt?.toISOString() || null,
        createdAt: log.createdAt.toISOString(),
        user: log.user ? {
          id: log.user.id,
          email: log.user.email,
          fullName: log.user.fullName,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/emails/:id/retry
 * Retry a failed email
 */
router.post('/:id/retry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const success = await emailService.retryEmail(id);

    if (success) {
      logger.info(`Admin retried email ${id}`);
      res.json({ data: { success: true, message: 'Email retry queued successfully' } });
    } else {
      res.status(400).json({ error: 'Failed to retry email' });
    }
  } catch (error: any) {
    if (error.message === 'Email log not found') {
      return res.status(404).json({ error: 'Email log not found' });
    }
    if (error.message === 'Can only retry failed emails') {
      return res.status(400).json({ error: 'Can only retry failed emails' });
    }
    next(error);
  }
});

/**
 * POST /api/v1/admin/emails/test
 * Send a test email to verify email configuration
 */
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Send a simple test email
    const result = await emailService.sendRawEmail({
      to: email,
      subject: 'Test Email from IntelligentConvo',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from IntelligentConvo to verify your email configuration.</p>
          <p>If you received this email, your email service is working correctly!</p>
          <p style="color: #666; margin-top: 20px; font-size: 12px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
      text: 'This is a test email from IntelligentConvo. If you received this, your email service is working correctly!',
    });

    if (result.success) {
      logger.info(`Test email sent to ${email}`);
      res.json({
        data: {
          success: true,
          message: 'Test email sent successfully',
          messageId: result.messageId,
        },
      });
    } else {
      res.status(400).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/emails/provider/status
 * Get current email provider status
 */
router.get('/provider/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = emailService.getProvider();

    if (!provider) {
      return res.json({
        data: {
          initialized: false,
          provider: null,
        },
      });
    }

    const isValid = await provider.verify();

    res.json({
      data: {
        initialized: true,
        provider: provider.name,
        isValid,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
