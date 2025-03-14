import { prisma } from '../lib/prisma.js'
import { sendEmail, reportReadyEmail, abnormalResultsEmail } from '../lib/email.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Initialize Supabase Admin outside the function to reuse connection
const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export class NotificationService {
  
  /**
   * Send notifications when a report is ready
   */
  async notifyReportReady(userId: string, reportId: string, reportTitle: string, abnormalCount: number = 0) {
    console.log(`[NotificationService] Processing notifications for report ${reportId} (User: ${userId})`)

    try {
      // 1. Get User Preferences & Email
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId }
      })
      
      const notifyOnComplete = prefs?.emailOnComplete ?? true
      const notifyOnAbnormal = prefs?.emailOnAbnormal ?? true
      
      // Get user email from Supabase Auth
      let userEmail: string | undefined
      
      if (supabaseAdmin) {
        const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (error) {
           console.error(`[NotificationService] Failed to fetch user ${userId} from Supabase:`, error.message)
        } else {
           userEmail = userData?.user?.email
        }
      } else {
        console.warn('[NotificationService] Supabase Admin not configured. Cannot fetch user email.')
      }

      if (!userEmail) {
        console.warn(`[NotificationService] No email found for user ${userId}. Skipping email notifications.`)
        // We still continue to create in-app notifications
      }

      const reportUrl = `/reports/${reportId}`
      const fullReportUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reports/${reportId}`

      // 2. Report Ready Notification
      if (notifyOnComplete) {
        // In-App
        await prisma.notification.create({
          data: {
            userId,
            type: 'report_ready',
            title: 'Report Analysis Complete',
            message: `Your report "${reportTitle}" has been analyzed and is ready to view.`,
            link: reportUrl
          }
        })
        
        // Email
        if (userEmail) {
          console.log(`[NotificationService] Sending 'Ready' email to ${userEmail}`)
          const emailData = reportReadyEmail(reportTitle, fullReportUrl)
          const sent = await sendEmail({ to: userEmail, ...emailData })
          if (!sent) console.error('[NotificationService] Failed to send Ready email')
        }
      }

      // 3. Abnormal Results Notification
      if (notifyOnAbnormal && abnormalCount > 0) {
        // In-App
        await prisma.notification.create({
          data: {
            userId,
            type: 'abnormal_alert',
            title: '⚠️ Abnormal Values Detected',
            message: `Your report "${reportTitle}" has ${abnormalCount} abnormal value(s). Please review.`,
            link: reportUrl
          }
        })

        // Email
        if (userEmail) {
          console.log(`[NotificationService] Sending 'Abnormal' email to ${userEmail}`)
          const emailData = abnormalResultsEmail(reportTitle, abnormalCount, fullReportUrl)
          const sent = await sendEmail({ to: userEmail, ...emailData })
          if (!sent) console.error('[NotificationService] Failed to send Abnormal email')
        }
      }

      return true
    } catch (error) {
      console.error('[NotificationService] Error sending notifications:', error)
      return false
    }
  }
}

export const notificationService = new NotificationService()
