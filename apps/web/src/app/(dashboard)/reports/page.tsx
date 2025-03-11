'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Info, Plus, FileText, Trash2, CheckCircle, AlertCircle, RefreshCw, Loader2, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useFamilyMembers, initFamilyProfile } from '@/hooks/useFamilyMembers';
import { createReport } from '@/hooks/useReports';
import { useReportStatus } from '@/hooks/useReportStatus';
import { createClient } from '@/lib/supabase/client';
import { Tooltip } from '@/components/ui/tooltip';
import { API_URL } from '@/lib/api';
import type { ReportStatus } from '@/types';

interface FileWithProgress {
  id: string; // Unique ID for tracking
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  storagePath?: string; // Where it is in Supabase Storage
  publicUrl?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { members, loading: membersLoading, refetch } = useFamilyMembers();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);
  const { status: reportStatus, error: reportError } = useReportStatus(analyzingReportId, 'UPLOADED');

  // Quota and Modal state
  const [quotaReached, setQuotaReached] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{used: number, limit: number, resetDate: string} | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Monitor analysis status
  useEffect(() => {
    if (!analyzingReportId) return;

    if (reportError) {
       console.error("Report Status Error:", reportError);
       setProcessingStatus(`Error: ${reportError}. Please refresh.`);
       // Don't auto-reset yet, let user see error
    }

    const getStatusMessage = (status: ReportStatus) => {
      if (reportError) return `Connection Error: ${reportError}`;
      switch (status) {
        case 'UPLOADED': return 'Queued...';
        case 'OCR_PROCESSING': return 'Reading document...';
        case 'OCR_COMPLETE': return 'Document read complete...';
        case 'ANALYSIS_PROCESSING': return 'Analyzing health data...';
        case 'ANALYSIS_COMPLETE': return 'Health data analyzed...';
        case 'EMBEDDING_PROCESSING': return 'Indexing for search...';
        case 'READY': return 'Analysis Complete!';
        case 'FAILED': return 'Analysis Failed';
        default: return 'Processing...';
      }
    };

    setProcessingStatus(getStatusMessage(reportStatus));

    if (reportStatus === 'READY') {
      setTimeout(() => {
        router.push(`/reports/${analyzingReportId}`);
      }, 1000);
    } else if (reportStatus === 'FAILED') {
      setIsProcessing(false);
      setAnalyzingReportId(null);
      setErrorMessage('Report analysis failed. Please try again.');
      setShowErrorModal(true);
    }
  }, [reportStatus, analyzingReportId, router]);

  
  // Step-based flow: 1 = Upload, 2 = Fill Details, 3 = Processing
  const [currentStep, setCurrentStep] = useState(1);
  const [reportTitle, setReportTitle] = useState('');
  const [reportDate, setReportDate] = useState('');

  // Prevent infinite init loop
  const hasInitialized = useRef(false);

  const supabase = createClient();

  // Auto-init family profile and select default (only once)
  useEffect(() => {
    if (!membersLoading && members.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      initFamilyProfile().then(() => refetch());
    } else if (members.length > 0 && !selectedPatient) {
      const defaultMember = members.find(m => m.isDefault) || members[0];
      setSelectedPatient(defaultMember.id);
    }
  }, [membersLoading, members, selectedPatient, refetch]);

  // Check quota on mount
  useEffect(() => {
    async function checkQuota() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const res = await fetch(`${API_URL}/api/user/usage`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const used = data.usage?.monthlyUploadCount || 0;
          const limit = data.limit?.uploadLimit || 5;
          
          // Always set quota info for the counter display
          setQuotaInfo({
            used,
            limit,
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()
          });
          
          // Check if quota is reached
          if (used >= limit) {
            setQuotaReached(true);
            setShowQuotaModal(true);
          }
        }
      } catch (err) {
        console.error('Failed to check quota:', err);
      }
    }
    checkQuota();
  }, [supabase]);

  // Handle file uploads immediately when added
  useEffect(() => {
    const uploadPendingFiles = async () => {
      // Don't upload if quota is reached
      if (quotaReached) {
        // Remove any pending files and show modal
        const hasPending = uploadedFiles.some(f => f.status === 'pending');
        if (hasPending) {
          setUploadedFiles(prev => prev.filter(f => f.status !== 'pending'));
          setShowQuotaModal(true);
        }
        return;
      }

      const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
      
      if (pendingFiles.length === 0) return;

      // Get user for RLS policies (bucket requires user_id prefix)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      for (const fileItem of pendingFiles) {
        // Update status to uploading
        updateFileStatus(fileItem.id, 'uploading', 0);

        try {
          const fileExt = fileItem.file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          // RLS Policy requires: auth.uid() = (storage.foldername(name))[1]
          const filePath = `${user.id}/${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('medical-reports') // Must match setup.ts
            .upload(filePath, fileItem.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Get URL (Signed URL for private bucket, or public if public)
          // Since setup.ts creates it as private, we technically need a signed URL for viewing
          // But for the API processing, we'll pass the path.
          // We'll generate a signed URL for the temporary 'publicUrl' display if needed, 
          // or just use the public method which might return a URL that requires a token.
          // For now let's use getPublicUrl but rely on storagePath for the backend.
          const { data: { publicUrl } } = supabase.storage
            .from('medical-reports')
            .getPublicUrl(filePath);

          // Mark as completed
          setUploadedFiles(prev => prev.map(item => 
            item.id === fileItem.id 
              ? { ...item, status: 'completed', progress: 100, storagePath: filePath, publicUrl } 
              : item
          ));
        } catch (error: any) {
          console.error('Upload failed:', error);
          updateFileStatus(fileItem.id, 'error', 0, error.message || 'Upload failed');
        }
      }
    };

    if (uploadedFiles.some(f => f.status === 'pending')) {
      uploadPendingFiles();
    }
  }, [uploadedFiles, supabase]);

  const updateFileStatus = (id: string, status: FileWithProgress['status'], progress: number, errorMessage?: string) => {
    setUploadedFiles(prev => prev.map(item => 
      item.id === id ? { ...item, status, progress, errorMessage } : item
    ));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    // Block file selection if quota is reached
    if (quotaReached) {
      setShowQuotaModal(true);
      return;
    }
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const retryFile = (id: string) => {
    setUploadedFiles(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'pending', progress: 0, errorMessage: undefined } : item
    ));
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(item => item.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAnalysis = async () => {
    if (!selectedPatient || uploadedFiles.length === 0) return;
    
    // Filter strictly completed uploads
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    
    if (completedFiles.length === 0) {
      setErrorMessage('Please wait for files to finish uploading.');
      setShowErrorModal(true);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Creating reports...');

    try {
      let lastReportId: string | null = null;
      
      // Helper to convert MIME type to backend enum
      const getFileTypeEnum = (mimeType: string): 'PDF' | 'IMAGE' | 'TEXT' => {
        if (mimeType === 'application/pdf') return 'PDF';
        if (mimeType.startsWith('image/')) return 'IMAGE';
        return 'TEXT';
      };
      
      // Process each file - for single file use custom title, for multiple use file names
      for (const file of completedFiles) {
        if (!file.publicUrl) continue;

        const { data: report, error } = await createReport({
          title: completedFiles.length === 1 && reportTitle ? reportTitle : file.file.name.replace(/\.[^/.]+$/, ""),
          originalFileName: file.file.name,
          fileUrl: file.publicUrl,
          filePath: file.storagePath,
          fileType: getFileTypeEnum(file.file.type),
          familyMemberId: selectedPatient
        });
        
        if (error) {
          console.error('Failed to create report:', error);
          throw new Error(error);
        }
        
        if (report?.id) {
          lastReportId = report.id;
        }
      }
      
      // Start tracking progress
      if (lastReportId) {
        setAnalyzingReportId(lastReportId);
      } else {
        setIsProcessing(false);
        router.push('/dashboard');
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setErrorMessage('Failed to start analysis. Please try again.');
      setShowErrorModal(true);
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Title and Stepper Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black mb-2 dark:text-white">Upload Medical Report</h1>
          <p className="text-text-muted dark:text-gray-400">Our AI will process your documents and provide simplified insights.</p>
          
          {/* Quota Counter */}
          {quotaInfo && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              quotaReached 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : quotaInfo.used >= quotaInfo.limit - 1
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
            }`}>
              <span className="material-symbols-outlined text-base">upload_file</span>
              <span>
                {quotaReached 
                  ? `No uploads remaining (${quotaInfo.used}/${quotaInfo.limit})` 
                  : `${quotaInfo.limit - quotaInfo.used} of ${quotaInfo.limit} uploads remaining`
                }
              </span>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm font-bold">
          {/* Step 1: Upload */}
          <div className={`flex items-center gap-2 ${uploadedFiles.some(f => f.status === 'completed') ? 'text-green-500' : 'text-primary'}`}>
            <div className={`size-8 rounded-full flex items-center justify-center shadow-lg ${
              uploadedFiles.some(f => f.status === 'completed') 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-primary text-white shadow-primary/20'
            }`}>
              {uploadedFiles.some(f => f.status === 'completed') ? '✓' : '1'}
            </div>
            <span>Upload</span>
          </div>
          <div className={`w-12 h-0.5 ${uploadedFiles.some(f => f.status === 'completed') ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
          
          {/* Step 2: Details */}
          <div className={`flex items-center gap-2 ${uploadedFiles.some(f => f.status === 'completed') ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`size-8 rounded-full flex items-center justify-center ${
              uploadedFiles.some(f => f.status === 'completed') 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
            }`}>2</div>
            <span>Details</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
          
          {/* Step 3: Analyze */}
          <Tooltip content="We analyze your report using AI to generate insights">
            <div className={`flex items-center gap-2 ${reportStatus === 'READY' ? 'text-green-500' : analyzingReportId ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-all ${
                reportStatus === 'READY'
                  ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20' 
                  : analyzingReportId
                    ? 'border-primary text-primary animate-pulse'
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'
              }`}>
                {reportStatus === 'READY' ? '✓' : '3'}
              </div>
              <span>Analyze</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {reportError && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
          <AlertCircle className="size-5" />
          <p className="font-medium">
            Connection Error: {reportError}. Please try refreshing the page.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Uploader */}
          <Tooltip content={quotaReached ? "Upload limit reached" : "Drag & drop your medical reports here"}>
            <div 
              className={`bg-white dark:bg-gray-800 p-10 rounded-[2rem] border-2 border-dashed transition-all ${
                quotaReached || isProcessing
                  ? 'border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed'
                  : isDragOver 
                    ? 'border-primary bg-primary/5 cursor-pointer' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-primary cursor-pointer'
              }`}
              onDragOver={(e) => { 
                e.preventDefault(); 
                if (!quotaReached && !isProcessing) setIsDragOver(true); 
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (quotaReached) {
                  setShowQuotaModal(true);
                  return;
                }
                if (isProcessing) return;
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => {
                if (quotaReached) {
                  setShowQuotaModal(true);
                  return;
                }
                if (isProcessing) return;
                document.getElementById('file-input')?.click();
              }}
            >
              <input 
                id="file-input"
                type="file" 
                className="hidden" 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={quotaReached || isProcessing}
                onChange={(e) => {
                  if (quotaReached) {
                    setShowQuotaModal(true);
                    return;
                  }
                  handleFilesSelected(e.target.files);
                }}
              />
              <div className="flex flex-col items-center justify-center py-8">
                <div className={`size-20 rounded-full flex items-center justify-center mb-6 transition-all ${
                  quotaReached || isProcessing
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    : isDragOver 
                      ? 'bg-primary text-white scale-110' 
                      : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 dark:text-white">
                  {quotaReached ? 'Upload Limit Reached' : isProcessing ? 'Processing...' : 'Drop files here or click to browse'}
                </h3>
                <p className="text-text-muted dark:text-gray-400 text-sm">
                  {quotaReached ? 'You\'ve reached your monthly upload limit' : 'Supports PDF, JPG, PNG up to 50MB'}
                </p>
              </div>
            </div>
          </Tooltip>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-bold dark:text-white px-2">Files to Upload ({uploadedFiles.length})</h3>
              {uploadedFiles.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      item.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                      item.status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {item.status === 'completed' ? <CheckCircle className="size-6" /> : 
                       item.status === 'error' ? <AlertCircle className="size-6" /> :
                       <Loader2 className="size-6 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-sm dark:text-white truncate">{item.file.name}</p>
                        {item.status === 'error' ? (
                          <span className="text-xs font-bold text-red-500">Failed</span>
                        ) : (
                          <span className="text-xs font-bold text-text-muted">{item.status === 'completed' ? 'Ready' : `Uploading...`}</span>
                        )}
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'completed' ? 'bg-green-500' : 
                            item.status === 'error' ? 'bg-red-500' :
                            'bg-primary'
                          }`} 
                          style={{ width: item.status === 'uploading' ? '50%' : '100%' }} // Simple progress for now
                        ></div>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                        {formatSize(item.file.size)} • 
                        {item.status === 'completed' ? 'Ready for Analysis' : 
                         item.status === 'error' ? <span className="text-red-500 font-medium">{item.errorMessage || 'Upload failed'}</span> :
                         'Uploading to private cloud...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'error' && (
                      <button 
                        onClick={() => retryFile(item.id)}
                        className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                        title="Retry upload"
                      >
                        <RefreshCw className="size-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => removeFile(item.id)}
                      className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                      title="Remove file"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Details Form - Shows after files are uploaded */}
          {uploadedFiles.length > 0 && uploadedFiles.some(f => f.status === 'completed') && (
            <div className={`bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${isProcessing ? 'opacity-60' : ''}`}>
              <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Report Details
                {isProcessing && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-2">(Locked during analysis)</span>}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-bold mb-2 dark:text-white flex items-center gap-2">
                    Report Title
                    <Tooltip content="Name this report for easy identification">
                      <Info className="size-4 text-gray-400" />
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder={uploadedFiles[0]?.file.name.replace(/\.[^/.]+$/, "") || "Enter report title"}
                    disabled={isProcessing}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-main dark:text-white ${isProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                  <p className="text-xs text-text-muted mt-2">Give your report a descriptive name</p>
                </div>
                
                <div>
                  <label className="text-sm font-bold mb-2 dark:text-white flex items-center gap-2">
                    Report Date
                    <Tooltip content="The date shown on the medical report">
                      <Info className="size-4 text-gray-400" />
                    </Tooltip>
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    disabled={isProcessing}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-main dark:text-white ${isProcessing ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                  <p className="text-xs text-text-muted mt-2">When was this report generated?</p>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl flex gap-3 border border-amber-100 dark:border-amber-800/30">
                  <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Report details are locked while analysis is in progress.
                  </p>
                </div>
              )}

              {!isProcessing && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex gap-3 border border-blue-100 dark:border-blue-800/30">
                  <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    If left empty, our AI will extract the title and date from the document during analysis.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Patient & Info */}
        <div className="space-y-8">
          <div className={`bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 ${isProcessing ? 'opacity-60' : ''}`}>
            <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
              Patient Selection
              <Tooltip content="Select who this report belongs to">
                <Info className="size-4 text-gray-400" />
              </Tooltip>
              {isProcessing && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 ml-2">(Locked)</span>}
            </h3>
            
            <div className={`space-y-4 mb-8 ${isProcessing ? 'pointer-events-none' : ''}`}>
              {membersLoading ? (
                // Loading skeleton
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                members.map((member) => (
                  <label 
                    key={member.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isProcessing 
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer'
                    } ${selectedPatient === member.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  >
                    <div 
                      className="size-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: member.avatarColor || '#3B82F6' }}
                    >
                      <span className="material-symbols-outlined">
                        {member.relationship === 'child' ? 'face_3' : 
                         member.relationship === 'parent' ? 'elderly' : 'person'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold dark:text-white">{member.name}</p>
                      <p className="text-xs text-text-muted capitalize">{member.relationship}</p>
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selectedPatient === member.id ? 'border-primary' : 'border-gray-300'}`}>
                      {selectedPatient === member.id && <div className="size-2.5 rounded-full bg-primary"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name="patient" 
                      className="hidden" 
                      onChange={() => !isProcessing && setSelectedPatient(member.id)} 
                      checked={selectedPatient === member.id}
                      disabled={isProcessing}
                    />
                  </label>
                ))
              )}
            </div>

            <Link href="/family" className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
              <Plus className="size-5" />
              Add Family Member
            </Link>
          </div>

          <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl flex gap-4">
            <Info className="size-6 text-primary shrink-0" />
            <div>
              <h4 className="font-bold text-primary mb-1">Privacy Guarantee</h4>
              <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                Your medical data is encrypted end-to-end and HIPAA compliant. Only you and your chosen providers can access these files.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-12 flex justify-end items-center gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link 
          href="/dashboard"
          className="px-6 py-3 font-bold text-text-muted hover:text-text-main dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          Cancel
        </Link>
        <button 
          onClick={handleAnalysis}
          disabled={isProcessing || uploadedFiles.length === 0 || uploadedFiles.some(f => f.status === 'uploading' || f.status === 'error')}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {processingStatus}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">auto_awesome</span>
              Start AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Quota Limit Modal */}
      {showQuotaModal && quotaInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowQuotaModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 text-center shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQuotaModal(false)}
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
            <button
              onClick={() => setShowQuotaModal(false)}
              className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowErrorModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 text-center shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="size-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something Went Wrong</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
