import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import {
  UnauthorizedError,
  TokenExpiredError,
  InvalidTokenError,
  NotFoundError,
  ForbiddenError,
} from './errors';
import { getConfig } from '../config';
import { tokenBlacklist } from '../services/tokenBlacklist';

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user from authentication
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      fullName?: string | null;
      isAdmin?: boolean;
    };
  }
}

/**
 * Authentication middleware
 * Requires a valid JWT token in the Authorization header
 * Throws UnauthorizedError if token is missing or invalid
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    // Get configuration
    const config = getConfig();

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError();
      }
      throw new InvalidTokenError('Token verification failed');
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', decoded.userId);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't throw errors if token is missing/invalid
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Get configuration
    const config = getConfig();

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch {
      // Ignore errors for optional auth
      return next();
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }

    next();
  } catch {
    // Ignore all errors for optional auth
    next();
  }
};

/**
 * Generate JWT access and refresh tokens
 */
export const generateTokens = (
  userId: string,
  email: string
): { accessToken: string; refreshToken: string } => {
  const config = getConfig();

  const accessToken = jwt.sign(
    { userId, email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { userId, email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify a JWT token without requiring full authentication
 * Useful for validating refresh tokens
 */
export const verifyToken = (token: string): JWTPayload => {
  const config = getConfig();

  try {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new InvalidTokenError();
    }
    throw new InvalidTokenError('Token verification failed');
  }
};

/**
 * Admin authorization middleware
 * Requires the user to be authenticated AND have admin privileges
 * Must be used after the authenticate middleware
 */
export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};