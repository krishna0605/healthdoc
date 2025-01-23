'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lightbulb, Utensils, Dumbbell, Heart, Stethoscope } from 'lucide-react'

interface Recommendation {
  title: string
  description: string
  category: string
  icon: string
}

interface RecommendationsCardProps {
  reportId: string
}

const categoryIcons: Record<string, React.ReactNode> = {
  diet: <Utensils className="w-5 h-5 text-orange-500" />,
  exercise: <Dumbbell className="w-5 h-5 text-green-500" />,
  lifestyle: <Heart className="w-5 h-5 text-pink-500" />,
  medical: <Stethoscope className="w-5 h-5 text-blue-500" />,
  health: <Heart className="w-5 h-5 text-red-500" />
}

const categoryColors: Record<string, string> = {
  diet: 'bg-orange-50 border-orange-200',
  exercise: 'bg-green-50 border-green-200',
  lifestyle: 'bg-pink-50 border-pink-200',
  medical: 'bg-blue-50 border-blue-200',
  health: 'bg-red-50 border-red-200'
}

export function RecommendationsCard({ reportId }: RecommendationsCardProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/${reportId}/recommendations`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }
        )

        if (response.ok) {
          const result = await response.json()
          setRecommendations(result.data?.recommendations || [])
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [reportId, supabase])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Generating recommendations...</span>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          AI Health Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, i) => (
          <div 
            key={i}
            className={`p-4 rounded-lg border ${categoryColors[rec.category] || 'bg-gray-50 border-gray-200'}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {rec.icon ? (
                  <span className="text-2xl">{rec.icon}</span>
                ) : (
                  categoryIcons[rec.category] || <Lightbulb className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{rec.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                <span className="inline-block mt-2 text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full capitalize">
                  {rec.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
