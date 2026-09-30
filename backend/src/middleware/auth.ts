import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload, AuthenticatedRequest } from '../types';

/**
 * Mandatory JWT authentication middleware.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it against JWT_SECRET, and attaches the decoded
 * payload to `req.user` and `req.tenantId`.
 *
 * Returns 401 if no valid token is present.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authentication required — no token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        res.status(401).json({ success: false, error: 'Token has expired — please refresh' });
      } else {
        res.status(401).json({ success: false, error: 'Invalid token' });
      }
      return;
    }

    req.user = decoded;
    req.tenantId = decoded.tenantId ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional JWT authentication middleware.
 *
 * Same as `authenticate` but does NOT return 401 when no token is present.
 * Useful for routes that behave differently for authenticated vs. anonymous users.
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      req.user = decoded;
      req.tenantId = decoded.tenantId ?? undefined;
    } catch {
      // Token is invalid or expired — proceed without auth context
    }

    next();
  } catch (error) {
    next(error);
  }
};
