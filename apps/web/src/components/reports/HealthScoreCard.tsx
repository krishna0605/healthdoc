'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface HealthScoreData {
  score: number
  grade: string
  breakdown: {
    normal: number
    abnormal: number
    total: number
  }
  status: string
}

interface HealthScoreCardProps {
  reportId: string
}

export function HealthScoreCard({ reportId }: HealthScoreCardProps) {
  const [data, setData] = useState<HealthScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchScore() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/${reportId}/health-score`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }
        )

        if (response.ok) {
          const result = await response.json()
          setData(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch health score:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScore()
  }, [reportId, supabase])

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBg = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500'
      case 'B': return 'bg-blue-500'
      case 'C': return 'bg-yellow-500'
      default: return 'bg-red-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'fair': return <Minus className="w-5 h-5 text-yellow-500" />
      default: return <TrendingDown className="w-5 h-5 text-red-500" />
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Health Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(data.score)}`}>
                {data.score}
              </span>
              <span className="text-gray-500 text-lg">/100</span>
            </div>
          </div>
          
          <div className={`w-14 h-14 rounded-full ${getGradeBg(data.grade)} flex items-center justify-center shadow-lg`}>
            <span className="text-2xl font-bold text-white">{data.grade}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getGradeBg(data.grade)} transition-all duration-500`}
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>
          {getStatusIcon(data.status)}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-white/50 rounded-lg p-2">
            <p className="font-semibold text-green-600">{data.breakdown.normal}</p>
            <p className="text-gray-500 text-xs">Normal</p>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <p className="font-semibold text-orange-600">{data.breakdown.abnormal}</p>
            <p className="text-gray-500 text-xs">Abnormal</p>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <p className="font-semibold text-gray-600">{data.breakdown.total}</p>
            <p className="text-gray-500 text-xs">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
