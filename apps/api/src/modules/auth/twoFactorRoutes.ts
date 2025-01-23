import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { getUserFromToken } from '../../lib/supabase.js'
import { logAuditEvent, AuditActions } from '../../lib/auditService.js'
import * as crypto from 'crypto'

// Simple TOTP implementation (works with Google Authenticator)
function generateSecret(): string {
  // Generate a random 20-byte secret
  const buffer = crypto.randomBytes(20)
  return base32Encode(buffer)
}

function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  let bits = 0
  let value = 0
  
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31]
  }
  
  return result
}

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
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff)
  
  return String(code % 1000000).padStart(6, '0')
}

function verifyTOTP(secret: string, token: string): boolean {
  // Check current time and +/- 1 window for clock skew
  const now = Date.now() / 1000
  for (const offset of [0, -30, 30]) {
    if (generateTOTP(secret, now + offset) === token) {
      return true
    }
  }
  return false
}

function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
}

export async function twoFactorRoutes(fastify: FastifyInstance) {
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

  // Get 2FA status
  fastify.get('/status', async (request: any, reply) => {
    try {
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId: request.user.id },
        select: { isEnabled: true, createdAt: true, verifiedAt: true }
      })

      return { 
        data: { 
          isEnabled: twoFA?.isEnabled || false,
          setupComplete: !!twoFA?.verifiedAt
        } 
      }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Setup 2FA (generate secret + QR code URL)
  fastify.post('/setup', async (request: any, reply) => {
    try {
      // Check if already enabled
      const existing = await prisma.twoFactorAuth.findUnique({
        where: { userId: request.user.id }
      })

      if (existing?.isEnabled) {
        reply.code(400).send({ error: '2FA is already enabled' })
        return
      }

      const secret = generateSecret()
      const backupCodes = generateBackupCodes()
      
      // Upsert 2FA record
      await prisma.twoFactorAuth.upsert({
        where: { userId: request.user.id },
        update: {
          secret,
          backupCodes: backupCodes.map(hashBackupCode),
          isEnabled: false,
          verifiedAt: null
        },
        create: {
          userId: request.user.id,
          secret,
          backupCodes: backupCodes.map(hashBackupCode),
          isEnabled: false
        }
      })

      // Generate QR code URL for Google Authenticator
      const issuer = 'HealthDoc'
      const email = request.user.email || 'user'
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

      return {
        data: {
          secret,
          qrCodeUrl: otpAuthUrl,
          backupCodes // Show only once during setup
        }
      }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Verify and enable 2FA
  fastify.post('/verify', async (request: any, reply) => {
    const { code } = request.body as { code: string }

    if (!code || code.length !== 6) {
      reply.code(400).send({ error: 'Invalid code format' })
      return
    }

    try {
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId: request.user.id }
      })

      if (!twoFA) {
        reply.code(400).send({ error: 'Please setup 2FA first' })
        return
      }

      if (twoFA.isEnabled) {
        reply.code(400).send({ error: '2FA is already enabled' })
        return
      }

      // Verify the code
      if (!verifyTOTP(twoFA.secret, code)) {
        reply.code(400).send({ error: 'Invalid verification code' })
        return
      }

      // Enable 2FA
      await prisma.twoFactorAuth.update({
        where: { userId: request.user.id },
        data: {
          isEnabled: true,
          verifiedAt: new Date()
        }
      })

      // Log audit event
      await logAuditEvent({
        userId: request.user.id,
        action: AuditActions.TWO_FA_ENABLED,
        request
      })

      return { success: true, message: '2FA enabled successfully' }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Validate 2FA code (for login)
  fastify.post('/validate', async (request: any, reply) => {
    const { code, isBackupCode } = request.body as { code: string; isBackupCode?: boolean }

    try {
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId: request.user.id }
      })

      if (!twoFA || !twoFA.isEnabled) {
        return { success: true } // 2FA not enabled, skip
      }

      if (isBackupCode) {
        const hashedCode = hashBackupCode(code)
        const codeIndex = twoFA.backupCodes.indexOf(hashedCode)
        
        if (codeIndex === -1) {
          reply.code(400).send({ error: 'Invalid backup code' })
          return
        }

        // Remove used backup code
        const newCodes = [...twoFA.backupCodes]
        newCodes.splice(codeIndex, 1)
        await prisma.twoFactorAuth.update({
          where: { userId: request.user.id },
          data: { backupCodes: newCodes }
        })

        await logAuditEvent({
          userId: request.user.id,
          action: AuditActions.TWO_FA_VERIFIED,
          metadata: { method: 'backup_code' },
          request
        })

        return { success: true }
      }

      // Verify TOTP
      if (!verifyTOTP(twoFA.secret, code)) {
        reply.code(400).send({ error: 'Invalid code' })
        return
      }

      await logAuditEvent({
        userId: request.user.id,
        action: AuditActions.TWO_FA_VERIFIED,
        metadata: { method: 'totp' },
        request
      })

      return { success: true }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Disable 2FA
  fastify.post('/disable', async (request: any, reply) => {
    const { code } = request.body as { code: string }

    try {
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId: request.user.id }
      })

      if (!twoFA || !twoFA.isEnabled) {
        reply.code(400).send({ error: '2FA is not enabled' })
        return
      }

      // Verify code before disabling
      if (!verifyTOTP(twoFA.secret, code)) {
        reply.code(400).send({ error: 'Invalid code' })
        return
      }

      // Disable 2FA
      await prisma.twoFactorAuth.update({
        where: { userId: request.user.id },
        data: { isEnabled: false }
      })

      await logAuditEvent({
        userId: request.user.id,
        action: AuditActions.TWO_FA_DISABLED,
        request
      })

      return { success: true, message: '2FA disabled' }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })

  // Regenerate backup codes
  fastify.post('/backup-codes', async (request: any, reply) => {
    const { code } = request.body as { code: string }

    try {
      const twoFA = await prisma.twoFactorAuth.findUnique({
        where: { userId: request.user.id }
      })

      if (!twoFA || !twoFA.isEnabled) {
        reply.code(400).send({ error: '2FA must be enabled to regenerate backup codes' })
        return
      }

      // Verify code
      if (!verifyTOTP(twoFA.secret, code)) {
        reply.code(400).send({ error: 'Invalid code' })
        return
      }

      const newCodes = generateBackupCodes()
      
      await prisma.twoFactorAuth.update({
        where: { userId: request.user.id },
        data: { backupCodes: newCodes.map(hashBackupCode) }
      })

      return { data: { backupCodes: newCodes } }
    } catch (error: any) {
      reply.code(500).send({ error: error.message })
    }
  })
}
