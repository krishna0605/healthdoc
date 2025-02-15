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
        
        if (data && !error) {
          console.log(`[useReportStatus] Initial fetch for ${reportId}:`, data.status)
          setStatus(data.status as ReportStatus)
        }
      } catch (err) {
        console.error('Error fetching report status:', err)
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reportId])

  return { status, isLoading }
}
