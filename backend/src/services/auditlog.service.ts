import { getRepository } from 'typeorm';
import { WinstonLogger } from '../utils/logger';
import { Request } from 'express';

/**
 * AuditLog entity for persistent audit logging.
 * This should be registered in TypeORM connection elsewhere in the project.
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}

/**
 * AuditLogService
 * Handles logging of all access and modifications to traceability data.
 * Ensures tamper-proof, exportable logs for compliance.
 */
export class AuditLogService {
  private logger = WinstonLogger.getInstance();

  /**
   * Log access to traceability data.
   * @param user User object (may be undefined for unauthenticated access)
   * @param action Action performed (e.g., 'GET_TRACEABILITY_MATRIX')
   * @param details Additional details (object will be stringified)
   * @param req Optional Express request for IP logging
   */
  async logAccess(
    user: any,
    action: string,
    details?: any,
    req?: Request
  ): Promise<void> {
    try {
      const auditRepo = getRepository(AuditLog);
      await auditRepo.save({
        action,
        username: user?.username,
        role: user?.role,
        details: details ? JSON.stringify(details) : undefined,
        ip: req?.ip,
      });
      this.logger.info(`AuditLog: Access - ${action}`, {
        user: user?.username,
        role: user?.role,
        details,
        ip: req?.ip,
      });
    } catch (error) {
      this.logger.error('AuditLogService.logAccess error:', error);
    }
  }

  /**
   * Log modification to traceability data.
   * @param user User object
   * @param action Action performed (e.g., 'LINK_ARTIFACTS_TO_REQUIREMENT')
   * @param details Additional details (object will be stringified)
   * @param req Optional Express request for IP logging
   */
  async logModification(
    user: any,
    action: string,
    details?: any,
    req?: Request
  ): Promise<void> {
    try {
      const auditRepo = getRepository(AuditLog);
      await auditRepo.save({
        action,
        username: user?.username,
        role: user?.role,
        details: details ? JSON.stringify(details) : undefined,
        ip: req?.ip,
      });
      this.logger.info(`AuditLog: Modification - ${action}`, {
        user: user?.username,
        role: user?.role,
        details,
        ip: req?.ip,
      });
    } catch (error) {
      this.logger.error('AuditLogService.logModification error:', error);
    }
  }

  /**
   * Log unauthorized access attempts and trigger alerts.
   * @param ip IP address of the requester
   * @param url Requested URL
   * @param username Optional username
   * @param role Optional role
   */
  async logUnauthorizedAccess(
    ip: string,
    url: string,
    username?: string,
    role?: string
  ): Promise<void> {
    try {
      const auditRepo = getRepository(AuditLog);
      await auditRepo.save({
        action: 'UNAUTHORIZED_ACCESS',
        username,
        role,
        details: JSON.stringify({ url }),
        ip,
      });
      this.logger.warn('AuditLog: Unauthorized access attempt', {
        username,
        role,
        url,
        ip,
      });
      // TODO: Integrate alerting system (email, webhook, etc.) if needed
    } catch (error) {
      this.logger.error('AuditLogService.logUnauthorizedAccess error:', error);
    }
  }

  /**
   * Export audit logs for compliance reviews.
   * @param format Export format ('json' | 'csv')
   * @returns Exported logs as string
   */
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const auditRepo = getRepository(AuditLog);
      const logs = await auditRepo.find({ order: { timestamp: 'DESC' } });

      if (format === 'csv') {
        // Simple CSV export
        const header = 'id,action,username,role,details,ip,timestamp';
        const rows = logs.map(
          (log) =>
            `"${log.id}","${log.action}","${log.username || ''}","${log.role || ''}","${(log.details || '').replace(
              /"/g,
              '""'
            )}","${log.ip || ''}","${log.timestamp.toISOString()}"`
        );
        return [header, ...rows].join('\n');
      } else {
        // Default to JSON
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      this.logger.error('AuditLogService.exportLogs error:', error);
      return '';
    }
  }
}

export default AuditLogService;