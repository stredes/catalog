import * as SecureStore from 'expo-secure-store';

export type AuditAction = 
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'data_created'
  | 'data_updated'
  | 'data_deleted'
  | 'backup_created'
  | 'backup_restored'
  | 'permission_changed'
  | 'suspicious_activity';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  userId: string;
  resource?: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

const AUDIT_LOG_KEY = 'catalog_audit_log';
const MAX_LOG_ENTRIES = 1000;

export class AuditService {
  private static instance: AuditService;
  private logs: AuditLogEntry[] = [];

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadLogs();
  }

  private async loadLogs(): Promise<void> {
    const logsData = await SecureStore.getItemAsync(AUDIT_LOG_KEY);
    if (logsData) {
      this.logs = JSON.parse(logsData);
    }
  }

  private async saveLogs(): Promise<void> {
    // Keep only the most recent entries
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
    }
    await SecureStore.setItemAsync(AUDIT_LOG_KEY, JSON.stringify(this.logs));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async log(
    action: AuditAction,
    userId: string,
    resource?: string,
    resourceId?: string,
    details?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      action,
      userId,
      resource,
      resourceId,
      details,
    };

    this.logs.push(entry);
    await this.saveLogs();
  }

  async logSuspiciousActivity(
    userId: string,
    details: string
  ): Promise<void> {
    await this.log('suspicious_activity', userId, undefined, undefined, details);
  }

  async getLogsByUser(userId: string): Promise<AuditLogEntry[]> {
    return this.logs.filter(log => log.userId === userId);
  }

  async getLogsByAction(action: AuditAction): Promise<AuditLogEntry[]> {
    return this.logs.filter(log => log.action === action);
  }

  async getLogsByResource(resource: string): Promise<AuditLogEntry[]> {
    return this.logs.filter(log => log.resource === resource);
  }

  async getRecentLogs(hours: number = 24): Promise<AuditLogEntry[]> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.logs.filter(log => log.timestamp > cutoff);
  }

  async getSuspiciousActivity(): Promise<AuditLogEntry[]> {
    return this.getLogsByAction('suspicious_activity');
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    await this.saveLogs();
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }

  async getStatistics(): Promise<{
    totalLogs: number;
    loginsToday: number;
    failedLogins: number;
    suspiciousActivities: number;
    mostActiveUser: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const logsToday = this.logs.filter(log => log.timestamp > todayTimestamp);
    const loginsToday = logsToday.filter(
      log => log.action === 'login_success'
    ).length;
    const failedLogins = logsToday.filter(
      log => log.action === 'login_failed'
    ).length;
    const suspiciousActivities = logsToday.filter(
      log => log.action === 'suspicious_activity'
    ).length;

    // Count logs per user
    const userCounts: Record<string, number> = {};
    logsToday.forEach(log => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });

    const mostActiveUser = Object.entries(userCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || 'none';

    return {
      totalLogs: this.logs.length,
      loginsToday,
      failedLogins,
      suspiciousActivities,
      mostActiveUser,
    };
  }
}

export const audit = AuditService.getInstance();
