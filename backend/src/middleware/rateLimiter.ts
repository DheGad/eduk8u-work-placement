import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';

/** Shared rate limit response format */
const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: 'Too many requests — please slow down and try again later',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/**
 * General API rate limiter.
 * Applied globally: 100 requests per 15 minutes per IP.
 */
export const generalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => req.path === '/health',
});

/**
 * Strict rate limiter for authentication endpoints.
 * 10 requests per 15 minutes per IP — mitigates brute-force.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many authentication attempts — please wait 15 minutes before trying again',
});

/**
 * Rate limiter for file upload endpoints.
 * 20 uploads per hour per authenticated user (falls back to IP).
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.userId ?? req.ip ?? 'unknown';
  },
  handler: rateLimitHandler,
});

/**
 * Rate limiter for report/export endpoints.
 * 10 exports per hour per authenticated user — prevents resource abuse.
 */
export const reportExportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.userId ?? req.ip ?? 'unknown';
  },
  handler: rateLimitHandler,
});

/**
 * Strict limiter for password reset / forgot-password endpoints.
 * 5 requests per hour per IP.
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
