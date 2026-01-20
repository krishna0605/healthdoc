'use client'

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';

// Stat Card Component
interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subLabel: string;
  color: string;
  bg: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subLabel, color, bg, loading }) => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-48 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div className={`size-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{subLabel}</span>
    </div>
    <div>
      <p className="text-text-muted dark:text-gray-500 font-medium text-sm mb-1">{label}</p>
      {loading ? (
        <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      ) : (
        <p className="text-4xl font-black dark:text-white">{value}</p>
      )}
    </div>
  </div>
);

// Activity Item Component
interface ActivityItemProps {
  icon: string;
  title: string;
  date: string;
  status: string;
  statusColor: string;
  href: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon, title, date, status, statusColor, href }) => (
  <Link href={href} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:shadow-md transition-shadow cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="size-12 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <h4 className="font-bold text-lg group-hover:text-primary transition-colors dark:text-white">{title}</h4>
        <p className="text-xs text-text-muted dark:text-gray-500">{date}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${statusColor}`}>
        {status}
      </span>
      <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">chevron_right</span>
    </div>
  </Link>
);

// Loading skeleton for activity items
const ActivitySkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <div className="size-12 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
      <div>
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

// Get status display info
function getStatusDisplay(status: string) {
  switch (status) {
    case 'READY':
      return { label: 'ANALYZED', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' };
    case 'PROCESSING':
      return { label: 'PROCESSING', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' };
    case 'ERROR':
      return { label: 'ERROR', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' };
    default:
      return { label: 'UPLOADED', color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300' };
  }
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { reports, loading } = useReports();

  // Calculate stats from real data
  const totalReports = reports.length;
  const analyzedReports = reports.filter(r => r.status === 'READY').length;
  const analyzedPercent = totalReports > 0 ? Math.round((analyzedReports / totalReports) * 100) : 0;
  
  // Get recent reports (last 3)
  const recentReports = reports.slice(0, 3);

  // Get user's first name
  const userName = user?.email?.split('@')[0] || 'there';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div className="w-full flex justify-between items-start md:block">
          <div>
            <h1 className="text-4xl font-black mb-2 dark:text-white">Dashboard</h1>
            <p className="text-text-muted dark:text-gray-400">Welcome back, {displayName}.</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <Link 
          href="/reports" 
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">upload</span>
          Upload Report
        </Link>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          icon="description" 
          label="Total Reports" 
          value={totalReports.toString()} 
          subLabel="STORAGE"
          color="text-blue-500"
          bg="bg-blue-50 dark:bg-blue-500/10"
          loading={loading}
        />
        <StatCard 
          icon="trending_up" 
          label="Analyzed" 
          value={`${analyzedPercent}%`} 
          subLabel="COMPLETION"
          color="text-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-500/10"
          loading={loading}
        />
        <StatCard 
          icon="check_circle" 
          label="Ready to View" 
          value={analyzedReports.toString()} 
          subLabel="REPORTS"
          color="text-orange-500"
          bg="bg-orange-50 dark:bg-orange-500/10"
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="text-xl font-bold mb-2 dark:text-white">Upload New Report</h3>
          <p className="text-text-muted dark:text-gray-400 mb-8 text-sm">Drag and drop your medical PDFs here for instant AI translation.</p>
          
          <Link 
            href="/reports" 
            className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-3xl min-h-[250px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 group hover:border-primary transition-colors cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="size-16 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <p className="font-bold text-lg mb-1 dark:text-white relative z-10">Drop files here</p>
            <p className="text-text-muted dark:text-gray-500 text-sm relative z-10">Supported formats: PDF, JPG, PNG</p>
          </Link>

          <div className="mt-6 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">shield</span>
            <p className="text-xs text-text-muted dark:text-gray-400 leading-relaxed">
              Your data is processed using end-to-end encryption and is fully HIPAA compliant. We never sell your personal health data.
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold dark:text-white">Recent Activity</h3>
            <Link href="/reports" className="text-primary font-bold text-sm hover:underline">View All Reports</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
              </>
            ) : recentReports.length > 0 ? (
              recentReports.map((report) => {
                const statusInfo = getStatusDisplay(report.status);
                return (
                  <ActivityItem 
                    key={report.id}
                    icon="lab_profile"
                    title={report.title}
                    date={`Uploaded ${formatDate(report.createdAt)}`}
                    status={statusInfo.label}
                    statusColor={statusInfo.color}
                    href={`/reports/${report.id}`}
                  />
                );
              })
            ) : (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="size-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl text-gray-400">folder_open</span>
                </div>
                <p className="text-text-muted dark:text-gray-400 mb-4">No reports yet</p>
                <Link href="/reports" className="text-primary font-bold text-sm hover:underline">
                  Upload your first report →
                </Link>
              </div>
            )}
          </div>
          
          {reports.length > 3 && (
            <Link href="/reports" className="w-full mt-6 py-4 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-text-muted dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center">
              View All Activity
            </Link>
          )}
        </div>
      </div>

      {/* Health Tip */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="size-16 rounded-full bg-linear-to-br from-[#1abc9c] to-[#16a085] flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/20">
          <span className="material-symbols-outlined text-3xl">lightbulb</span>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-2 dark:text-white">Daily Health Tip</h4>
          <p className="text-text-muted dark:text-gray-400 leading-relaxed max-w-3xl">
            Upload your medical reports regularly to track trends over time. Our AI can detect patterns and provide personalized insights based on your <span className="text-[#1abc9c] font-bold">health history</span>.
          </p>
        </div>
      </div>
    </>
  );
}
