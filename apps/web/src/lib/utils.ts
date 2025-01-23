import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get status color based on metric status
 */
export function getMetricStatusColor(status: string): string {
  switch (status) {
    case 'NORMAL':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'LOW':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'CRITICAL_LOW':
    case 'CRITICAL_HIGH':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Get severity color based on severity level
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'BORDERLINE':
      return 'text-amber-600 bg-amber-50'
    case 'MODERATE':
      return 'text-orange-600 bg-orange-50'
    case 'CRITICAL':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get report status color and label
 */
export function getReportStatusInfo(status: string): { color: string; label: string } {
  switch (status) {
    case 'UPLOADED':
      return { color: 'bg-blue-100 text-blue-800', label: 'Uploaded' }
    case 'OCR_PROCESSING':
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Extracting Text...' }
    case 'OCR_COMPLETE':
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Text Extracted' }
    case 'ANALYSIS_PROCESSING':
      return { color: 'bg-purple-100 text-purple-800', label: 'Analyzing...' }
    case 'ANALYSIS_COMPLETE':
      return { color: 'bg-purple-100 text-purple-800', label: 'Analysis Complete' }
    case 'EMBEDDING_PROCESSING':
      return { color: 'bg-indigo-100 text-indigo-800', label: 'Preparing Q&A...' }
    case 'READY':
      return { color: 'bg-green-100 text-green-800', label: 'Ready' }
    case 'FAILED':
      return { color: 'bg-red-100 text-red-800', label: 'Failed' }
    default:
      return { color: 'bg-gray-100 text-gray-800', label: status }
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
