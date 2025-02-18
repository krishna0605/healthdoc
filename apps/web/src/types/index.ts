// ============================================
// REPORT TYPES
// ============================================

export type FileType = 'PDF' | 'IMAGE' | 'TEXT'

export type ReportStatus =
  | 'UPLOADED'
  | 'OCR_PROCESSING'
  | 'OCR_COMPLETE'
  | 'ANALYSIS_PROCESSING'
  | 'ANALYSIS_COMPLETE'
  | 'EMBEDDING_PROCESSING'
  | 'READY'
  | 'FAILED'

export interface Report {
  id: string
  userId: string
  title: string
  originalFileName: string
  fileUrl: string
  fileType: FileType
  status: ReportStatus
  extractedText?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
  analysis?: Analysis
}

// ============================================
// ANALYSIS TYPES
// ============================================

export type MetricStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH'

export type SeverityLevel = 'BORDERLINE' | 'MODERATE' | 'CRITICAL'

export interface Metric {
  id: string
  reportId: string
  name: string
  value: number
  unit: string
  normalRangeLow?: number
  normalRangeHigh?: number
  status: MetricStatus
  category?: string
  extractedText?: string
  createdAt: string
}

export interface Abnormality {
  id: string
  analysisId: string
  metricName: string
  severity: SeverityLevel
  description: string
  clinicalContext?: string
  relatedMetrics: string[]
  confidenceScore?: number
  createdAt: string
}

export interface RiskIndicator {
  id: string
  analysisId: string
  riskType: string
  score: number
  explanation: string
  contributingMetrics: string[]
  createdAt: string
}

export interface Analysis {
  id: string
  reportId: string
  patientSummary: string
  clinicalSummary: string
  keyFindings: string[]
  abnormalityCount: number
  overallRiskScore?: number
  confidenceScore?: number
  reportType: 'LAB_REPORT' | 'PRESCRIPTION' | 'RADIOLOGY' | 'PATHOLOGY' | 'OTHER'
  tags: string[]
  predictions: string[]
  createdAt: string
  abnormalities: Abnormality[]
  riskIndicators: RiskIndicator[]
}

export type ReportType = 'LAB_REPORT' | 'PRESCRIPTION' | 'RADIOLOGY' | 'PATHOLOGY' | 'OTHER'

// ============================================
// REPORT WITH ANALYSIS (FULL)
// ============================================

export interface ReportWithAnalysis extends Report {
  analysis?: Analysis
  metrics: Metric[]
}

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'PATIENT' | 'ADMIN' | 'AUDITOR'

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

// ============================================
// CONVERSATION / RAG TYPES
// ============================================

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  sources?: Array<{
    chunkText: string
    chunkIndex: number
  }>
  createdAt: string
}

export interface Conversation {
  id: string
  reportId?: string
  userId: string
  createdAt: string
  messages: Message[]
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
