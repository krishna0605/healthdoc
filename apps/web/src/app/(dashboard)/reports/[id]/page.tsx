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

  // Parse metrics for display
  const metrics = React.useMemo(() => {
    return (report?.metrics || []).map((m) => {
      const normalizedStatus = (m.status?.toLowerCase() || 'normal') as 'normal' | 'high' | 'low';
      return {
        name: m.name,
        value: String(m.value),
        unit: m.unit,
        status: normalizedStatus,
        range: m.referenceRange
      };
    });
  }, [report?.metrics]);

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
                const autoTable = (await import('jspdf-autotable')).default;
                
                const doc = new jsPDF();
                
                // --- Helpers ---
                const stripMarkdown = (text: string) => {
                  return (text || '')
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/__(.*?)__/g, '$1')
                    .replace(/`(.*?)`/g, '$1')
                    .replace(/#+\s/g, '')
                    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                    .replace(/[-*]\s/g, '• ')
                    .replace(/[^\x20-\x7E\n•]/g, '')
                    .trim();
                };

                const addSectionHeader = (title: string, y: number) => {
                   doc.setFillColor(240, 249, 255); // Light Blue bg
                   doc.setDrawColor(59, 130, 246);  // Blue border
                   doc.rect(14, y - 6, 182, 10, 'F');
                   doc.rect(14, y - 6, 2, 10, 'F'); // Darker tab
                   
                   doc.setFontSize(12);
                   doc.setTextColor(30, 58, 138); // Dark Blue
                   doc.setFont('helvetica', 'bold');
                   doc.text(title.toUpperCase(), 20, y);
                   return y + 15;
                };

                // --- 1. Header & Branding ---
                doc.setFillColor(59, 130, 246); 
                doc.rect(0, 0, 210, 45, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('HealthDoc', 15, 20);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('AI-Powered Medical Analysis', 15, 26);

                // Right side header info
                doc.setFontSize(10);
                const reportDate = formatDate(report.analysis?.reportDate || report.createdAt);
                doc.text(`Report Date: ${reportDate}`, 195, 18, { align: 'right' });
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 195, 24, { align: 'right' });
                
                // Patient Info Box (Floating overlap)
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(15, 35, 180, 25, 3, 3, 'F');
                doc.setDrawColor(220, 220, 220);
                doc.roundedRect(15, 35, 180, 25, 3, 3, 'S');
                
                doc.setTextColor(60, 60, 60);
                doc.setFontSize(9);
                doc.text('PATIENT', 25, 42);
                doc.text('LABORATORY', 85, 42);
                doc.text('SOURCE FILE', 145, 42);
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(report.analysis?.patientName || 'Unknown Patient', 25, 50);
                doc.text(report.analysis?.labName || 'Unknown Lab', 85, 50);
                
                const fileName = report.originalFileName.length > 25 
                    ? report.originalFileName.substring(0, 22) + '...' 
                    : report.originalFileName;
                doc.text(fileName, 145, 50);

                let yPos = 75;

                // --- 2. Health Score & Breakdown ---
                
                // Health Score Circular-ish visual (Text representation)
                // Health Score Circular-ish visual (Text representation)
                doc.setFillColor(healthScore < 50 ? 239 : 59, 
                                 healthScore < 50 ? 68 : 130, 
                                 healthScore < 50 ? 68 : 246);
                // Background for score
                doc.roundedRect(15, yPos, 40, 30, 4, 4, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.text('HEALTH SCORE', 35, yPos + 8, { align: 'center' });
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text(`${healthScore}/100`, 35, yPos + 20, { align: 'center' });

                // Breakdown Bars (Right of score)
                const startX = 65;
                const barWidth = 120;
                
                const normalCount = metrics.filter(m => m.status === 'normal').length;
                const highCount = metrics.filter(m => m.status === 'high').length;
                const lowCount = metrics.filter(m => m.status === 'low').length;
                const totalM = Math.max(metrics.length, 1);

                // Normal Bar
                doc.setFontSize(8);
                doc.setTextColor(60, 60, 60);
                doc.text(`Normal Values (${normalCount})`, startX, yPos + 5);
                doc.setFillColor(229, 231, 235); // Gray bg
                doc.rect(startX + 35, yPos + 2, barWidth - 35, 4, 'F');
                doc.setFillColor(16, 185, 129); // Green
                doc.rect(startX + 35, yPos + 2, ((barWidth - 35) * (normalCount / totalM)), 4, 'F');

                // High Bar
                doc.text(`High Values (${highCount})`, startX, yPos + 15);
                doc.setFillColor(229, 231, 235);
                doc.rect(startX + 35, yPos + 12, barWidth - 35, 4, 'F');
                doc.setFillColor(245, 158, 11); // Orange
                doc.rect(startX + 35, yPos + 12, ((barWidth - 35) * (highCount / totalM)), 4, 'F');

                // Low Bar
                doc.text(`Low Values (${lowCount})`, startX, yPos + 25);
                doc.setFillColor(229, 231, 235);
                doc.rect(startX + 35, yPos + 22, barWidth - 35, 4, 'F');
                doc.setFillColor(239, 68, 68); // Red
                doc.rect(startX + 35, yPos + 22, ((barWidth - 35) * (lowCount / totalM)), 4, 'F');

                yPos += 45;

                // --- 3. Report Summary ---
                yPos = addSectionHeader('Report Summary', yPos);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                
                const summary = stripMarkdown(report.analysis?.patientSummary || report.analysis?.reportDescription || 'No summary available.');
                const splitSummary = doc.splitTextToSize(summary, 180);
                doc.text(splitSummary, 20, yPos);
                yPos += (splitSummary.length * 5) + 8;

                // Tags
                if (report.analysis?.tags && report.analysis.tags.length > 0) {
                   const tagsStr = report.analysis.tags.map((t: string) => `#${t}`).join(', ');
                   doc.setFontSize(9);
                   doc.setTextColor(100, 100, 100);
                   doc.text(`TAGS: ${tagsStr}`, 20, yPos);
                   yPos += 15;
                }

                // --- 4. AI Predictions & Key Findings ---
                if (yPos > 240) { doc.addPage(); yPos = 30; }

                // AI Predictions Box
                if (report.analysis?.predictions && report.analysis.predictions.length > 0) {
                    doc.setFillColor(255, 251, 235); // Amber-50
                    doc.setDrawColor(252, 211, 77); // Amber-300
                    doc.roundedRect(15, yPos, 180, (report.analysis.predictions.length * 8) + 15, 3, 3, 'FD');
                    
                    doc.setTextColor(180, 83, 9); // Amber-800
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.text('AI Health Predictions', 25, yPos + 8);
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(146, 64, 14); // Amber-900
                    
                    let predY = yPos + 16;
                    report.analysis.predictions.forEach((pred: string) => {
                        const cleanPred = stripMarkdown(pred);
                        doc.text(`• ${cleanPred}`, 25, predY);
                        predY += 7;
                    });
                    
                    yPos = predY + 10;
                }

                // Key Findings
                if (report.analysis?.keyFindings && report.analysis.keyFindings.length > 0) {
                    yPos = addSectionHeader('Key Findings', yPos);
                    
                    doc.setFontSize(10);
                    doc.setTextColor(30, 30, 30);
                    
                    report.analysis.keyFindings.forEach((finding: string) => {
                       const cleanFinding = doc.splitTextToSize(`• ${stripMarkdown(finding)}`, 175);
                       doc.text(cleanFinding, 20, yPos);
                       yPos += (cleanFinding.length * 5) + 2;
                    });
                    yPos += 10;
                }

                // --- 5. Detailed Metrics Table ---
                doc.addPage();
                yPos = 20;
                yPos = addSectionHeader('Detailed Metrics', yPos);
                
                const tableBody = metrics.map((m: any) => [
                    m.name,
                    `${m.value} ${m.unit}`,
                    m.range || '-',
                    m.status.toUpperCase()
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Biomarker', 'Value', 'Reference Range', 'Status']],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 10 },
                    bodyStyles: { fontSize: 9, textColor: 50 },
                    alternateRowStyles: { fillColor: [249, 250, 251] },
                    margin: { left: 15, right: 15 },
                    didParseCell: (data: any) => {
                        // Colorize Status column
                        if (data.section === 'body' && data.column.index === 3) {
                            const status = data.cell.raw;
                            if (status === 'HIGH') data.cell.styles.textColor = [220, 38, 38];
                            if (status === 'LOW') data.cell.styles.textColor = [37, 99, 235];
                            if (status === 'NORMAL') data.cell.styles.textColor = [22, 163, 74];
                        }
                    }
                });

                // Get final Y after table
                yPos = (doc as any).lastAutoTable.finalY + 20;

                // --- 6. Chat History ---
                if (chatMessages.length > 0) {
                    doc.addPage();
                    yPos = 20;
                    yPos = addSectionHeader('AI Consultation', yPos);
                    
                    chatMessages.forEach((msg) => {
                        const isUser = msg.role === 'user';
                        const role = isUser ? 'You' : 'HealthDoc AI';
                        
                        // Role Header
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'bold');
                        if (isUser) doc.setTextColor(37, 99, 235); // Blue
                        else doc.setTextColor(22, 163, 74); // Green
                        
                        doc.text(role, 20, yPos);
                        yPos += 5;
                        
                        // Message Body
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(60, 60, 60);
                        
                        const text = stripMarkdown(msg.content);
                        const splitText = doc.splitTextToSize(text, 170);
                        
                        // Simple background for AI
                        if (!isUser) {
                           doc.setFillColor(240, 253, 244); // Light green bg
                           doc.rect(18, yPos - 4, 175, (splitText.length * 5) + 6, 'F');
                        }

                        doc.text(splitText, 20, yPos);
                        yPos += (splitText.length * 5) + 10;
                        
                        if (yPos > 270) {
                            doc.addPage();
                            yPos = 20;
                        }
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
            
            {/* Tags Section */}
            {report.analysis?.tags && report.analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {report.analysis.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
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
