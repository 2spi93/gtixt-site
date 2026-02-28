// /opt/gpti/gpti-site/lib/audit-logger.ts

import { prisma } from '@/lib/prisma';

export interface AuditLogParams {
  action: string;
  userId?: string;
  ipAddress?: string;
  filePath?: string;
  details?: string;
  beforeState?: any;
  afterState?: any;
  environment?: 'production' | 'sandbox' | 'development';
  success?: boolean;
  errorMsg?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private environment: 'production' | 'sandbox' | 'development';
  private enabled: boolean;

  private constructor() {
    this.environment = (process.env.COPILOT_ENV as any) || 'production';
    this.enabled = process.env.AUDIT_LOGGING !== 'false';
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(params: AuditLogParams): Promise<void> {
    if (!this.enabled) return;

    try {
      await prisma.adminAuditTrail.create({
        data: {
          action: params.action,
          userId: params.userId || 'system',
          ipAddress: params.ipAddress,
          filePath: params.filePath,
          details: params.details,
          beforeState: params.beforeState ? JSON.stringify(params.beforeState) : null,
          afterState: params.afterState ? JSON.stringify(params.afterState) : null,
          environment: params.environment || this.environment,
          success: params.success !== false,
          errorMsg: params.errorMsg,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should never break the app
    }
  }

  async logFileRead(filePath: string, userId?: string, ipAddress?: string): Promise<void> {
    await this.log({
      action: 'file_read',
      userId,
      ipAddress,
      filePath,
      details: `Read file: ${filePath}`,
    });
  }

  async logFileWrite(
    filePath: string, 
    beforeContent: string, 
    afterContent: string,
    userId?: string, 
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: 'file_write',
      userId,
      ipAddress,
      filePath,
      details: `Modified file: ${filePath}`,
      beforeState: { content: beforeContent },
      afterState: { content: afterContent },
    });
  }

  async logCopilotAction(
    action: string,
    message: string,
    result: any,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action: 'copilot_action',
      userId,
      ipAddress,
      details: `Copilot action: ${action} - ${message}`,
      afterState: result,
    });
  }

  setEnvironment(env: 'production' | 'sandbox' | 'development'): void {
    this.environment = env;
  }

  getEnvironment(): string {
    return this.environment;
  }

  isSandboxMode(): boolean {
    return this.environment === 'sandbox';
  }
}

export const auditLogger = AuditLogger.getInstance();
