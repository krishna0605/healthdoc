
import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'

export async function publicReportRoutes(fastify: FastifyInstance) {
  // Get Shared Report by Token
  fastify.get('/shared/:token', async (request: any, reply) => {
    const { token } = request.params

    try {
      // Find valid share link
      const shareLink = await prisma.sharedLink.findUnique({
        where: { token },
        include: {
          report: {
            include: {
              metrics: true,
              analysis: true
            }
          }
        }
      })

      if (!shareLink) {
        reply.code(404).send({ error: 'Link not found or expired' })
        return
      }

      // Check expiry
      if (new Date() > shareLink.expiresAt) {
        reply.code(410).send({ error: 'This link has expired' })
        return
      }

      // Check view count
      if (shareLink.viewCount >= shareLink.maxViews) {
        reply.code(410).send({ error: 'Maximum view count reached' })
        return
      }

      // Increment view count
      await prisma.sharedLink.update({
        where: { id: shareLink.id },
        data: { viewCount: { increment: 1 } }
      })

      // Return limited report data (privacy filtered)
      const report = shareLink.report
      
      // Fetch chat history for this report
      const conversation = await prisma.conversation.findFirst({
        where: { reportId: report.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      const limitedData = {
        title: report.title,
        date: report.createdAt,
        metrics: report.metrics.map(m => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          status: m.status,
          category: m.category
        })),
        summary: report.analysis ? {
          patientSummary: report.analysis.patientSummary,
          clinicalSummary: report.analysis.clinicalSummary,
          keyFindings: report.analysis.keyFindings
        } : null,
        chatHistory: conversation ? conversation.messages.map(m => ({
          role: m.role.toLowerCase(),
          content: m.content,
          sources: m.sources ? JSON.parse(m.sources as string) : undefined,
          createdAt: m.createdAt
        })) : [],
        expiresAt: shareLink.expiresAt
      }

      return { data: limitedData }

    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })
}
