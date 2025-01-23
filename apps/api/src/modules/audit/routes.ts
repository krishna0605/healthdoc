import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { getUserFromToken } from '../../lib/supabase.js'
import { getActionDescription } from '../../lib/auditService.js'

export async function auditRoutes(fastify: FastifyInstance) {
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

  // Get user's activity log
  fastify.get('/', async (request: any, reply) => {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number }

    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId: request.user.id },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset)
        }),
        prisma.auditLog.count({
          where: { userId: request.user.id }
        })
      ])

      // Enrich with descriptions
      const enrichedLogs = logs.map(log => ({
        ...log,
        description: getActionDescription(log.action)
      }))

      return { data: { logs: enrichedLogs, total } }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })
}
