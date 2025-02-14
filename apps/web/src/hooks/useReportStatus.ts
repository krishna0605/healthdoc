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

    const channel = supabase
      .channel(`report:${reportId}`)
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
          setStatus(newStatus)
          setIsLoading(
            newStatus !== 'READY' && newStatus !== 'FAILED'
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reportId])

  return { status, isLoading }
}
