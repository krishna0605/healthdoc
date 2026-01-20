'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface TrendDataPoint {
  date: string
  reportId: string
  title: string
  [key: string]: any // Dynamic metric values
}

export interface MetricInfo {
  name: string
  category?: string
  unit: string
}

/**
 * Hook to fetch trend data for health metrics
 */
export function useTrends(selectedMetric?: string) {
  const [trends, setTrends] = useState<TrendDataPoint[]>([])
  const [metrics, setMetrics] = useState<string[]>([])
  const [reportCount, setReportCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrends = useCallback(async () => {
    setLoading(true)
    const endpoint = selectedMetric 
      ? `/api/reports/trends?metric=${encodeURIComponent(selectedMetric)}`
      : '/api/reports/trends'
    
    const { data, error } = await api.get<{
      trends: TrendDataPoint[]
      metrics: string[]
      reportCount: number
    }>(endpoint)
    
    if (error) {
      setError(error)
    } else if (data) {
      setTrends(data.trends || [])
      setMetrics(data.metrics || [])
      setReportCount(data.reportCount || 0)
      setError(null)
    }
    setLoading(false)
  }, [selectedMetric])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  return { trends, metrics, reportCount, loading, error, refetch: fetchTrends }
}

/**
 * Hook to fetch available metric names for dropdown
 */
export function useMetricNames() {
  const [metricNames, setMetricNames] = useState<MetricInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetricNames() {
      setLoading(true)
      const { data } = await api.get<MetricInfo[]>('/api/reports/metrics/names')
      setMetricNames(data || [])
      setLoading(false)
    }

    fetchMetricNames()
  }, [])

  return { metricNames, loading }
}
