import { Response, NextFunction } from 'express';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { AuthenticatedRequest } from '../types';

/**
 * Tenant resolution middleware.
 *
 * For authenticated requests, resolves the tenant from the JWT payload
 * and verifies it is active. Attaches tenant context to req.tenantId.
 *
 * super_admin users may override the active tenant by passing the
 * X-Tenant-ID header — this enables cross-tenant administration.
 *
 * Routes that operate without a tenant (e.g. /tenants, /admin) should
 * NOT use this middleware.
 */
export const resolveTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let tenantId = req.user.tenantId;

    // super_admin may override via header
    if (req.user.role === 'super_admin') {
      const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
      if (headerTenantId) {
        tenantId = headerTenantId;
        logger.debug('super_admin tenant override', {
          userId: req.user.userId,
          targetTenantId: tenantId,
        });
      }

      // super_admin without a tenantId and without override — allow through (global scope)
      if (!tenantId) {
        next();
        return;
      }
    }

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'No tenant context available for this request' });
      return;
    }

    // Validate tenant exists and is active
    const result = await db.query<{ id: string; is_active: boolean; name: string }>(
      `SELECT id, is_active, name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }

    const tenant = result.rows[0];
    if (!tenant.is_active) {
      res.status(403).json({
        success: false,
        error: `Tenant '${tenant.name}' is inactive — please contact your administrator`,
      });
      return;
    }

    req.tenantId = tenantId;
    next();
  } catch (error) {
    logger.error('Tenant resolution error', { error: (error as Error).message });
    next(error);
  }
};
