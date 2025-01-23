'use client'

import React from 'react'
import { FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ReportCard } from './ReportCard'
import type { Report } from '@/types'

interface ReportsListProps {
  reports: Report[]
}

export function ReportsList({ reports }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <Card variant="default" className="p-12 text-center">
        <div className="text-gray-400 mb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <FileText className="h-8 w-8 text-gray-300" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No reports yet</h3>
        <p className="text-gray-500 mt-1">
          Upload your first medical report using the form above.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  )
}
