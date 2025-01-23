import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { prisma } from './lib/prisma.js'
import { logger } from './lib/logger.js'

const fastify = Fastify({
  logger: logger,
})

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})

await fastify.register(helmet)

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

import { reportRoutes } from './modules/reports/routes.js'
import { publicReportRoutes } from './modules/reports/publicRoutes.js'
import { userRoutes } from './modules/users/routes.js'
import { familyRoutes } from './modules/family/routes.js'
import { twoFactorRoutes } from './modules/auth/twoFactorRoutes.js'
import { auditRoutes } from './modules/audit/routes.js'
import { initReportWorker } from './workers/reportWorker.js'

// ... existing code ...

const start = async () => {
  try {
    // API Routes
    await fastify.register(publicReportRoutes, { prefix: '/api/public' })
    await fastify.register(reportRoutes, { prefix: '/api/reports' })
    await fastify.register(userRoutes, { prefix: '/api/user' })
    await fastify.register(familyRoutes, { prefix: '/api/family' })
    await fastify.register(twoFactorRoutes, { prefix: '/api/auth/2fa' })
    await fastify.register(auditRoutes, { prefix: '/api/audit' })

    // Start Workers (optional - gracefully handle Redis unavailability)
    try {
      initReportWorker()
    } catch (err: any) {
      console.warn('⚠️ Worker not started (Redis unavailable):', err.message)
      console.warn('⚠️ Report processing will be disabled until Redis is running')
    }

    const port = parseInt(process.env.PORT || '3001')
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🚀 API Gateway running on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
})
