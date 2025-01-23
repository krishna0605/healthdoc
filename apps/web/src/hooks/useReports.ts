'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface Report {
  id: string
  title: string
  originalFileName: string
  fileUrl: string
  filePath?: string
  fileType: string
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'ERROR'
  createdAt: string
  updatedAt: string
  familyMember?: {
    id: string
    name: string
    relationship: string
    avatarColor: string
  }
  analysis?: {
    id: string
    createdAt: string
  }
}

export interface ReportDetail extends Report {
  analysis?: {
    id: string
    patientName?: string
    patientAge?: string
    labName?: string
    reportDate?: string
    reportDescription?: string
    patientSummary?: string
    clinicalSummary?: string
    keyFindings?: string[]
    createdAt: string
    abnormalities: Array<{
      id: string
      name: string
      value: string
      severity: string
      explanation: string
    }>
    riskIndicators: Array<{
      id: string
      category: string
      level: string
      description: string
    }>
  }
  metrics: Array<{
    id: string
    name: string
    value: number
    unit: string
    status: string
    category?: string
    referenceMin?: number
    referenceMax?: number
    referenceRange?: string
  }>
}

/**
 * Hook to fetch all reports for the current user
 */
export function useReports(familyMemberId?: string) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const endpoint = familyMemberId 
      ? `/api/reports?familyMemberId=${familyMemberId}` 
      : '/api/reports'
    
    const { data, error } = await api.get<Report[]>(endpoint)
    
    if (error) {
      setError(error)
      setReports([])
    } else {
      setReports(data || [])
      setError(null)
    }
    setLoading(false)
  }, [familyMemberId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, loading, error, refetch: fetchReports }
}

/**
 * Hook to fetch a single report with full details
 */
export function useReport(reportId: string | null) {
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reportId) {
      setLoading(false)
      return
    }

    async function fetchReport() {
      setLoading(true)
      const { data, error } = await api.get<ReportDetail>(`/api/reports/${reportId}`)
      
      if (error) {
        setError(error)
        setReport(null)
      } else {
        setReport(data)
        setError(null)
      }
      setLoading(false)
    }

    fetchReport()
  }, [reportId])

  return { report, loading, error }
}

/**
 * Hook to fetch health score for a report
 */
export function useHealthScore(reportId: string | null) {
  const [score, setScore] = useState<{
    score: number
    grade: string
    breakdown: { normal: number; abnormal: number; total: number }
    status: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) {
      setLoading(false)
      return
    }

    async function fetchScore() {
      setLoading(true)
      const { data } = await api.get(`/api/reports/${reportId}/health-score`)
      setScore(data || null)
      setLoading(false)
    }

    fetchScore()
  }, [reportId])

  return { score, loading }
}

/**
 * Hook to compare two reports
 */
export function useReportComparison(report1Id: string | null, report2Id: string | null) {
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = useCallback(async () => {
    if (!report1Id || !report2Id) return

    setLoading(true)
    const { data, error } = await api.get(
      `/api/reports/compare?report1=${report1Id}&report2=${report2Id}`
    )
    
    if (error) {
      setError(error)
      setComparison(null)
    } else {
      setComparison(data)
      setError(null)
    }
    setLoading(false)
  }, [report1Id, report2Id])

  useEffect(() => {
    if (report1Id && report2Id) {
      compare()
    }
  }, [compare, report1Id, report2Id])

  return { comparison, loading, error, refetch: compare }
}

/**
 * Create a new report
 */
export async function createReport(data: {
  title: string
  originalFileName: string
  fileUrl: string
  filePath?: string
  fileType: string
  familyMemberId?: string
}) {
  return api.post<Report>('/api/reports', data)
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string) {
  return api.delete(`/api/reports/${reportId}`)
}

/**
 * Create a share link for a report
 */
export async function shareReport(reportId: string, options?: { expiresIn?: string; maxViews?: number }) {
  return api.post(`/api/reports/${reportId}/share`, options || {})
}
