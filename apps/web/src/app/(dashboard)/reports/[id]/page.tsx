'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, Stethoscope, Share2, Copy, Check, X, User, Building2, ClipboardList, Loader2, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ReportChat, ChatMessage } from '@/components/reports/ReportChat';
import { useReport } from '@/hooks/useReports';
import { useAuth } from '@/hooks';

// Score Bar Component
const ScoreBar = ({ label, status, color, width, statusColor }: { label: string; status: string; color: string; width: string; statusColor: string }) => (
  <div>
     <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-sm dark:text-white">{label}</span>
        <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
     </div>
     <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width }}></div>
     </div>
  </div>
);

// Metric Row Component
interface MetricRowProps {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'high' | 'low';
  range?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ name, value, unit, status, range }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
    <td className="py-4 px-6 font-bold dark:text-white">{name}</td>
    <td className="py-4 px-6 font-mono text-sm">{value} <span className="text-text-muted text-xs">{unit}</span></td>
    <td className="py-4 px-6 text-text-muted text-sm">{range || '-'}</td>
    <td className="py-4 px-6 text-right">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
        status === 'normal' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
        status === 'high' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
        'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      }`}>
        {status}
      </span>
    </td>
  </tr>
);

// Share Modal Component
const ShareModal = ({ isOpen, onClose, reportId }: { isOpen: boolean; onClose: () => void; reportId: string }) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate share link when modal opens
  useEffect(() => {
    if (isOpen && !shareLink) {
      generateShareLink();
    }
  }, [isOpen]);

  const generateShareLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const { shareReport } = await import('@/hooks/useReports');
      const result = await shareReport(reportId, { expiresIn: '7d', maxViews: 3 });
      if (result.data?.token) {
        setShareLink(`${window.location.origin}/shared/${result.data.token}`);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-text-main/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-black dark:text-white">Share Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-text-main dark:hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-8">
          <p className="text-sm text-text-muted dark:text-gray-400 mb-6">
            Create a secure, one-time link to share this report with your healthcare provider.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={loading ? 'Generating link...' : shareLink || 'Click Generate to create link'}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono truncate"
            />
            {shareLink ? (
              <button 
                onClick={handleCopy}
                className="px-4 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            ) : (
              <button 
                onClick={generateShareLink}
                disabled={loading}
                className="px-4 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                {loading ? 'Creating...' : 'Generate'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <span className="material-symbols-outlined text-amber-600">info</span>
            <p className="text-xs text-amber-700 dark:text-amber-300">This link expires in 7 days and can only be viewed 3 times.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const { report, loading, error } = useReport(reportId);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Calculate health score from metrics
  const healthScore = React.useMemo(() => {
    if (!report?.metrics || report.metrics.length === 0) return 75;
    const normalCount = report.metrics.filter(m => m.status === 'NORMAL').length;
    return Math.round((normalCount / report.metrics.length) * 100);
  }, [report]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileText className="size-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2 dark:text-white">Report Not Found</h2>
        <p className="text-text-muted mb-6">The report you're looking for doesn't exist or has been deleted.</p>
        <Link href="/records" className="bg-primary text-white px-6 py-3 rounded-xl font-bold">
          Back to Records
        </Link>
      </div>
    );
  }

  // Parse metrics for display
  const metrics = (report.metrics || []).map(m => ({
    name: m.name,
    value: String(m.value),
    unit: m.unit,
    status: (m.status?.toLowerCase() || 'normal') as 'normal' | 'high' | 'low',
    range: m.referenceRange
  }));

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30 -mx-6 lg:-mx-12 -mt-6 lg:-mt-12 mb-8">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-4">
              <Link 
                href="/records"
                className="size-10 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <div>
                <h1 className="text-xl font-black dark:text-white leading-none">{report.title}</h1>
                <p className="text-xs text-text-muted mt-1">Processed on {formatDate(report.createdAt)}</p>
              </div>
            </div>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
            >
              <Share2 className="size-4" />
              Share
            </button>
            <button 
              onClick={async () => {
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();
                
                // Helper to strip markdown and sanitize text
                const stripMarkdown = (text: string) => {
                  return text
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
                    .replace(/\*(.*?)\*/g, '$1')     // Italic
                    .replace(/__(.*?)__/g, '$1')     // Underline
                    .replace(/`(.*?)`/g, '$1')       // Inline code
                    .replace(/#+\s/g, '')            // Headers
                    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
                    .replace(/[-*]\s/g, '• ')        // Lists
                    .replace(/[^\x20-\x7E\n•]/g, '') // Remove non-printable/weird chars
                    .trim();
                };

                // --- Blue Banner Header ---
                doc.setFillColor(59, 130, 246); // Primary Blue (Tailwind blue-500 equivalent approx)
                doc.rect(0, 0, 210, 40, 'F');
                
                doc.setTextColor(255, 255, 255);
                
                // Patient Name (Left)
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(stripMarkdown(report.analysis?.patientName || 'Patient'), 15, 20);
                
                // Logo/Website Name (Center)
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text('HealthDoc', 105, 25, { align: 'center' });
                
                // Date & Age (Right)
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const dateStr = formatDate(new Date().toISOString()); // Generated Date
                const ageStr = report.analysis?.patientAge ? `Age: ${report.analysis.patientAge}` : '';
                
                doc.text(`Generated: ${dateStr}`, 195, 20, { align: 'right' });
                if (ageStr) {
                    doc.text(ageStr, 195, 26, { align: 'right' });
                }

                
                let yPos = 55;
                
                // --- Executive Summary ---
                doc.setTextColor(33, 33, 33);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Executive Summary', 20, yPos);
                yPos += 10;
                
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                doc.setFont('helvetica', 'normal');
                
                // Use the detailed summary or description
                const rawSummary = report.analysis?.patientSummary || report.analysis?.reportDescription || 'No summary available.';
                const summary = stripMarkdown(rawSummary);
                const splitSummary = doc.splitTextToSize(summary, 170);
                doc.text(splitSummary, 20, yPos);
                
                yPos += (splitSummary.length * 6) + 15;
                
                // --- Key Metrics ---
                doc.setTextColor(33, 33, 33);
                doc.setFontSize(18); // Slightly bigger for section header
                doc.setFont('helvetica', 'bold');
                doc.text('Key Metrics', 20, yPos);
                yPos += 12;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                
                const metrics = report.metrics || [];
                // Simple list format for metrics
                metrics.slice(0, 20).forEach((m: any) => { // Cast to any to avoid type issues in inline code, effectively ChatMessage logic is handled separately
                  if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                  }
                  
                  // Clean layout using simple x coordinates
                  const name = stripMarkdown(m.name.substring(0, 30));
                  const value = stripMarkdown(`${m.value} ${m.unit}`);
                  
                  doc.setTextColor(0, 0, 0); // Black for name
                  doc.text(name, 20, yPos);
                  doc.text(value, 110, yPos);
                  
                  // Status
                  if (m.status === 'HIGH') {
                    doc.setTextColor(220, 38, 38); // Red
                    doc.text(m.status, 160, yPos);
                  } else if (m.status === 'LOW') {
                    doc.setTextColor(37, 99, 235); // Blue
                    doc.text(m.status, 160, yPos);
                  } else {
                    doc.setTextColor(22, 163, 74); // Green
                    doc.text('NORMAL', 160, yPos);
                  }
                  
                  yPos += 8;
                });
                
                yPos += 15;

                // --- Chat History ---
                if (chatMessages.length > 0) {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    } 
                    
                    doc.setTextColor(33, 33, 33);
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.text('AI Consultation History', 20, yPos);
                    yPos += 15;
                    
                    doc.setFontSize(10);
                    
                    chatMessages.forEach(msg => {
                        if (yPos > 260) {
                            doc.addPage();
                            yPos = 20;
                        }
                        
                        const role = msg.role === 'user' ? 'You' : 'HealthDoc AI';
                        const color = msg.role === 'user' ? [37, 99, 235] : [22, 163, 74]; // Blue : Green
                        doc.setTextColor(color[0], color[1], color[2]);
                        doc.setFont('helvetica', 'bold');
                        doc.text(role, 20, yPos);
                        
                        yPos += 5;
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(60, 60, 60);
                        
                        const rawContent = msg.content;
                        const cleanContent = stripMarkdown(rawContent);
                        const content = doc.splitTextToSize(cleanContent, 170);
                        doc.text(content, 20, yPos);
                        yPos += (content.length * 5) + 8; // Spacing after message
                    });
                }
                
                doc.save(`${report.title.replace(/\s+/g, '_')}_detailed.pdf`);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* File Info Banner */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row flex-wrap gap-8 items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                <FileText className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Source File</p>
                <p className="font-bold text-sm dark:text-white truncate max-w-[150px]">{report.originalFileName}</p>
              </div>
            </div>
            
            <div className="w-px h-10 bg-gray-100 dark:bg-gray-700 hidden sm:block"></div>

            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-500 flex items-center justify-center">
                <Calendar className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Date Performed</p>
                <p className="font-bold text-sm dark:text-white">{formatDate(report.analysis?.reportDate || report.createdAt)}</p>
              </div>
            </div>

            <div className="w-px h-10 bg-gray-100 dark:bg-gray-700 hidden sm:block"></div>

            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-500 flex items-center justify-center">
                <Stethoscope className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Provider</p>
                <p className="font-bold text-sm dark:text-white">{report.analysis?.labName || 'Unknown Lab'}</p>
              </div>
            </div>
          </div>

          {/* Health Score & Breakdown */}
          <div className="grid md:grid-cols-5 gap-6">
            {/* Health Score Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary to-[#256b89] p-8 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Health Score</p>
              <div className="flex items-end gap-2">
                <span className="text-7xl font-black">{healthScore}</span>
                <span className="text-2xl font-bold opacity-60 mb-2">/100</span>
              </div>
              <p className="text-sm opacity-80 mt-4">
                {healthScore >= 80 ? 'Excellent! Your health indicators look great.' :
                 healthScore >= 60 ? 'Good overall health. Some areas may need attention.' :
                 'Please consult with your doctor about these results.'}
              </p>
            </div>

            {/* Breakdown */}
            <div className="md:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-8">Score Breakdown</p>
              
              <div className="space-y-6">
                <ScoreBar 
                  label="Normal Values" 
                  status={`${metrics.filter(m => m.status === 'normal').length} of ${metrics.length}`} 
                  color="bg-emerald-500" 
                  width={`${(metrics.filter(m => m.status === 'normal').length / Math.max(metrics.length, 1)) * 100}%`} 
                  statusColor="text-emerald-500" 
                />
                <ScoreBar 
                  label="High Values" 
                  status={`${metrics.filter(m => m.status === 'high').length} found`} 
                  color="bg-amber-400" 
                  width={`${(metrics.filter(m => m.status === 'high').length / Math.max(metrics.length, 1)) * 100}%`} 
                  statusColor="text-amber-500" 
                />
                <ScoreBar 
                  label="Low Values" 
                  status={`${metrics.filter(m => m.status === 'low').length} found`} 
                  color="bg-rose-500" 
                  width={`${(metrics.filter(m => m.status === 'low').length / Math.max(metrics.length, 1)) * 100}%`} 
                  statusColor="text-rose-500" 
                />
              </div>
            </div>
          </div>

          {/* Report Summary Section (Replaced AI Recommendations) */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-3">
              <ClipboardList className="size-6 text-primary" />
              Report Summary
            </h3>
            
            {/* Patient Info Grid */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <User className="size-5 text-primary" />
                  <span className="text-xs font-bold text-text-muted uppercase">Patient Name</span>
                </div>
                <p className="font-bold text-lg dark:text-white">{report.analysis?.patientName || 'Unknown'}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="size-5 text-primary" />
                  <span className="text-xs font-bold text-text-muted uppercase">Laboratory</span>
                </div>
                <p className="font-bold text-lg dark:text-white">{report.analysis?.labName || 'Unknown Lab'}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="size-5 text-primary" />
                  <span className="text-xs font-bold text-text-muted uppercase">Report Date</span>
                </div>
                <p className="font-bold text-lg dark:text-white">{formatDate(report.analysis?.reportDate)}</p>
              </div>
            </div>
            
            {/* Description */}
            <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
              <h4 className="font-bold mb-3 dark:text-white">About This Report</h4>
              <div className="prose dark:prose-invert max-w-none text-text-muted dark:text-gray-400 leading-relaxed text-sm">
              <p>{report.analysis?.patientSummary || report.analysis?.reportDescription || 'No summary available.'}</p>
            </div>

            {/* AI Prediction Card (User Requested) */}
            {report.analysis?.predictions && report.analysis.predictions.length > 0 && (
              <div className="mt-6 p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50 shadow-sm relative overflow-hidden group">
                {/* Decorative Icon Background */}
                <AlertTriangle className="absolute -right-4 -top-4 size-24 text-amber-500/10 dark:text-amber-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                     <span className="flex items-center justify-center size-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-5" />
                     </span>
                     <h4 className="font-bold text-amber-900 dark:text-amber-100 text-lg">AI Health Prediction</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {report.analysis.predictions.map((pred, i) => (
                      <div key={i} className="flex gap-3 items-start bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
                        <span className="mt-1 size-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100/90 leading-snug">
                          {pred.replace(/^CAUTION: AI PREDICTION\s*[-–:]\s*/i, '')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] uppercase tracking-wider font-bold text-amber-400 dark:text-amber-500/60 mt-4 text-center">
                    AI Generated • Not Medical Advice
                  </p>
                </div>
              </div>
            )}
            
            {/* Close the About section properly */}
            </div>

            {/* Key Findings */}
            {report.analysis?.keyFindings && report.analysis.keyFindings.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold mb-3 dark:text-white">Key Findings</h4>
                <ul className="space-y-2">
                  {report.analysis.keyFindings.map((finding, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-muted dark:text-gray-300">
                      <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Metrics Table */}
          {metrics.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold dark:text-white">Detailed Metrics</h3>
                <p className="text-sm text-text-muted mt-1">Complete breakdown of your lab results.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/20">
                      <th className="py-4 px-6 text-[10px] font-bold text-text-muted uppercase tracking-widest">Biomarker</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-text-muted uppercase tracking-widest">Your Value</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-text-muted uppercase tracking-widest">Normal Range</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-50 dark:divide-gray-700/50">
                    {metrics.map((metric, i) => (
                      <MetricRow key={i} {...metric} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Chat Assistant) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <ReportChat 
              reportId={reportId || 'demo'} 
              onMessagesChange={(msgs) => setChatMessages(msgs)}
            />
          </div>
        </div>
      </div>

      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} reportId={reportId} />
    </>
  );
}
