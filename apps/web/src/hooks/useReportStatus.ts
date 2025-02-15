'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReportStatus } from '@/types'

/**
 * Hook to subscribe to real-time report status updates
 */
export function useReportStatus(reportId: string | null, initialStatus: ReportStatus = 'UPLOADED') {
  const [status, setStatus] = useState<ReportStatus>(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reportId) return

    const supabase = createClient()

    // 1. Fetch current status immediately to handle any missed events
    const fetchCurrentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('status')
          .eq('id', reportId)
          .single()
        
        if (error) throw error
        
        if (data) {
          console.log(`[useReportStatus] Initial fetch for ${reportId}:`, data.status)
          setStatus(data.status as ReportStatus)
          setError(null)
        }
      } catch (err: any) {
        console.error('Error fetching report status:', err)
        // If it's 406 or RLS error, we want to know
        setError(err.message)
      }
    }

    fetchCurrentStatus()

    // 2. Subscribe to real-time updates
    const channel = supabase
      .channel(`report-status-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `id=eq.${reportId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as ReportStatus
          console.log(`[useReportStatus] Realtime update: ${newStatus}`)
          setStatus(newStatus)
          setIsLoading(
            newStatus !== 'READY' && newStatus !== 'FAILED'
          )
        }
      )
      .subscribe((status) => {
        console.log(`[useReportStatus] Subscription status: ${status}`)
      })

    // 3. Polling fallback (every 3 seconds)
    // This ensures we catch updates even if WebSocket fails or is blocked
    const intervalId = setInterval(() => {
      if (status !== 'READY' && status !== 'FAILED') {
        fetchCurrentStatus()
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(intervalId)
    }
  }, [reportId, status])

  return { status, isLoading, error }
}
