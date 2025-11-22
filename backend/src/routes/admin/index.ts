/**
 * Admin Routes Index
 * Aggregates all admin routes and applies admin authentication middleware
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { auditAdminAction } from '../../middleware/adminAudit';
import statsRoutes from './stats';
import usersRoutes from './users';
import sitesRoutes from './sites';
import urlsRoutes from './urls';
import embeddingsRoutes from './embeddings';
import filesRoutes from './files';
import conversationsRoutes from './conversations';
import messagesRoutes from './messages';
import subscriptionsRoutes from './subscriptions';
import billingRoutes from './billing';
import widgetsRoutes from './widgets';
import sessionsRoutes from './sessions';
import auditRoutes from './audit';

const router = Router();

// Apply authentication and admin authorization to all admin routes
router.use(authenticate);
router.use(requireAdmin);
router.use(auditAdminAction);

// Mount admin sub-routes
router.use('/stats', statsRoutes);
router.use('/users', usersRoutes);
router.use('/sites', sitesRoutes);
router.use('/urls', urlsRoutes);
router.use('/embeddings', embeddingsRoutes);
router.use('/files', filesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/messages', messagesRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/billing', billingRoutes);
router.use('/widgets', widgetsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/audit', auditRoutes);

export default router;
