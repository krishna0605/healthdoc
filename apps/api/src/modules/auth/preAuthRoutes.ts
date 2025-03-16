import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { createClient } from '@supabase/supabase-js'
import { logAuditEvent, AuditActions } from '../../lib/auditService.js'
import * as crypto from 'crypto'
import { sendEmail, verificationCodeEmail } from '../../lib/email.js'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false
  }
  
  record.count++
  return true
}

function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

// Email OTP store (in production, use Redis with TTL)
const emailOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>()

function generateEmailOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

// Get Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL
  // Accept both variable names for flexibility
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export default async function preAuthRoutes(fastify: FastifyInstance) {
  
  // ============================================
  // POST /pre-login - Check if user has 2FA enabled
  // ============================================
  fastify.post('/pre-login', async (request, reply) => {
    const { email } = request.body as { email: string }
    
    if (!email) {
      reply.code(400).send({ error: 'Email is required' })
      return
    }

    try {
      // Get Supabase admin client to look up user by email
      const supabase = getSupabaseAdmin()
      
      // Find user by email in Supabase Auth
      const { data: { users }, error: supabaseError } = await supabase.auth.admin.listUsers()
      
      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        // Don't reveal error details
        return { requires2FA: false, requiresEmailOTP: true, userId: null }
      }
      
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim())
      
      if (!user) {
        // Don't reveal if user exists
        return { requires2FA: false, requiresEmailOTP: true, userId: null }
      }

      // Check 2FA status
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId: user.id },
        select: { isEnabled: true }
      })

      const has2FA = twoFA?.isEnabled || false

      return {
        requires2FA: has2FA,
        requiresEmailOTP: true, // ALWAYS true - email OTP is mandatory fallback for all users
        userId: user.id
      }
    } catch (error) {
      console.error('Pre-login check error:', error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // ============================================
  // POST /send-email-otp - Send OTP via email
  // ============================================
  fastify.post('/send-email-otp', async (request, reply) => {
    console.log('[Email OTP] Received request to send OTP')
    const { email, userId } = request.body as { email: string; userId?: string }
    console.log(`[Email OTP] Email: ${email}, UserId: ${userId}`)

    if (!email) {
      console.log('[Email OTP] Error: Email is required')
      reply.code(400).send({ error: 'Email is required' })
      return
    }

    // Rate limit: 3 sends per 5 minutes
    const rateLimitKey = `email-otp-send:${email}`
    if (!checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000)) {
      console.log('[Email OTP] Error: Rate limited')
      reply.code(429).send({ error: 'Too many requests. Please wait before requesting another code.' })
      return
    }

    try {
      // Generate 6-digit OTP
      const otp = generateEmailOTP()
      const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
      console.log(`[Email OTP] Generated OTP: ${otp}`)

      // Store OTP
      emailOtpStore.set(email.toLowerCase(), {
        code: otp,
        expiresAt,
        attempts: 0
      })

      // Send via custom email service (Resend)
      console.log('[Email OTP] Calling sendEmail...')
      const emailData = verificationCodeEmail(otp)
      const emailSent = await sendEmail({
        to: email,
        subject: emailData.subject,
        html: emailData.html
      })
      console.log(`[Email OTP] sendEmail result: ${emailSent}`)

      if (!emailSent) {
        throw new Error('Failed to send email via service')
      }

      // Log the event
      if (userId) {
        await logAuditEvent({
          userId,
          action: AuditActions.TWO_FA_VERIFIED,
          resource: 'email_otp',
          metadata: { type: 'otp_sent', email: email.substring(0, 3) + '***' }
        })
      }

      // For development, also log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Email OTP for ${email}: ${otp}`)
      }

      return { 
        success: true, 
        message: 'Verification code sent to your email',
        expiresIn: 600
      }
    } catch (error) {
      console.error('Send email OTP error:', error)
      reply.code(500).send({ error: 'Failed to send verification code' })
    }
  })

  // ============================================
  // POST /verify-email-otp - Verify the email OTP
  // ============================================
  fastify.post('/verify-email-otp', async (request, reply) => {
    const { email, code, userId } = request.body as { 
      email: string
      code: string
      userId?: string 
    }

    if (!email || !code) {
      reply.code(400).send({ error: 'Email and code are required' })
      return
    }

    // Rate limit: 5 verify attempts per 5 minutes
    const rateLimitKey = `email-otp-verify:${email}`
    if (!checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000)) {
      reply.code(429).send({ error: 'Too many attempts. Please request a new code.' })
      return
    }

    try {
      const storedOtp = emailOtpStore.get(email.toLowerCase())

      if (!storedOtp) {
        reply.code(400).send({ error: 'No verification code found. Please request a new one.' })
        return
      }

      // Check expiration
      if (Date.now() > storedOtp.expiresAt) {
        emailOtpStore.delete(email.toLowerCase())
        reply.code(400).send({ error: 'Verification code has expired. Please request a new one.' })
        return
      }

      // Check max attempts
      if (storedOtp.attempts >= 5) {
        emailOtpStore.delete(email.toLowerCase())
        reply.code(400).send({ error: 'Too many failed attempts. Please request a new code.' })
        return
      }

      // Verify code
      if (storedOtp.code !== code.trim()) {
        storedOtp.attempts++
        const remaining = 5 - storedOtp.attempts
        reply.code(400).send({ 
          error: `Invalid code. ${remaining} attempts remaining.`,
          attemptsRemaining: remaining
        })
        return
      }

      // Success! Clear the OTP and rate limit
      emailOtpStore.delete(email.toLowerCase())
      resetRateLimit(rateLimitKey)

      // Log success
      if (userId) {
        await logAuditEvent({
          userId,
          action: AuditActions.TWO_FA_VERIFIED,
          resource: 'email_otp',
          metadata: { type: 'otp_verified' }
        })
      }

      return { 
        success: true, 
        message: 'Email verified successfully',
        verified: true
      }
    } catch (error) {
      console.error('Verify email OTP error:', error)
      reply.code(500).send({ error: 'Verification failed' })
    }
  })

  // ============================================
  // POST /validate-2fa-login - Validate TOTP during login
  // ============================================
  fastify.post('/validate-2fa-login', async (request, reply) => {
    const { userId, code, isBackupCode } = request.body as { 
      userId: string
      code: string 
      isBackupCode?: boolean
    }

    if (!userId || !code) {
      reply.code(400).send({ error: 'User ID and code are required' })
      return
    }

    // Rate limit: 5 attempts per 5 minutes
    const rateLimitKey = `2fa-validate:${userId}`
    if (!checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000)) {
      reply.code(429).send({ error: 'Too many attempts. Please try again later.' })
      return
    }

    try {
      // Get user's 2FA settings
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId },
        select: {
          secret: true,
          backupCodes: true,
          isEnabled: true
        }
      })

      if (!twoFA || !twoFA.isEnabled) {
        reply.code(400).send({ error: '2FA is not enabled for this account' })
        return
      }

      let isValid = false

      if (isBackupCode) {
        // Verify backup code
        const hashedCode = hashBackupCode(code.trim())
        const codeIndex = twoFA.backupCodes.indexOf(hashedCode)
        
        if (codeIndex !== -1) {
          // Remove used backup code
          const updatedCodes = [...twoFA.backupCodes]
          updatedCodes.splice(codeIndex, 1)
          
          await prisma.twoFactorAuth.update({
            where: { userId },
            data: { backupCodes: updatedCodes }
          })
          
          isValid = true
        }
      } else {
        // Verify TOTP
        isValid = verifyTOTP(twoFA.secret, code.trim())
      }

      if (!isValid) {
        // Log failed attempt
        await logAuditEvent({
          userId,
          action: AuditActions.LOGIN_FAILED,
          resource: '2fa',
          metadata: { reason: 'Invalid 2FA code', isBackupCode }
        })
        
        reply.code(400).send({ error: 'Invalid verification code' })
        return
      }

      // Success! Reset rate limit
      resetRateLimit(rateLimitKey)

      // Log successful 2FA
      await logAuditEvent({
        userId,
        action: AuditActions.LOGIN,
        resource: '2fa',
        metadata: { method: isBackupCode ? '2fa-backup' : '2fa-totp' }
      })

      return { 
        success: true, 
        verified: true,
        message: '2FA verification successful'
      }
    } catch (error) {
      console.error('2FA validation error:', error)
      reply.code(500).send({ error: 'Verification failed' })
    }
  })
}

// ============================================
// Helper functions
// ============================================

function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  str = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
  
  let bits = 0
  let value = 0
  const result: number[] = []
  
  for (const char of str) {
    const idx = alphabet.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  
  return Buffer.from(result)
}

function generateTOTP(secret: string, time?: number): string {
  const counter = Math.floor((time || Date.now() / 1000) / 30)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))
  
  const key = base32Decode(secret)
  const hmac = crypto.createHmac('sha1', key)
  hmac.update(counterBuffer)
  const hash = hmac.digest()
  
  const offset = hash[hash.length - 1] & 0xf
  const codeNum = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff)
  
  return String(codeNum % 1000000).padStart(6, '0')
}

function verifyTOTP(secret: string, token: string): boolean {
  const now = Date.now() / 1000
  for (const offset of [0, -30, 30]) {
    if (generateTOTP(secret, now + offset) === token) {
      return true
    }
  }
  return false
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}
