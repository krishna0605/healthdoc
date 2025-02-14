'use client'

import React from 'react';
import Link from 'next/link';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { HealthTrendsChart } from '@/components/dashboard/HealthTrendsChart';
import { QuickActions } from '@/components/dashboard/QuickActions';

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
  <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-40 w-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div className={`size-10 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{subLabel}</span>
    </div>
    <div>
      <p className="text-text-muted dark:text-gray-500 font-medium text-xs mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      ) : (
        <p className="text-3xl font-black dark:text-white">{value}</p>
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
  <Link href={href} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-primary/50 transition-colors cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="size-10 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <h4 className="font-bold text-sm group-hover:text-primary transition-colors dark:text-white truncate max-w-[150px] sm:max-w-xs">{title}</h4>
        <p className="text-[10px] text-text-muted dark:text-gray-500">{date}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${statusColor}`}>
        {status}
      </span>
    </div>
  </Link>
);

// Loading skeleton for activity items
const ActivitySkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <div className="size-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
      <div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { reports, loading } = useReports();

  // Calculate stats
  const totalReports = reports.length;
  const analyzedReports = reports.filter(r => r.status === 'READY').length;
  const analyzedPercent = totalReports > 0 ? Math.round((analyzedReports / totalReports) * 100) : 0;
  
  const recentReports = reports.slice(0, 4);

  const userName = user?.email?.split('@')[0] || 'there';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-1 dark:text-white">Health Command Center</h1>
        <p className="text-text-muted dark:text-gray-400">Overview for <span className="font-bold text-gray-800 dark:text-gray-200">{displayName}</span></p>
      </header>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Column (Charts) - Spans 2 cols */}
        <div className="lg:col-span-2 space-y-8">
          <HealthTrendsChart />
          
           {/* Recent Activity List (Moved here for better flow) */}
           <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Recent Files</h3>
                <Link href="/reports" className="text-primary font-bold text-sm hover:underline">View All</Link>
             </div>
             
             <div className="space-y-3">
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
                       date={formatDate(report.createdAt)}
                       status={statusInfo.label}
                       statusColor={statusInfo.color}
                       href={`/reports/${report.id}`}
                     />
                   );
                 })
               ) : (
                 <div className="text-center py-8 text-gray-400 text-sm">No recent activity</div>
               )}
             </div>
           </div>
        </div>

        {/* Right Column (Stats & Tips) - Spans 1 col */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
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

          {/* Health Tip Card */}
          <div className="bg-linear-to-br from-[#1abc9c] to-[#16a085] p-6 rounded-[2rem] text-white shadow-lg shadow-teal-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition-colors"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                 <span className="material-symbols-outlined text-xl">lightbulb</span>
              </div>
              <span className="font-bold text-teal-50 uppercase tracking-wider text-xs">Daily Tip</span>
            </div>
            
            <p className="font-medium text-lg leading-snug mb-4">
              Regular blood tests can help detect issues early. Schedule one every 6 months!
            </p>
            
            <button className="w-full py-3 bg-white text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors shadow-sm">
              Read More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
