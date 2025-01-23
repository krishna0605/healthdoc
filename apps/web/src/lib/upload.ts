import { createClient } from '@/lib/supabase/client'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain']

export interface UploadResult {
  path: string
  url: string
  originalName: string
  type: 'PDF' | 'IMAGE' | 'TEXT'
  size: number
}

export async function uploadReport(file: File, userId: string): Promise<UploadResult> {
  // Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, PNG, JPG, and TXT are allowed.')
  }

  const supabase = createClient()
  
  // Create unique file path: userId/timestamp-filename
  const timestamp = Date.now()
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${userId}/${timestamp}-${cleanName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('medical-reports')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload file to storage')
  }

  // Get Public URL (since bucket is private, we might need signed URL for download, 
  // but for processing we use internal access. 
  // If we want to display it, we need signed URL.
  // Ideally, store the PATH, generate signed URL on demand.
  // But for simple access if bucket was public...
  // Since bucket is private, `getPublicUrl` returns a URL but it won't work without token? 
  // Actually getPublicUrl returns the potential public URL.
  // We should return the path so API can use it.
  
  return {
    path: data.path,
    url: '', // We verify this later or generate signed URL
    originalName: file.name,
    type: getFileType(file.type),
    size: file.size
  }
}

function getFileType(mimeType: string): 'PDF' | 'IMAGE' | 'TEXT' {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.startsWith('image/')) return 'IMAGE'
  return 'TEXT'
}
