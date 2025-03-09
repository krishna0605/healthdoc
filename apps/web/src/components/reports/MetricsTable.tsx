'use client'

import React from 'react'
import { cn, getMetricStatusColor, capitalize } from '@/lib/utils'
import type { Metric } from '@/types'

interface MetricsTableProps {
  metrics: Metric[]
  className?: string
}

export function MetricsTable({ metrics, className }: MetricsTableProps) {
  // Group metrics by category
  const groupedMetrics = metrics.reduce((acc, metric) => {
    const category = metric.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(metric)
    return acc
  }, {} as Record<string, Metric[]>)

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {category}
          </h4>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Metric
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Value
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Normal Range
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categoryMetrics.map((metric, i) => (
                  <tr
                    key={metric.id ? `${metric.id}-${i}` : i}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {capitalize(metric.name.replace(/_/g, ' '))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-semibold text-gray-900">
                        {metric.value}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        {metric.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-sm">
                      {metric.standardRange || metric.standard_range || 
                       (metric.normalRangeLow && metric.normalRangeHigh
                        ? `${metric.normalRangeLow} - ${metric.normalRangeHigh}`
                        : '-')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                          getMetricStatusColor(metric.status)
                        )}
                      >
                        {metric.status === 'NORMAL' && '✓ '}
                        {metric.status === 'CRITICAL_HIGH' && '⚠ '}
                        {metric.status === 'CRITICAL_LOW' && '⚠ '}
                        {capitalize(metric.status.replace(/_/g, ' '))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
