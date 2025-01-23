import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { getUserFromToken } from '../../lib/supabase.js'

export async function familyRoutes(fastify: FastifyInstance) {
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

  // ============ FAMILY MEMBERS ============

  // Get all family members
  fastify.get('/', async (request: any, reply) => {
    try {
      const members = await prisma.familyMember.findMany({
        where: { userId: request.user.id },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ],
        include: {
          _count: { select: { reports: true } }
        }
      })

      return { data: members }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Get single family member
  fastify.get('/:id', async (request: any, reply) => {
    const { id } = request.params

    try {
      const member = await prisma.familyMember.findFirst({
        where: { id, userId: request.user.id },
        include: {
          _count: { select: { reports: true } }
        }
      })

      if (!member) {
        reply.code(404).send({ error: 'Family member not found' })
        return
      }

      return { data: member }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Add family member
  fastify.post('/', async (request: any, reply) => {
    const { name, relationship, dateOfBirth, gender, avatarColor } = request.body

    if (!name || !relationship) {
      reply.code(400).send({ error: 'Name and relationship are required' })
      return
    }

    try {
      // Check if this is the first member (make it default)
      const existingCount = await prisma.familyMember.count({
        where: { userId: request.user.id }
      })

      const member = await prisma.familyMember.create({
        data: {
          userId: request.user.id,
          name,
          relationship,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          avatarColor: avatarColor || '#3B82F6',
          isDefault: existingCount === 0 // First member is default
        }
      })

      return { data: member }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Update family member
  fastify.put('/:id', async (request: any, reply) => {
    const { id } = request.params
    const { name, relationship, dateOfBirth, gender, avatarColor } = request.body

    try {
      const existing = await prisma.familyMember.findFirst({
        where: { id, userId: request.user.id }
      })

      if (!existing) {
        reply.code(404).send({ error: 'Family member not found' })
        return
      }

      const member = await prisma.familyMember.update({
        where: { id },
        data: {
          name: name || existing.name,
          relationship: relationship || existing.relationship,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth,
          gender: gender !== undefined ? gender : existing.gender,
          avatarColor: avatarColor || existing.avatarColor
        }
      })

      return { data: member }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Delete family member
  fastify.delete('/:id', async (request: any, reply) => {
    const { id } = request.params

    try {
      const existing = await prisma.familyMember.findFirst({
        where: { id, userId: request.user.id }
      })

      if (!existing) {
        reply.code(404).send({ error: 'Family member not found' })
        return
      }

      // Don't actually delete - just unlink reports and delete member
      // Reports will have familyMemberId set to null (onDelete: SetNull)
      await prisma.familyMember.delete({
        where: { id }
      })

      // If deleted member was default, set another as default
      if (existing.isDefault) {
        const nextMember = await prisma.familyMember.findFirst({
          where: { userId: request.user.id },
          orderBy: { createdAt: 'asc' }
        })
        if (nextMember) {
          await prisma.familyMember.update({
            where: { id: nextMember.id },
            data: { isDefault: true }
          })
        }
      }

      return { success: true }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Set as default profile
  fastify.put('/:id/default', async (request: any, reply) => {
    const { id } = request.params

    try {
      const existing = await prisma.familyMember.findFirst({
        where: { id, userId: request.user.id }
      })

      if (!existing) {
        reply.code(404).send({ error: 'Family member not found' })
        return
      }

      // Unset all defaults, then set this one
      await prisma.$transaction([
        prisma.familyMember.updateMany({
          where: { userId: request.user.id },
          data: { isDefault: false }
        }),
        prisma.familyMember.update({
          where: { id },
          data: { isDefault: true }
        })
      ])

      return { success: true }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Auto-create "Self" profile if none exists
  fastify.post('/init', async (request: any, reply) => {
    try {
      const existing = await prisma.familyMember.count({
        where: { userId: request.user.id }
      })

      if (existing > 0) {
        return { data: null, message: 'Already initialized' }
      }

      // Get user name from profile
      const profile = await prisma.profile.findUnique({
        where: { userId: request.user.id }
      })

      const member = await prisma.familyMember.create({
        data: {
          userId: request.user.id,
          name: profile?.name || 'Myself',
          relationship: 'self',
          isDefault: true,
          avatarColor: '#3B82F6'
        }
      })

      return { data: member }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })
}
