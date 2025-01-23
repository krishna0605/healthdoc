import { Worker } from 'bullmq'
import { prisma } from '../lib/prisma.js'
import { sendEmail, reportReadyEmail, abnormalResultsEmail } from '../lib/email.js'
import { createClient } from '@supabase/supabase-js'

const PYTHON_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// Supabase admin client to get user email
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1', // Use explicit IPv4 to avoid ::1 issues
  port: parseInt(process.env.REDIS_PORT || '6379')
}

export const initReportWorker = () => {
  console.log('🚀 Report Worker starting...')
  
  const worker = new Worker('report-processing', async job => {
    console.log(`[Worker] Processing job ${job.id}:`, job.data)
    const { reportId, fileUrl, filePath, userId } = job.data

    try {
      // 1. Update Status to OCR_PROCESSING
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'OCR_PROCESSING' }
      })

      // 2. Call Python AI Service
      // We pass the signed URL or direct path?
      // Python service has Supabase Service Key, so it can download using filePath.
      const response = await fetch(`${PYTHON_SERVICE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          file_path: filePath, // Use filePath for internal download
          user_id: userId
        })
      })

      if (!response.ok) {
        throw new Error(`AI Service failed: ${response.statusText}`)
      }

      const result = (await response.json()) as any
      console.log(`[Worker] Job ${job.id} completed. Analysis result:`, result)
      
      // 3. Save Results in Transaction
      await prisma.$transaction(async (tx) => {
        // Create Analysis Record with all extracted fields
        const analysis = await tx.analysis.create({
          data: {
            reportId: reportId,
            patientName: result.patient_name || null,
            labName: result.lab_name || null,
            reportDate: result.report_date || null,
            reportDescription: result.report_description || null,
            patientSummary: result.patient_summary || 'No summary available',
            clinicalSummary: result.clinical_summary || 'No clinical summary available',
            keyFindings: result.key_findings || [], // Prisma handles JSON array
            confidenceScore: 0.9, // Hardcoded for now or get from result
            abnormalityCount: result.abnormalities?.length || 0
          }
        })

        // Create Metrics
        if (result.metrics && result.metrics.length > 0) {
          await tx.metric.createMany({
            data: result.metrics.map((m: any) => ({
              reportId: reportId,
              name: m.name,
              value: m.value,
              unit: m.unit,
              status: m.status?.toUpperCase(), 
              category: m.category
            }))
          })
        }

        // Create Abnormalities
        if (result.abnormalities && result.abnormalities.length > 0) {
          await tx.abnormality.createMany({
            data: result.abnormalities.map((a: any) => ({
              analysisId: analysis.id,
              metricName: a.metricName,
              severity: a.severity?.toUpperCase(),
              description: a.description,
              clinicalContext: a.clinicalContext
            }))
          })
        }

        // Update Report to READY
        await tx.report.update({
          where: { id: reportId },
          data: { 
            status: 'READY',
            extractedText: result.extracted_text
          }
        })
      })

      // 4. Generate Embeddings for RAG (non-blocking)
      try {
        console.log(`[Worker] Generating embeddings for report ${reportId}...`)
        const embedResponse = await fetch(`${PYTHON_SERVICE_URL}/api/embeddings/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report_id: reportId,
            user_id: userId,
            extracted_text: result.extracted_text || ''
          })
        })
        if (embedResponse.ok) {
          console.log(`[Worker] Embeddings generated for report ${reportId}`)
        } else {
          console.warn(`[Worker] Embedding generation failed: ${embedResponse.statusText}`)
        }
      } catch (embedError) {
        console.warn(`[Worker] Embedding service unavailable, skipping:`, embedError)
        // Don't fail the job if embeddings fail
      }

      // 5. Create In-App + Email Notifications
      try {
        const prefs = await prisma.notificationPreference.findUnique({
          where: { userId }
        })
        
        const abnormalCount = result.abnormalities?.length || 0
        
        // Check preferences (default to true if not set)
        const notifyOnComplete = prefs?.emailOnComplete ?? true
        const notifyOnAbnormal = prefs?.emailOnAbnormal ?? true
        
        // Get report title
        const report = await prisma.report.findUnique({ where: { id: reportId } })
        const reportTitle = report?.title || 'Health Report'
        
        // Get user email from Supabase Auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
        const userEmail = userData?.user?.email
        
        const fullReportUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reports/${reportId}`
        const reportUrl = `/reports/${reportId}`
        
        // Create "Report Ready" notification + email
        if (notifyOnComplete) {
          // In-app notification
          await prisma.notification.create({
            data: {
              userId,
              type: 'report_ready',
              title: 'Report Analysis Complete',
              message: `Your report "${reportTitle}" has been analyzed and is ready to view.`,
              link: reportUrl
            }
          })
          console.log(`[Worker] Created in-app notification for user ${userId}`)
          
          // Email notification
          if (userEmail) {
            const email = reportReadyEmail(reportTitle, fullReportUrl)
            await sendEmail({ to: userEmail, ...email })
            console.log(`[Worker] Sent email to ${userEmail}`)
          }
        }
        
        // Create "Abnormal Values" notification + email if applicable
        if (notifyOnAbnormal && abnormalCount > 0) {
          // In-app notification
          await prisma.notification.create({
            data: {
              userId,
              type: 'abnormal_alert',
              title: '⚠️ Abnormal Values Detected',
              message: `Your report "${reportTitle}" has ${abnormalCount} abnormal value(s). Please review.`,
              link: reportUrl
            }
          })
          console.log(`[Worker] Created abnormal alert notification for user ${userId}`)
          
          // Email notification
          if (userEmail) {
            const email = abnormalResultsEmail(reportTitle, abnormalCount, fullReportUrl)
            await sendEmail({ to: userEmail, ...email })
            console.log(`[Worker] Sent abnormal alert email to ${userEmail}`)
          }
        }
      } catch (notifError) {
        console.warn(`[Worker] Notification/email failed:`, notifError)
        // Don't fail the job if notification fails
      }

    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error)
      
      // Check if it's a connection error (AI service not running)
      const isConnectionError = error.cause?.code === 'ECONNREFUSED' || 
                                error.message?.includes('fetch failed')
      
      if (isConnectionError) {
        // AI service is not available - keep as UPLOADED, don't mark as FAILED
        console.warn(`[Worker] AI Service not available. Report ${reportId} will stay in UPLOADED status.`)
        await prisma.report.update({
          where: { id: reportId },
          data: { status: 'UPLOADED' } // Keep original status
        })
        // Don't throw - job is "complete" but analysis not done
        return
      }
      
      // For other errors, mark as failed
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'FAILED' }
      })
      throw error // Retry
    }
  }, { 
    connection,
    concurrency: 2 // Process 2 reports at a time
  })

  worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} has completed!`)
  })

  worker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job?.id} has failed with ${err.message}`)
  })

  worker.on('error', err => {
    console.error('[Worker] Redis connection error:', err.message)
  })
  
  console.log('🚀 Report Worker started')
  return worker
}
