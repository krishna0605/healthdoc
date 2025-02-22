'use client'

import React from 'react';
import Link from 'next/link';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { HealthTrendsChart } from '@/components/dashboard/HealthTrendsChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Activity, 
  CheckCircle, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight,
  Clock,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel: string;
  color: string; // text color class
  bg: string; // background color class
  shadowColor: string; // shadow color class
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subLabel, color, bg, shadowColor, loading }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={`glass bg-white/80 dark:bg-gray-800/80 p-6 rounded-[2rem] shadow-xl ${shadowColor} border border-white/40 dark:border-gray-700/50 flex flex-col justify-between h-40 w-full relative overflow-hidden group`}
  >
    {/* Background Gradient Blob */}
    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 ${bg.replace('bg-', 'bg-')}`} />
    
    <div className="flex justify-between items-start relative z-10">
      <div className={`size-12 rounded-2xl ${bg} ${color} flex items-center justify-center p-2.5 shadow-sm`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full">{subLabel}</span>
    </div>
    
    <div className="relative z-10">
      <p className="text-text-muted dark:text-gray-400 font-medium text-xs mb-1 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
      ) : (
        <div className="flex items-end gap-2">
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">{value}</p>
        </div>
      )}
    </div>
  </motion.div>
);

// Activity Item Component
interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  date: string;
  status: string;
  statusColor: string;
  href: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon, title, date, status, statusColor, href }) => (
  <Link href={href}>
    <motion.div 
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
      whileTap={{ scale: 0.99 }}
      className="p-4 rounded-2xl border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer flex items-center justify-between group bg-white/50 dark:bg-gray-800/50"
    >
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center shadow-xs border border-gray-100 dark:border-gray-600 group-hover:text-primary group-hover:border-primary/30 transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-xs">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{date}</p>
          </div>
        </div>
      </div>
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${statusColor}`}>
        {status}
      </div>
    </motion.div>
  </Link>
);

// Loading skeleton using Framer Motion
const ActivitySkeleton = () => (
  <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50">
    <div className="flex items-center gap-4 w-full">
      <div className="size-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"></div>
      <div className="space-y-2 w-full">
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-2 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

function getStatusDisplay(status: string) {
  switch (status) {
    case 'READY':
      return { 
        label: 'ANALYZED', 
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
      };
    case 'PROCESSING':
      return { 
        label: 'PROCESSING', 
        color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' 
      };
    case 'ERROR':
      return { 
        label: 'ERROR', 
        color: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' 
      };
    default:
      return { 
        label: 'UPLOADED', 
        color: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20' 
      };
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-[1600px] mx-auto px-4 md:px-0 pb-10"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="mb-8 pt-4">
        <h1 className="text-3xl md:text-4xl font-black mb-1 dark:text-white tracking-tight flex items-center gap-3">
          Health Command Center
          <div className="px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-widest hidden sm:block">Beta</div>
        </h1>
        <p className="text-text-muted dark:text-gray-400 text-lg">
          Overview for <span className="font-bold text-gray-800 dark:text-gray-200">{displayName}</span>
        </p>
      </motion.header>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-8">
        <QuickActions />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Left Column (Charts) - Spans 2 cols */}
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          <motion.div variants={itemVariants} className="flex-1">
             <HealthTrendsChart />
          </motion.div>
          
           {/* Recent Activity List */}
           <motion.div 
             variants={itemVariants}
             className="glass bg-white/80 dark:bg-gray-800/80 p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-white/40 dark:border-gray-700/50"
           >
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                    <Activity className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white">Recent Files</h3>
                </div>
                <Link href="/reports" className="group flex items-center gap-1 text-primary font-bold text-sm bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
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
                       icon={<FileText className="w-5 h-5" />}
                       title={report.title}
                       date={formatDate(report.createdAt)}
                       status={statusInfo.label}
                       statusColor={statusInfo.color}
                       href={`/reports/${report.id}`}
                     />
                   );
                 })
               ) : (
                 <div className="text-center py-12">
                   <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                     <FileCheck className="w-8 h-8" />
                   </div>
                   <p className="text-gray-500 font-medium">No recent activity</p>
                   <p className="text-xs text-gray-400 mt-1">Upload a report to get started</p>
                 </div>
               )}
             </div>
           </motion.div>
        </div>

        {/* Right Column (Stats & Tips) - Spans 1 col */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <StatCard 
              icon={<FileText className="w-6 h-6" />}
              label="Total Reports" 
              value={totalReports.toString()} 
              subLabel="STORAGE"
              color="text-blue-500"
              bg="bg-blue-50 dark:bg-blue-500/10"
              shadowColor="shadow-blue-500/5"
              loading={loading}
            />
            <StatCard 
              icon={<TrendingUp className="w-6 h-6" />}
              label="Analyzed" 
              value={`${analyzedPercent}%`} 
              subLabel="COMPLETION"
              color="text-emerald-500"
              bg="bg-emerald-50 dark:bg-emerald-500/10"
              shadowColor="shadow-emerald-500/5"
              loading={loading}
            />
            <StatCard 
              icon={<CheckCircle className="w-6 h-6" />}
              label="Ready to View" 
              value={analyzedReports.toString()} 
              subLabel="REPORTS"
              color="text-orange-500"
              bg="bg-orange-50 dark:bg-orange-500/10"
              shadowColor="shadow-orange-500/5"
              loading={loading}
            />
          </div>

          {/* Health Tip Card */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-primary to-cyan-600 p-6 rounded-[2rem] text-white shadow-lg shadow-cyan-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition-colors duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="size-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/20">
                 <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-cyan-50 uppercase tracking-wider text-[10px] bg-black/10 px-2 py-1 rounded-full">Daily Tip</span>
            </div>
            
            <p className="font-bold text-lg leading-snug mb-6 relative z-10">
              Regular blood tests can help detect issues early. Schedule one every 6 months!
            </p>
            
            <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-cyan-50 transition-colors shadow-lg shadow-black/5 flex items-center justify-center gap-2 group/btn relative z-10">
              Read More <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
