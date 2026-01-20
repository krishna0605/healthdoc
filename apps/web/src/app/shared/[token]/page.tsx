'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Calendar, ShieldCheck, Activity, Brain } from 'lucide-react'
import { MetricsTable } from '@/components/reports'

interface SharedReportData {
  title: string
  date: string
  metrics: any[]
  summary: any
  chatHistory?: any[]
  expiresAt: string
}

export default function SharedReportPage() {
  const { token } = useParams()
  const [data, setData] = useState<SharedReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/shared/${token}`
        )

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to load report')
        }

        const result = await response.json()
        setData(result.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchReport()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-pulse space-y-4 w-full max-w-3xl">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="py-8 text-center text-red-800">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Secure Link Banner */}
        <div className="flex items-center justify-center gap-2 text-sm text-blue-700 bg-blue-50 py-2 rounded-lg border border-blue-100">
          <ShieldCheck className="w-4 h-4" />
          Securely shared via HealthDoc
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                {new Date(data.date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              Link expires<br />
              {new Date(data.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        {data.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Brain className="w-5 h-5" />
                Clinical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50/50 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">Patient Summary</h3>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {data.summary.patientSummary}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Findings</h3>
                <ul className="space-y-2">
                  {Array.isArray(data.summary.keyFindings) && data.summary.keyFindings.slice(0, 4).map((finding: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsTable metrics={data.metrics} />
          </CardContent>
        </Card>

        {/* Chat History Section */}
        {data.chatHistory && data.chatHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">forum</span>
                Q&A History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto bg-gray-50/50 p-6 rounded-b-xl">
              {data.chatHistory.map((message: any, i: number) => (
                <div
                  key={i}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'
                  }`}>
                    <span className="material-symbols-outlined text-sm">
                      {message.role === 'user' ? 'person' : 'smart_toy'}
                    </span>
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100/20">
                        <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider">Sources:</p>
                        {message.sources.map((source: any, j: number) => (
                          <p key={j} className="text-[10px] opacity-70 truncate">
                            • {source.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-gray-400 text-sm py-4">
          Powered by HealthDoc AI
        </div>
      </div>
    </div>
  )
}
