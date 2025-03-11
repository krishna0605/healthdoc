'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2, CheckCircle, Users, ArrowUpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { API_URL } from '@/lib/api' 
import { useFamilyContext } from '@/components/family'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

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
  const [analysisStarted, setAnalysisStarted] = useState(false)
  
  // Quota state
  const [quotaReached, setQuotaReached] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<{used: number, limit: number, resetDate: string} | null>(null)
  const [checkingQuota, setCheckingQuota] = useState(true)
  const [showQuotaPopup, setShowQuotaPopup] = useState(false)

  const { user } = useAuth()
  
  // Check quota on mount
  React.useEffect(() => {
    async function checkQuota() {
      if (!user) {
        setCheckingQuota(false)
        return
      }
      try {
        setCheckingQuota(true)
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const res = await fetch(`${API_URL}/api/user/usage`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          
          if (res.ok) {
            const data = await res.json()
            if (data.usage?.monthlyUploadCount >= data.limit?.uploadLimit) {
              setQuotaReached(true)
              setShowQuotaPopup(true)
              setQuotaInfo({
                used: data.usage.monthlyUploadCount,
                limit: data.limit.uploadLimit,
                resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to check quota:', err)
      } finally {
        setCheckingQuota(false)
      }
    }
    
    checkQuota()
  }, [user])

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
    disabled: analysisStarted || quotaReached,
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
    if (!file || !user) return

    setAnalysisStarted(true)
    setUploadState('uploading')
    setProgress(0)

    try {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const user = session.user
      
      // 1. Upload to Storage
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
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Monthly upload quota reached.')
        }
        let errorMessage = `API Error: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
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

      setTimeout(() => {
        setFile(null)
        setUploadState('idle')
        setProgress(0)
        setAnalysisStarted(false)
      }, 2000)

    } catch (err: any) {
      console.error('Upload error details:', err)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Is the API server running on port 3001?')
      } else {
        setError(err.message || 'Failed to upload file')
      }
      setUploadState('error')
      setAnalysisStarted(false)
    }
  }

  const handleRemove = () => {
    if (analysisStarted) return // Cannot remove if started
    setFile(null)
    setUploadState('idle')
    setError(null)
    setAnalysisStarted(false)
  }

  if (checkingQuota) {
    return (
       <div className={cn("flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem]", className)}>
         <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
         <p className="text-gray-500">Checking quota...</p>
       </div>
    )
  }


  return (
    <div className={cn('w-full relative', className)}>
      {/* Quota Limit Modal Popup */}
      <AnimatePresence>
        {showQuotaPopup && quotaInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowQuotaPopup(false)}
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 text-center shadow-2xl max-w-md w-full"
            >
              {/* Close button */}
              <button
                onClick={() => setShowQuotaPopup(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="size-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Monthly Upload Limit Reached</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You've used all <span className="font-bold text-gray-900 dark:text-white">{quotaInfo.limit} free uploads</span> this month. 
                Your quota will reset on <span className="font-bold text-primary">{quotaInfo.resetDate}</span>.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 mb-6">
                Usage: {quotaInfo.used}/{quotaInfo.limit}
              </div>
              <Button
                onClick={() => setShowQuotaPopup(false)}
                variant="outline"
                className="w-full rounded-xl"
              >
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        {...getRootProps()}
        className={cn(
          'relative overflow-hidden rounded-[2rem] border-2 border-dashed p-10 transition-all duration-300 cursor-pointer h-72 flex flex-col items-center justify-center group',
          isDragActive
            ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(14,165,233,0.15)] scale-[1.01]'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.005]',
          file && 'border-solid border-primary/20 bg-primary/5',
          quotaReached && 'opacity-50 pointer-events-none'
        )}
      >
        <input {...getInputProps()} />
        
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              <div className={cn(
                'rounded-3xl p-6 transition-all duration-500 shadow-lg',
                isDragActive 
                  ? 'bg-primary text-white scale-110 shadow-primary/30 rotate-3' 
                  : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 shadow-gray-200/50 dark:shadow-none group-hover:scale-110 group-hover:rotate-3'
              )}>
                <ArrowUpCircle className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                  {isDragActive ? 'Drop it like it\'s hot!' : 'Click or Drag to Upload'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Support for PDF, JPG, or PNG. Maximum file size is 10MB.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md relative z-10"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-4 shrink-0">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate text-lg pr-8">{file.name}</p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {uploadState === 'idle' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove()
                    }}
                    className="absolute -top-2 -right-2 bg-red-50 dark:bg-red-900/30 text-red-500 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {uploadState === 'success' && (
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress & Actions */}
      <AnimatePresence>
        {(uploadState === 'uploading' || error || (file && uploadState === 'idle')) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Progress bar */}
            {uploadState === 'uploading' && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                  <span className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Document...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-3"
              >
                <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full shrink-0">
                  <X className="w-4 h-4" />
                </div>
                {error}
              </motion.div>
            )}

            {/* Upload form */}
            {file && (uploadState === 'idle' || uploadState === 'uploading') && (
              <div className="mt-6 space-y-4">
                {/* Family Member Selector */}
                {members.length > 0 && (
                  <div className={cn(
                    "flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-opacity",
                    analysisStarted && "opacity-60 pointer-events-none"
                  )}>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
                       <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Analyze for</p>
                      <select
                        value={selectedMemberId || activeMember?.id || ''}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        disabled={analysisStarted}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-800 dark:text-white focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
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
                  className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
                  size="lg"
                  disabled={analysisStarted}
                >
                  {analysisStarted ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload & Start Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
