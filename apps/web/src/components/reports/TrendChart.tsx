'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { TrendingUp, Calendar, AlertCircle, Loader2 } from 'lucide-react'

interface TrendData {
  date: string
  reportId: string
  title: string
  [key: string]: any
}

interface TrendChartProps {
  selectedMetric?: string
}

// Color palette for different metrics
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

export function TrendChart({ selectedMetric }: TrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [metrics, setMetrics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMetric, setActiveMetric] = useState<string | null>(selectedMetric || null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTrends() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Please log in to view trends')
          return
        }

        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/trends`)
        if (selectedMetric) {
          url.searchParams.set('metric', selectedMetric)
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch trends')
        }

        const result = await response.json()
        setTrendData(result.data.trends)
        setMetrics(result.data.metrics)
        
        // Auto-select first metric if none selected
        if (!activeMetric && result.data.metrics.length > 0) {
          setActiveMetric(result.data.metrics[0])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [selectedMetric, supabase])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span>Loading trend data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex items-center justify-center py-12 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </CardContent>
      </Card>
    )
  }

  if (trendData.length < 2) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not Enough Data</h3>
          <p className="text-gray-500">
            Upload at least 2 reports to see trends over time.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Format data for chart - convert dates
  const chartData = trendData.map(d => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Health Metrics Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {metrics.slice(0, 10).map((metric, i) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeMetric === metric
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  const unit = (chartData[0] as any)?.[`${name}_unit`] || ''
                  return [`${value} ${unit}`, name]
                }}
              />
              <Legend />
              {activeMetric ? (
                <Line
                  key={activeMetric}
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[0], strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ) : (
                metrics.slice(0, 3).map((metric, i) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[i % COLORS.length] }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        {activeMetric && chartData.length >= 2 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{activeMetric} Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">First Reading:</span>
                <p className="font-semibold">
                  {(chartData[0] as any)?.[activeMetric]} {(chartData[0] as any)?.[`${activeMetric}_unit`]}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Latest Reading:</span>
                <p className="font-semibold">
                  {(chartData[chartData.length - 1] as any)?.[activeMetric]} {(chartData[chartData.length - 1] as any)?.[`${activeMetric}_unit`]}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Change:</span>
                {(() => {
                  const first = (chartData[0] as any)?.[activeMetric]
                  const last = (chartData[chartData.length - 1] as any)?.[activeMetric]
                  if (first && last) {
                    const change = ((last - first) / first * 100).toFixed(1)
                    const isPositive = parseFloat(change) > 0
                    return (
                      <p className={`font-semibold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
                        {isPositive ? '+' : ''}{change}%
                      </p>
                    )
                  }
                  return <p className="text-gray-500">N/A</p>
                })()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
