import { Queue } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1', // Use explicit IPv4 to avoid ::1 issues
  port: parseInt(process.env.REDIS_PORT || '6379')
}

let reportQueue: Queue | null = null
let redisConnected = false

// Lazy initialization to prevent startup crashes
function getQueue(): Queue {
  if (!reportQueue) {
    reportQueue = new Queue('report-processing', { 
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    })
    
    reportQueue.on('error', (err) => {
      console.error('[Queue] Redis connection error:', err.message)
      redisConnected = false
    })
    
    // Test connection
    reportQueue.client.then(() => {
      redisConnected = true
      console.log('[Queue] ✅ Connected to Redis')
    }).catch((err) => {
      console.error('[Queue] ⚠️ Redis not available:', err.message)
      redisConnected = false
    })
  }
  return reportQueue
}

export interface ReportJobData {
  reportId: string
  fileUrl: string 
  filePath?: string
  userId: string
  originalFileName?: string
  fileType?: string
}

export async function addReportJob(data: ReportJobData) {
  try {
    const queue = getQueue()
    await queue.add('analyze', data)
    console.log(`[Queue] Job added for report ${data.reportId}`)
    return true
  } catch (error: any) {
    console.error('[Queue] Failed to add job:', error.message)
    console.error('[Queue] ⚠️ Report will not be processed until Redis is running')
    return false
  }
}

export function isQueueAvailable(): boolean {
  return redisConnected
}

// Export for backwards compatibility
export { getQueue as reportQueue }
