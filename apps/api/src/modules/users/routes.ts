
import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { getUserFromToken } from '../../lib/supabase.js'
import { logAuditEvent, AuditActions } from '../../lib/auditService.js'

export async function userRoutes(fastify: FastifyInstance) {
  // Auth Middleware
  fastify.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      reply.code(401).send({ error: 'Missing Authorization header' })
      return
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      reply.code(401).send({ error: 'Invalid token' })
      return
    }
    request.user = user
  })



  // Ensure Profile Exists (Guardrail)
  fastify.post('/ensure-profile', async (request, reply) => {
    try {
      const profile = await prisma.profile.upsert({
        where: { userId: request.user.id },
        update: {},
        create: {
          userId: request.user.id,
          planTier: 'BASIC',
          monthlyUploadCount: 0
        }
      });
      return { data: profile };
    } catch (error: any) {
      reply.code(500).send({ error: error.message });
    }
  });

  // Get Preferences
  fastify.get('/preferences', async (request: any, reply) => {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: request.user.id }
      })

      // Return defaults if not set
      if (!prefs) {
        return {
          data: {
            emailOnComplete: true,
            emailOnAbnormal: true,
            weeklyDigest: false
          }
        }
      }

      return { data: prefs }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Update Preferences
  fastify.put('/preferences', async (request: any, reply) => {
    const { emailOnComplete, emailOnAbnormal, weeklyDigest } = request.body

    try {
      const prefs = await prisma.notificationPreference.upsert({
        where: { userId: request.user.id },
        update: {
          emailOnComplete,
          emailOnAbnormal,
          weeklyDigest
        },
        create: {
          userId: request.user.id,
          emailOnComplete: emailOnComplete ?? true,
          emailOnAbnormal: emailOnAbnormal ?? true,
          weeklyDigest: weeklyDigest ?? false
        }
      })

      // Log Audit Event
      await logAuditEvent({
        userId: request.user.id,
        action: AuditActions.NOTIFICATION_PREFS_UPDATE,
        resource: 'preferences',
        request
      })

      return { data: prefs }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // ============ NOTIFICATIONS ============

  // Get Notifications
  fastify.get('/notifications', async (request: any, reply) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: request.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20 // Last 20 notifications
      })

      const unreadCount = await prisma.notification.count({
        where: { userId: request.user.id, isRead: false }
      })

      return { data: { notifications, unreadCount } }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Mark Notification as Read
  fastify.put('/notifications/:id/read', async (request: any, reply) => {
    const { id } = request.params

    try {
      await prisma.notification.updateMany({
        where: { id, userId: request.user.id },
        data: { isRead: true }
      })

      return { success: true }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Mark All as Read
  fastify.put('/notifications/read-all', async (request: any, reply) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: request.user.id, isRead: false },
        data: { isRead: true }
      })

      return { success: true }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })
}
