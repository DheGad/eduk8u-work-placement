import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

// ============================================================
// Permission matrix
// ============================================================

/**
 * Maps each named permission to the roles that hold it.
 * Roles are checked inclusively — a user with a higher role
 * (e.g. super_admin) must explicitly appear in each permission's list.
 */
const permissions: Record<string, UserRole[]> = {
  'tenants:read':  ['super_admin'],
  'tenants:write': ['super_admin'],

  'users:read':  ['super_admin', 'college_admin'],
  'users:write': ['super_admin', 'college_admin'],

  'students:read':  ['super_admin', 'college_admin', 'trainer', 'student', 'auditor'],
  'students:write': ['super_admin', 'college_admin', 'trainer'],

  'hosts:read':  ['super_admin', 'college_admin', 'trainer', 'host_manager', 'auditor'],
  'hosts:write': ['super_admin', 'college_admin', 'trainer'],

  'supervisors:read':  ['super_admin', 'college_admin', 'trainer', 'supervisor', 'auditor'],
  'supervisors:write': ['super_admin', 'college_admin', 'trainer'],

  'placements:read':  ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'host_manager', 'auditor'],
  'placements:write': ['super_admin', 'college_admin', 'trainer'],

  'hours:read':          ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'auditor'],
  'hours:write:student': ['student'],
  'hours:verify':        ['supervisor'],

  'documents:read':   ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'host_manager', 'auditor'],
  'documents:upload': ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'host_manager'],

  'compliance:read':  ['super_admin', 'college_admin', 'trainer', 'auditor'],

  'reports:read':   ['super_admin', 'college_admin', 'trainer', 'auditor'],
  'reports:export': ['super_admin', 'college_admin', 'trainer', 'auditor'],

  'admin:dashboard': ['super_admin', 'college_admin'],

  'audit:read': ['super_admin', 'college_admin', 'auditor'],

  'notifications:read': ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'host_manager', 'auditor'],

  'journal:read':  ['super_admin', 'college_admin', 'trainer', 'student', 'auditor'],
  'journal:write': ['student'],
  'journal:review': ['super_admin', 'college_admin', 'trainer'],

  'evidence:read':  ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'auditor'],
  'evidence:write': ['super_admin', 'college_admin', 'trainer', 'supervisor'],
};

// ============================================================
// Middleware factories
// ============================================================

/**
 * Require the authenticated user to hold a specific named permission.
 * Responds 403 if the user's role is not in the permission list.
 *
 * @param permission - A key from the permissions matrix above
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const allowedRoles = permissions[permission];
    if (!allowedRoles) {
      res.status(403).json({ success: false, error: `Unknown permission: ${permission}` });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Insufficient permissions — '${permission}' requires one of: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Require the authenticated user to hold at least one of the specified roles.
 * Responds 403 if no role matches.
 *
 * @param roles - One or more UserRole values
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied — requires one of: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

// ============================================================
// Convenience composites
// ============================================================

/** Allow only super_admin */
export const requireSuperAdmin = requireRole('super_admin');

/** Allow super_admin or college_admin */
export const requireCollegeAdmin = requireRole('super_admin', 'college_admin');

/** Allow super_admin, college_admin, or trainer */
export const requireTrainer = requireRole('super_admin', 'college_admin', 'trainer');

/** Allow any authenticated user with a student role */
export const requireStudent = requireRole('student');

/** Allow supervisor, college_admin, trainer, or super_admin */
export const requireSupervisor = requireRole('super_admin', 'college_admin', 'trainer', 'supervisor');

/**
 * Enforce that a student can only access their own resources.
 * Checks req.params.studentId === req.user.userId (unless super_admin/college_admin/trainer/auditor).
 */
export const requireOwnerOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const privilegedRoles: UserRole[] = ['super_admin', 'college_admin', 'trainer', 'auditor'];
  if (privilegedRoles.includes(req.user.role)) {
    next();
    return;
  }

  const targetId = req.params['studentId'] ?? req.params['userId'];
  if (targetId && targetId !== req.user.userId) {
    res.status(403).json({ success: false, error: 'Access denied — you may only access your own records' });
    return;
  }

  next();
};
