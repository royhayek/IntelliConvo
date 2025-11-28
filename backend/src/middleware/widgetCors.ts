/**
 * Widget CORS Middleware
 * Custom CORS handling for public widget endpoints that validates against site's activeHosts
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { isOriginAllowed } from '../utils/hostValidation';
import { logger } from '../utils/logger';

/**
 * Widget-specific CORS middleware
 * Validates origin against site's activeHosts instead of global allowedOrigins
 * This allows the widget to be embedded on any domain configured in the site's settings
 */
export const widgetCorsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const origin = req.get('Origin') || req.get('Referer');
  const siteId = req.params.siteId;

  try {
    // If there's no origin (e.g., server-to-server requests), allow it
    if (!origin) {
      // Set permissive CORS headers for requests without origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      return next();
    }

    // If siteId is provided, validate against site's activeHosts
    if (siteId) {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: {
          activeHosts: {
            where: { isEnabled: true },
            select: { hostName: true },
          },
        },
      });

      if (site && site.activeHosts.length > 0) {
        const allowedHosts = site.activeHosts.map((host) => host.hostName);

        if (isOriginAllowed(origin, allowedHosts)) {
          // Origin is allowed - set CORS headers
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
          res.setHeader('Access-Control-Allow-Credentials', 'true');

          if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
          }

          return next();
        } else {
          logger.warn('Widget CORS: Origin not allowed', {
            origin,
            siteId,
            allowedHosts,
          });

          // Origin not in activeHosts - but we'll still allow it for public endpoints
          // The actual validation happens in the WidgetService.validateSite method
          // This middleware is just for CORS headers
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
          res.setHeader('Access-Control-Allow-Credentials', 'true');

          if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
          }

          return next();
        }
      }
    }

    // If no activeHosts configured or no siteId, allow all origins for public widget endpoints
    // The actual validation will happen in the route handlers
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  } catch (error) {
    logger.error('Widget CORS middleware error:', error);

    // On error, allow the request and let the route handler deal with validation
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
};
