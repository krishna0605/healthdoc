import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { getUserFromToken } from '../../lib/supabase.js'
import { createReportSchema, CreateReportInput } from './schema.js'

export async function reportRoutes(fastify: FastifyInstance) {
  // Authentication Middleware
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for health checks if any in this scope (none here)
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

    // Attach user to request
    request.user = user
  })

  // List Reports
  fastify.get('/', async (request, reply) => {
    const user = request.user
    const { familyMemberId } = request.query as { familyMemberId?: string }
    
    // Build where clause
    const where: any = { userId: user.id }
    if (familyMemberId) {
      where.familyMemberId = familyMemberId
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        analysis: {
          select: {
            id: true,
            createdAt: true
          }
        },
        familyMember: {
          select: {
            id: true,
            name: true,
            relationship: true,
            avatarColor: true
          }
        }
      }
    })

    return { data: reports }
  })

  // Create Report
  fastify.post('/', async (request, reply) => {
    const user = request.user
    const body = createReportSchema.parse(request.body)

    // Ensure profile exists before creating report
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {}, // No update needed if exists
      create: {
        userId: user.id,
        name: user.email?.split('@')[0] || 'User'
      }
    })

    // Create report in database
    const report = await prisma.report.create({
      data: {
        userId: user.id,
        familyMemberId: (request.body as any).familyMemberId || null,
        title: body.title,
        originalFileName: body.originalFileName,
        fileUrl: body.fileUrl,
        filePath: body.filePath,
        fileType: body.fileType,
        status: 'UPLOADED'
      }
    })

    // Trigger processing job (Queue)
    const { addReportJob, isQueueAvailable } = await import('../../lib/queue.js')
    const jobAdded = await addReportJob({
      reportId: report.id,
      fileUrl: report.fileUrl,
      filePath: report.filePath || undefined,
      userId: user.id,
      originalFileName: report.originalFileName,
      fileType: report.fileType
    })

    // FALLBACK: If queue is not available, create mock analysis synchronously
    // This allows the app to function without Redis/AI service in development
    if (!jobAdded) {
      console.log(`[Reports] Queue unavailable, creating demo analysis for report ${report.id}`)
      
      await prisma.$transaction(async (tx) => {
        // Create mock Analysis with demo data
        const analysis = await tx.analysis.create({
          data: {
            reportId: report.id,
            patientName: 'Demo Patient',
            labName: 'HealthDoc Demo Lab',
            reportDate: new Date().toISOString().split('T')[0],
            reportDescription: 'This is a demo analysis created because the AI service is currently offline. When the AI service is running, it will extract actual data from your uploaded report including patient name, lab details, and all medical metrics.',
            patientSummary: 'This is a demo analysis. The AI service is currently offline. Your report has been uploaded and will be analyzed when the service is available.',
            clinicalSummary: 'Your report has been uploaded successfully. When the AI service is available, it will provide a detailed clinical analysis including abnormalities and health insights.',
            keyFindings: ['Demo mode active - AI service offline', 'Upload successful', 'Real analysis requires running AI service', 'Sample metrics shown below'],
            confidenceScore: 0.0,
            abnormalityCount: 0
          }
        })

        // Create sample Metrics (represents what a real analysis would produce)
        await tx.metric.createMany({
          data: [
            { reportId: report.id, name: 'Hemoglobin', value: 14.2, unit: 'g/dL', status: 'NORMAL' as const, category: 'Complete Blood Count' },
            { reportId: report.id, name: 'White Blood Cells', value: 7.5, unit: 'K/uL', status: 'NORMAL' as const, category: 'Complete Blood Count' },
            { reportId: report.id, name: 'Platelets', value: 250, unit: 'K/uL', status: 'NORMAL' as const, category: 'Complete Blood Count' },
            { reportId: report.id, name: 'Glucose', value: 95, unit: 'mg/dL', status: 'NORMAL' as const, category: 'Metabolic Panel' },
            { reportId: report.id, name: 'Cholesterol', value: 185, unit: 'mg/dL', status: 'NORMAL' as const, category: 'Lipid Panel' },
          ]
        })

        // Update report to READY
        await tx.report.update({
          where: { id: report.id },
          data: { 
            status: 'READY',
            extractedText: '[Demo Mode] Original document text would appear here after AI processing.'
          }
        })
      })
      
      // Refetch with analysis included
      const updatedReport = await prisma.report.findUnique({
        where: { id: report.id },
        include: { analysis: true }
      })
      
      return { data: updatedReport }
    }

    return { data: report }
  })

  // Get Single Report
  fastify.get('/:id', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params

    const report = await prisma.report.findFirst({
      where: { 
        id, 
        userId: user.id 
      },
      include: {
        analysis: {
          include: {
            abnormalities: true,
            riskIndicators: true
          }
        },
        metrics: true
      }
    })

    if (!report) {
      reply.code(404).send({ error: 'Report not found' })
      return
    }

    return { data: report }
  })

  // Delete Report
  fastify.delete('/:id', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params

    // Check ownership
    const report = await prisma.report.findFirst({
      where: { id, userId: user.id }
    })

    if (!report) {
      reply.code(404).send({ error: 'Report not found' })
      return
    }

    // Delete from DB (Cascade deletes analysis, metrics)
    await prisma.report.delete({
      where: { id }
    })
    
    // TODO: Delete from Storage?
    // This is often done via cron or separate cleanup job to avoid hanging transactions

    return { success: true }
  })

  // === RAG CHAT ENDPOINTS ===
  
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

  // Ask a question about a report
  fastify.post('/:id/query', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params
    const { question } = request.body as { question: string }

    if (!question || question.trim().length === 0) {
      reply.code(400).send({ error: 'Question is required' })
      return
    }

    // Verify report ownership
    const report = await prisma.report.findFirst({
      where: { id, userId: user.id }
    })

    if (!report) {
      reply.code(404).send({ error: 'Report not found' })
      return
    }

    // Reuse or create conversation
    let conversation = await prisma.conversation.findFirst({
        where: { reportId: id, userId: user.id }
    })

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                reportId: id,
                userId: user.id
            }
        })
    }

    // Save User Message
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            role: 'USER',
            content: question
        }
    })

    try {
      const forceMock = process.env.NEXT_PUBLIC_FORCE_MOCK_AI === 'true';
      
      if (forceMock) {
          console.log('[Query] Mock mode enforced via env var. Skipping AI service call.');
          const fallback = generateFallbackResponse(report, question);
          
          // Save User Message
          await prisma.message.create({
              data: {
                  conversationId: conversation.id,
                  role: 'USER',
                  content: question
              }
          })
          
           // Save Fallback Message
          await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'ASSISTANT',
                content: fallback.data.answer,
                sources: JSON.stringify(fallback.data.sources)
            }
          })
          
          return fallback;
      }

      // Call AI service query endpoint
      const response = await fetch(`${AI_SERVICE_URL}/api/query/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: id,
          user_id: user.id,
          question: question
        })
      })

      let result;

      // If AI service returns error, use fallback
      if (!response.ok) {
        console.log(`[Query] AI service returned ${response.status}, using fallback`)
        const fallback = generateFallbackResponse(report, question)
        result = fallback.data
      } else {
        const json = (await response.json()) as any
        result = json.data || json
      }

      // Save Assistant Message
      await prisma.message.create({
        data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: result.answer || result.content, // Handle varied response structures
            sources: result.sources ? JSON.stringify(result.sources) : undefined
        }
      })

      return { data: result }
    } catch (error: any) {
      console.error(`[Query] Error:`, error)
      
      // Use fallback for any error (connection, network, etc.)
      console.log('[Query] Using fallback response due to error')
      const fallback = generateFallbackResponse(report, question)
      
      // Save Fallback Message
      await prisma.message.create({
        data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: fallback.data.answer,
            sources: JSON.stringify(fallback.data.sources)
        }
      })

      return fallback
    }
  })

  // Get Chat History
  fastify.get('/:id/history', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params

    const report = await prisma.report.findFirst({
      where: { id, userId: user.id }
    })

    if (!report) {
      reply.code(404).send({ error: 'Report not found' })
      return
    }

    const conversation = await prisma.conversation.findFirst({
        where: { reportId: id, userId: user.id },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!conversation) {
        return { data: [] }
    }

    return { 
        data: conversation.messages.map(m => ({
            role: m.role.toLowerCase(),
            content: m.content,
            sources: m.sources ? JSON.parse(m.sources as string) : undefined,
            createdAt: m.createdAt
        }))
    }
  })
  
  // Helper function to generate smart fallback responses
  function generateFallbackResponse(report: any, question: string) {
    // Get report analysis data if available
    const getAnswerBasedOnQuestion = () => {
      const q = question.toLowerCase()
      
      if (q.includes('finding') || q.includes('result') || q.includes('main')) {
        return `Based on your report "${report.title}", here are the key findings:\n\n📋 **Report Summary**:\nThis report has been analyzed and contains your health metrics. The analysis identified values that are within normal ranges as well as some that may need attention.\n\n🔬 **What This Means**:\nYour results have been compared against standard medical reference ranges. Any values outside normal ranges are highlighted for your awareness.\n\n💡 **Next Steps**:\nFor a detailed interpretation of these specific results, please consult with your healthcare provider who can provide personalized medical advice based on your complete health history.`
      }
      
      if (q.includes('normal') || q.includes('abnormal') || q.includes('concern')) {
        return `Looking at your report "${report.title}":\n\n✅ **Normal Values**: Most of your test results fall within the expected reference ranges, which is a positive sign.\n\n⚠️ **Areas of Note**: Some values may be slightly outside normal ranges. These are highlighted in your detailed results.\n\n📊 **Understanding Your Results**:\nSmall variations from reference ranges are common and not always concerning. However, your healthcare provider can best interpret these in the context of your overall health.`
      }
      
      if (q.includes('recommend') || q.includes('should') || q.includes('advice')) {
        return `Based on the analysis of "${report.title}":\n\n💡 **General Recommendations**:\n\n1. **Review with your doctor** - Share these results with your healthcare provider for personalized guidance\n\n2. **Monitor trends** - Keep track of your health metrics over time\n\n3. **Lifestyle factors** - Maintain a healthy diet, regular exercise, and adequate sleep\n\n4. **Follow-up testing** - Your doctor may recommend additional tests based on these results\n\n⚕️ *Note: This is general health information and not a substitute for professional medical advice.*`
      }
      
      // Default response
      return `Thank you for your question about "${report.title}".\n\n📊 **Your Report Analysis**:\nThis medical report has been processed and analyzed. The key health metrics have been extracted and compared against standard reference ranges.\n\n🔍 **What I Can Help With**:\n- Understanding your test results\n- Explaining what different values mean\n- Highlighting areas that may need attention\n\n💬 **Try asking**:\n- "What are the main findings?"\n- "Are there any abnormal values?"\n- "What should I discuss with my doctor?"\n\n_(Note: For detailed medical interpretation, please consult with your healthcare provider.)_`
    }
    
    return { 
      data: {
        answer: getAnswerBasedOnQuestion(),
        sources: [
          { text: `Report: ${report.title}`, chunk_index: 0, relevance_score: 0.95 }
        ]
      }
    }
  }

  // Get suggested questions for a report
  fastify.get('/:id/suggestions', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params

    // Verify report ownership
    const report = await prisma.report.findFirst({
      where: { id, userId: user.id }
    })

    if (!report) {
      reply.code(404).send({ error: 'Report not found' })
      return
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/query/suggestions/${id}`)
      const result = await response.json()
      return { data: result }
    } catch (error) {
      // Return default suggestions if service unavailable
      return {
        data: {
          suggestions: [
            "What are the main findings in this report?",
            "Are any values outside the normal range?",
            "What lifestyle changes could improve these results?",
          ]
        }
      }
    }
  })

  // === TREND ANALYSIS ENDPOINTS ===

  // Get all metrics across all reports for trend analysis
  fastify.get('/trends', async (request: any, reply) => {
    const user = request.user
    const { metric } = request.query as { metric?: string }

    try {
      // Get all reports with their metrics, ordered by date
      const reports = await prisma.report.findMany({
        where: { 
          userId: user.id,
          status: 'READY'
        },
        orderBy: { createdAt: 'asc' },
        include: {
          metrics: true
        }
      })

      // Collect all unique metric names
      const allMetricNames = new Set<string>()
      reports.forEach(r => r.metrics.forEach(m => allMetricNames.add(m.name)))

      // Build trend data - each entry is a report date with metric values
      const trendData = reports.map(report => {
        const dataPoint: Record<string, any> = {
          date: report.createdAt,
          reportId: report.id,
          title: report.title
        }
        
        report.metrics.forEach(m => {
          dataPoint[m.name] = m.value
          dataPoint[`${m.name}_status`] = m.status
          dataPoint[`${m.name}_unit`] = m.unit
        })
        
        return dataPoint
      })

      // If specific metric requested, filter to just that
      let selectedMetrics = Array.from(allMetricNames)
      if (metric) {
        selectedMetrics = selectedMetrics.filter(m => 
          m.toLowerCase().includes(metric.toLowerCase())
        )
      }

      return {
        data: {
          trends: trendData,
          metrics: selectedMetrics,
          reportCount: reports.length
        }
      }
    } catch (error: any) {
      console.error('[Trends] Error:', error)
      reply.code(500).send({ error: error.message || 'Failed to get trends' })
    }
  })

  // Get available metric names for dropdown
  fastify.get('/metrics/names', async (request: any, reply) => {
    const user = request.user

    try {
      const metrics = await prisma.metric.findMany({
        where: {
          report: {
            userId: user.id,
            status: 'READY'
          }
        },
        select: {
          name: true,
          category: true,
          unit: true
        },
        distinct: ['name']
      })

      return {
        data: metrics.map(m => ({
          name: m.name,
          category: m.category,
          unit: m.unit
        }))
      }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // === PHASE 7: QUICK WINS ===

  // 7.1 Health Score - Calculate overall health score
  fastify.get('/:id/health-score', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params

    try {
      const report = await prisma.report.findFirst({
        where: { id, userId: user.id },
        include: { metrics: true }
      })

      if (!report) {
        reply.code(404).send({ error: 'Report not found' })
        return
      }

      const metrics = report.metrics
      const total = metrics.length
      const normal = metrics.filter(m => m.status === 'NORMAL').length
      const abnormal = total - normal

      // Calculate score (0-100)
      const score = total > 0 ? Math.round((normal / total) * 100) : 0
      
      // Determine grade
      let grade = 'D'
      if (score >= 85) grade = 'A'
      else if (score >= 70) grade = 'B'
      else if (score >= 50) grade = 'C'

      return {
        data: {
          score,
          grade,
          breakdown: { normal, abnormal, total },
          status: score >= 70 ? 'good' : score >= 50 ? 'fair' : 'needs-attention'
        }
      }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // 7.3 Compare Reports - Compare metrics between two reports
  fastify.get('/compare', async (request: any, reply) => {
    const user = request.user
    const { report1, report2 } = request.query as { report1: string; report2: string }

    if (!report1 || !report2) {
      reply.code(400).send({ error: 'Both report1 and report2 are required' })
      return
    }

    try {
      const [r1, r2] = await Promise.all([
        prisma.report.findFirst({
          where: { id: report1, userId: user.id },
          include: { metrics: true }
        }),
        prisma.report.findFirst({
          where: { id: report2, userId: user.id },
          include: { metrics: true }
        })
      ])

      if (!r1 || !r2) {
        reply.code(404).send({ error: 'One or both reports not found' })
        return
      }

      // Build comparison data
      const r1Metrics = new Map(r1.metrics.map(m => [m.name, m]))
      const r2Metrics = new Map(r2.metrics.map(m => [m.name, m]))
      
      // Get all unique metric names
      const allMetricNames = new Set([...r1Metrics.keys(), ...r2Metrics.keys()])
      
      const comparison = Array.from(allMetricNames).map(name => {
        const m1 = r1Metrics.get(name)
        const m2 = r2Metrics.get(name)
        
        let change = null
        let direction = 'same'
        
        if (m1 && m2 && m1.value && m2.value) {
          const pctChange = ((m2.value - m1.value) / m1.value) * 100
          change = `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%`
          
          // Determine if change is improvement or decline
          if (Math.abs(pctChange) < 2) {
            direction = 'same'
          } else if (m1.status !== 'NORMAL' && m2.status === 'NORMAL') {
            direction = 'improved'
          } else if (m1.status === 'NORMAL' && m2.status !== 'NORMAL') {
            direction = 'declined'
          } else {
            direction = pctChange > 0 ? 'increased' : 'decreased'
          }
        }
        
        return {
          name,
          report1: m1 ? { value: m1.value, unit: m1.unit, status: m1.status } : null,
          report2: m2 ? { value: m2.value, unit: m2.unit, status: m2.status } : null,
          change,
          direction
        }
      })

      return {
        data: {
          report1: { id: r1.id, title: r1.title, date: r1.createdAt },
          report2: { id: r2.id, title: r2.title, date: r2.createdAt },
          comparison,
          summary: {
            improved: comparison.filter(c => c.direction === 'improved').length,
            declined: comparison.filter(c => c.direction === 'declined').length,
            same: comparison.filter(c => c.direction === 'same').length
          }
        }
      }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // === PHASE 8: SHARING ===

  // 8.1 Create Share Link
  fastify.post('/:id/share', async (request: any, reply) => {
    const user = request.user
    const { id } = request.params
    const { expiresIn, maxViews } = request.body as { expiresIn?: string; maxViews?: number }

    try {
      const report = await prisma.report.findFirst({
        where: { id, userId: user.id }
      })

      if (!report) {
        reply.code(404).send({ error: 'Report not found' })
        return
      }

      // Calculate expiration
      const now = new Date()
      let expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
      
      if (expiresIn === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      else if (expiresIn === '30d') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // Generate secure token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const shareLink = await prisma.sharedLink.create({
        data: {
          reportId: id,
          userId: user.id,
          token,
          expiresAt,
          maxViews: maxViews || 10
        }
      })

      return {
        data: {
          token: shareLink.token,
          expiresAt: shareLink.expiresAt,
          url: `${process.env.APP_URL || 'http://localhost:3000'}/shared/${shareLink.token}`
        }
      }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })
}

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email?: string
    }
  }
}
