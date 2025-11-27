import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { WinstonLogger } from '../utils/logger';
import { AuditLogService } from '../services/auditlog.service';

// RBAC roles
export enum UserRole {
  ADMIN = 'admin',
  COMPLIANCE = 'compliance',
  STAKEHOLDER = 'stakeholder',
  DEVELOPER = 'developer',
  TESTER = 'tester',
  VIEWER = 'viewer',
}

// Permissions mapping (example, can be extended)
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.COMPLIANCE]: ['view', 'export', 'audit'],
  [UserRole.STAKEHOLDER]: ['view', 'report'],
  [UserRole.DEVELOPER]: ['view', 'link', 'report'],
  [UserRole.TESTER]: ['view', 'report', 'flag'],
  [UserRole.VIEWER]: ['view'],
};

// Logger and audit log service
const logger = WinstonLogger.getInstance();
const auditLogService = new AuditLogService();

/**
 * Middleware to ensure user is authenticated via Passport.js.
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  logger.warn('Unauthorized access attempt', { ip: req.ip, url: req.originalUrl });
  auditLogService.logUnauthorizedAccess(req.ip, req.originalUrl);
  return res.status(401).json({ error: 'Unauthorized' });
}

/**
 * Middleware to enforce role-based access control.
 * @param requiredPermissions Array of required permissions for the route
 */
export function authorize(requiredPermissions: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User object should be attached by Passport.js
      const user = req.user as { username: string; role: UserRole } | undefined;
      if (!user) {
        logger.warn('Access denied: No user in request', { ip: req.ip, url: req.originalUrl });
        auditLogService.logUnauthorizedAccess(req.ip, req.originalUrl);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const permissions = rolePermissions[user.role] || [];
      // Admins have all permissions
      if (permissions.includes('*')) {
        return next();
      }

      // Check if user has all required permissions
      const hasPermission = requiredPermissions.every((perm) => permissions.includes(perm));
      if (!hasPermission) {
        logger.warn('Access denied: Insufficient permissions', {
          user: user.username,
          role: user.role,
          required: requiredPermissions,
        });
        await auditLogService.logUnauthorizedAccess(req.ip, req.originalUrl, user.username, user.role);
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      return next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Combined middleware for authentication and RBAC.
 * Usage: app.use('/protected-route', authMiddleware)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  ensureAuthenticated(req, res, () => {
    // By default, allow all authenticated users (can be extended per route)
    next();
  });
}

export default authMiddleware;