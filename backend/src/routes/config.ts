/**
 * Public Configuration Routes
 * Exposes public configuration settings to the frontend
 */

import { Router, Request, Response } from 'express';
import { settings } from '../lib/settings';
import { successResponse } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /api/v1/config/public:
 *   get:
 *     summary: Get public configuration
 *     description: Returns public configuration settings for the frontend
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Public configuration
 */
router.get('/public', async (req: Request, res: Response) => {
  const [
    platformName,
    supportEmail,
    maintenanceMode,
    emailVerificationEnabled,
    enabledAuthProviders,
  ] = await Promise.all([
    settings.getPlatformName(),
    settings.getSupportEmail(),
    settings.isMaintenanceMode(),
    settings.isEmailVerificationEnabled(),
    settings.getEnabledAuthProviders(),
  ]);

  res.json(
    successResponse({
      platformName,
      supportEmail,
      maintenanceMode,
      requireEmailVerification: emailVerificationEnabled,
      enabledAuthProviders,
    })
  );
});

export default router;
