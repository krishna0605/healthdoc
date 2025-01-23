import { prisma } from './prisma.js'
import type { FastifyRequest } from 'fastify'

// Audit action types
export const AuditActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // 2FA
  TWO_FA_ENABLED: 'TWO_FA_ENABLED',
  TWO_FA_DISABLED: 'TWO_FA_DISABLED',
  TWO_FA_VERIFIED: 'TWO_FA_VERIFIED',
  
  // Reports
  REPORT_UPLOAD: 'REPORT_UPLOAD',
  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_DELETE: 'REPORT_DELETE',
  REPORT_SHARE: 'REPORT_SHARE',
  REPORT_DOWNLOAD: 'REPORT_DOWNLOAD',
  
  // Family
  FAMILY_MEMBER_ADD: 'FAMILY_MEMBER_ADD',
  FAMILY_MEMBER_UPDATE: 'FAMILY_MEMBER_UPDATE',
  FAMILY_MEMBER_DELETE: 'FAMILY_MEMBER_DELETE',
  
  // Settings
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  NOTIFICATION_PREFS_UPDATE: 'NOTIFICATION_PREFS_UPDATE',
} as const

export type AuditAction = typeof AuditActions[keyof typeof AuditActions]

interface LogAuditParams {
  userId: string
  action: AuditAction
  resource?: string
  resourceId?: string
  metadata?: Record<string, any>
  request?: FastifyRequest
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resource || 'system',
        resourceId: params.resourceId,
        metadata: params.metadata,
        ipAddress: params.request?.ip || null,
        userAgent: params.request?.headers?.['user-agent'] || null
      }
    })
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('[Audit] Failed to log event:', error)
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

/**
 * Get human-readable description of audit action
 */
export function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    LOGIN_FAILED: 'Failed login attempt',
    TWO_FA_ENABLED: 'Enabled two-factor authentication',
    TWO_FA_DISABLED: 'Disabled two-factor authentication',
    TWO_FA_VERIFIED: 'Verified two-factor code',
    REPORT_UPLOAD: 'Uploaded a report',
    REPORT_VIEW: 'Viewed a report',
    REPORT_DELETE: 'Deleted a report',
    REPORT_SHARE: 'Shared a report',
    REPORT_DOWNLOAD: 'Downloaded a report',
    FAMILY_MEMBER_ADD: 'Added a family member',
    FAMILY_MEMBER_UPDATE: 'Updated family member',
    FAMILY_MEMBER_DELETE: 'Removed a family member',
    SETTINGS_UPDATE: 'Updated settings',
    NOTIFICATION_PREFS_UPDATE: 'Updated notification preferences'
  }
  return descriptions[action] || action
}
