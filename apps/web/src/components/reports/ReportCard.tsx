'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, getReportStatusInfo } from '@/lib/utils'
import { useReportStatus } from '@/hooks'
import type { Report, ReportStatus } from '@/types'

interface ReportCardProps {
  report: Report
  className?: string
}

export function ReportCard({ report, className }: ReportCardProps) {
  const { status } = useReportStatus(report.id, report.status as ReportStatus)
  const statusInfo = getReportStatusInfo(status)

  const isProcessing = !['READY', 'FAILED'].includes(status)

  return (
    <Link href={`/reports/${report.id}`}>
      <Card
        variant="elevated"
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:scale-[1.02] hover:-translate-y-1',
          className
        )}
      >
        {/* Processing animation overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}

        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* File icon */}
            <div className={cn(
              'flex-shrink-0 rounded-xl p-3 transition-colors',
              status === 'READY' 
                ? 'bg-green-100 text-green-600' 
                : status === 'FAILED'
                ? 'bg-red-100 text-red-600'
                : 'bg-blue-100 text-blue-600'
            )}>
              <FileText className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h3>
                <div className="flex gap-2">
                  {(report.analysis as any)?.reportType && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {(report.analysis as any).reportType.replace('_', ' ')}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      status === 'READY'
                        ? 'success'
                        : status === 'FAILED'
                        ? 'destructive'
                        : 'processing'
                    }
                    pulse={isProcessing}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>

              <p className="mt-1 text-sm text-gray-500 truncate">
                {report.originalFileName}
              </p>

              {/* Tags */}
              {(report.analysis as any)?.tags && (report.analysis as any).tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(report.analysis as any).tags.slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                      {tag}
                    </span>
                  ))}
                  {(report.analysis as any).tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 text-xs border border-gray-100">
                      +{(report.analysis as any).tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(report.createdAt)}
                </span>
                {(report as any).familyMember && (
                  <span 
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                    style={{ 
                      backgroundColor: (report as any).familyMember.avatarColor + '20',
                      color: (report as any).familyMember.avatarColor
                    }}
                  >
                    <span 
                      className="w-3 h-3 rounded-full text-[8px] flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: (report as any).familyMember.avatarColor }}
                    >
                      {(report as any).familyMember.name.charAt(0)}
                    </span>
                    {(report as any).familyMember.name}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
