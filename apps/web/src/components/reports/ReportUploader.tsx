'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2, CheckCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { API_URL } from '@/lib/api' 
import { useFamilyContext } from '@/components/family'

interface ReportUploaderProps {
  onUploadComplete?: (reportId: string) => void
  className?: string
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export function ReportUploader({ onUploadComplete, className }: ReportUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { members, activeMember } = useFamilyContext()
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (rejections) => {
      const rejection = rejections[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload PDF, PNG, or JPG files.')
      } else {
        setError('Failed to upload file. Please try again.')
      }
    },
  })

  const handleUpload = async () => {
    if (!file) return

    setUploadState('uploading')
    setProgress(0)

    try {
      const supabase = createClient()
      
      // Get session for API token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const user = session.user
      
      // 1. Upload to Storage
      // Dynamic import to avoid SSR issues if any, though "use client" handles it
      const { uploadReport } = await import('@/lib/upload')
      
      setProgress(20)
      const uploadResult = await uploadReport(file, user.id)
      setProgress(60)

      // 2. Call API to create record
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          originalFileName: uploadResult.originalName,
          fileUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/medical-reports/${uploadResult.path}`,
          fileType: uploadResult.type,
          filePath: uploadResult.path,
          fileSize: uploadResult.size,
          familyMemberId: selectedMemberId || activeMember?.id || null
        })
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Response might not be JSON
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const { data: report } = await response.json()
      
      setProgress(100)
      setUploadState('success')
      
      if (onUploadComplete) {
        onUploadComplete(report.id)
      }

      // Reset after success
      setTimeout(() => {
        setFile(null)
        setUploadState('idle')
        setProgress(0)
      }, 2000)

    } catch (err: any) {
      console.error('Upload error details:', err)
      // Check for network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Is the API server running on port 3001?')
      } else {
        setError(err.message || 'Failed to upload file')
      }
      setUploadState('error')
    }
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    setUploadState('idle')
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer',
          'bg-gradient-to-br from-gray-50 to-white',
          isDragActive
            ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50',
          file && 'border-solid border-blue-500 bg-blue-50/30'
        )}
      >
        <input {...getInputProps()} />
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,transparent,black)]" />
        
        <div className="relative flex flex-col items-center justify-center gap-4 text-center">
          {!file ? (
            <>
              <div className={cn(
                'rounded-2xl p-4 transition-all duration-300',
                isDragActive 
                  ? 'bg-blue-100 text-blue-600 scale-110' 
                  : 'bg-gray-100 text-gray-500'
              )}>
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop your file here' : 'Upload Medical Report'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Drag and drop or click to select • PDF, PNG, JPG up to 10MB
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {uploadState === 'idle' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {uploadState === 'success' && (
                <CheckCircle className="ml-auto h-6 w-6 text-green-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {uploadState === 'uploading' && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Upload button */}
      {file && uploadState === 'idle' && (
        <div className="mt-4 space-y-3">
          {/* Family Member Selector */}
          {members.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Upload for:</p>
                <select
                  value={selectedMemberId || activeMember?.id || ''}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relationship})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleUpload}
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4" />
            Upload & Analyze Report
          </Button>
        </div>
      )}
    </div>
  )
}
