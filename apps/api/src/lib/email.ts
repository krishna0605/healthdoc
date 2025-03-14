/**
 * Email Service - Sends notifications to users
 * Uses fetch to call Resend API (or can be adapted for other providers)
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'HealthDoc <noreply@healthdocliv.app>'

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // If no API key, log and skip (development mode)
  if (!RESEND_API_KEY) {
    console.log(`📧 [DEV] Would send email to: ${options.to}`)
    console.log(`   Subject: ${options.subject}`)
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email send failed:', error)
      return false
    }

    console.log(`✅ Email sent to ${options.to}`)
    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}

// Email templates
export function reportReadyEmail(reportTitle: string, reportUrl: string): { subject: string; html: string } {
  return {
    subject: `✅ Your Health Report is Ready - ${reportTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">Your Report is Ready!</h2>
        <p>Great news! Your health report <strong>"${reportTitle}"</strong> has been analyzed and is ready to view.</p>
        <a href="${reportUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          View Your Report
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions about your results, please consult with your healthcare provider.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">HealthDoc - Your AI-Powered Health Report Analyzer</p>
      </div>
    `
  }
}

export function abnormalResultsEmail(reportTitle: string, abnormalCount: number, reportUrl: string): { subject: string; html: string } {
  return {
    subject: `⚠️ Alert: Abnormal Values Detected - ${reportTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Attention: Abnormal Values Detected</h2>
        <p>Your health report <strong>"${reportTitle}"</strong> has been analyzed and we found <strong style="color: #dc2626;">${abnormalCount} abnormal value(s)</strong>.</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            We recommend reviewing these results and consulting with your healthcare provider.
          </p>
        </div>
        <a href="${reportUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
          View Full Report
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">HealthDoc - Your AI-Powered Health Report Analyzer</p>
      </div>
    `
  }
}

export function verificationCodeEmail(code: string): { subject: string; html: string } {
  return {
    subject: `Your Verification Code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">Your Verification Code</h2>
        <p>Please use the following code to complete your sign in:</p>
        <div style="background: #f3f4f6; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1f2937;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">HealthDoc - Secure Authentication</p>
      </div>
    `
  }
}
