'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import type { Report, Analysis, Metric } from '@/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ExportPDFProps {
  report: Report
  analysis: Analysis | null
  metrics: Metric[]
  chatMessages?: ChatMessage[]
}

export function ExportPDF({ report, analysis, metrics, chatMessages = [] }: ExportPDFProps) {
  const [loading, setLoading] = useState(false)

  const generatePDF = async () => {
    setLoading(true)
    
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let y = 20
      
      // Helper function for text wrapping
      const addWrappedText = (text: string, x: number, maxWidth: number, lineHeight: number = 6) => {
        const lines = doc.splitTextToSize(text, maxWidth)
        lines.forEach((line: string) => {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          doc.text(line, x, y)
          y += lineHeight
        })
      }
      
      // === HEADER ===
      // Use HealthDoc primary color
      doc.setFillColor(46, 124, 158) // #2e7c9e
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('HealthDoc Analysis Report', margin, 22)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 30)
      
      y = 50
      doc.setTextColor(0, 0, 0)
      
      // === REPORT INFO ===
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Report Information', margin, y)
      y += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Title: ${report.title}`, margin, y)
      y += 6
      doc.text(`File: ${report.originalFileName}`, margin, y)
      y += 6
      doc.text(`Type: ${report.fileType}`, margin, y)
      y += 6
      doc.text(`Uploaded: ${new Date(report.createdAt).toLocaleDateString()}`, margin, y)
      y += 15
      
      // === ANALYSIS SUMMARY ===
      if (analysis) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Analysis Summary', margin, y)
        y += 10
        
        // Patient Summary
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Patient Summary:', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        addWrappedText(analysis.patientSummary || 'No summary available', margin, pageWidth - (margin * 2))
        y += 5
        
        // Clinical Summary
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Clinical Summary:', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        addWrappedText(analysis.clinicalSummary || 'No summary available', margin, pageWidth - (margin * 2))
        y += 5
        
        // Key Findings
        if (analysis.keyFindings && analysis.keyFindings.length > 0) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text('Key Findings:', margin, y)
          y += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          analysis.keyFindings.forEach((finding) => {
            addWrappedText(`• ${finding}`, margin, pageWidth - (margin * 2))
          })
        }
        y += 10
      }
      
      // === HEALTH METRICS ===
      if (metrics.length > 0) {
        if (y > 200) {
          doc.addPage()
          y = 20
        }
        
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Health Metrics', margin, y)
        y += 10
        
        // Table header
        doc.setFillColor(240, 240, 240)
        doc.rect(margin, y - 5, pageWidth - (margin * 2), 8, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Metric', margin + 2, y)
        doc.text('Value', margin + 70, y)
        doc.text('Unit', margin + 100, y)
        doc.text('Status', margin + 130, y)
        y += 8
        
        doc.setFont('helvetica', 'normal')
        metrics.forEach((metric, i) => {
          if (y > 270) {
            doc.addPage()
            y = 20
          }
          
          // Alternating row background
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(margin, y - 4, pageWidth - (margin * 2), 7, 'F')
          }
          
          doc.text(metric.name.substring(0, 25), margin + 2, y)
          doc.text(String(metric.value), margin + 70, y)
          doc.text(metric.unit, margin + 100, y)
          
          // Status with color
          const statusColors: Record<string, number[]> = {
            NORMAL: [34, 197, 94],
            HIGH: [249, 115, 22],
            LOW: [234, 179, 8],
            CRITICAL_HIGH: [239, 68, 68],
            CRITICAL_LOW: [239, 68, 68]
          }
          const color = statusColors[metric.status] || [100, 100, 100]
          doc.setTextColor(color[0], color[1], color[2])
          doc.text(metric.status, margin + 130, y)
          doc.setTextColor(0, 0, 0)
          
          y += 7
        })
        y += 10
      }
      
      // === CHAT CONVERSATION ===
      if (chatMessages.length > 0) {
        if (y > 200) {
          doc.addPage()
          y = 20
        }
        
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('AI Chat Conversation', margin, y)
        y += 10
        
        doc.setFontSize(10)
        chatMessages.forEach((msg) => {
          if (y > 260) {
            doc.addPage()
            y = 20
          }
          
          // Role label
          doc.setFont('helvetica', 'bold')
          if (msg.role === 'user') {
            doc.setTextColor(46, 124, 158) // Primary color
            doc.text('You:', margin, y)
          } else {
            doc.setTextColor(16, 185, 129)
            doc.text('AI Assistant:', margin, y)
          }
          y += 5
          
          // Message content
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0)
          addWrappedText(msg.content, margin + 5, pageWidth - (margin * 2) - 5)
          y += 5
        })
      }
      
      // === FOOTER ===
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${i} of ${pageCount} | HealthDoc - Your Health, Translated`,
          pageWidth / 2,
          290,
          { align: 'center' }
        )
      }
      
      // Save the PDF
      const fileName = `HealthDoc_${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="size-4" />
          Export PDF
        </>
      )}
    </button>
  )
}
