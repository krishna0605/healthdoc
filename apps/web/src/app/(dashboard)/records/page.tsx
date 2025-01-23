'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, FileText, ChevronRight, CheckCircle, AlertTriangle, Clock, ArrowRight, Filter } from 'lucide-react';
import { useReports, Report } from '@/hooks/useReports';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'READY':
        return { label: 'HEALTHY', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle };
      case 'PROCESSING':
      case 'OCR_PROCESSING':
        return { label: 'PROCESSING', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock };
      case 'UPLOADED':
        return { label: 'STABLE', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: Clock };
      case 'FAILED':
      case 'ERROR':
        return { label: 'ACTION NEEDED', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: FileText };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
};

// Category tabs
const categories = ['All', 'Lab Results', 'Imaging', 'Prescriptions', 'Vaccinations'];

export default function RecordsPage() {
  const router = useRouter();
  const { reports, loading, error } = useReports();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter reports based on search and category
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, category filtering is placeholder since we don't have category data
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2 dark:text-white">Medical Records</h1>
          <p className="text-text-muted dark:text-gray-400">Access and manage your complete health history.</p>
        </div>

        <Link 
          href="/reports"
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2"
        >
          <Upload className="size-5" />
          Upload New
        </Link>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 md:max-w-xs ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-main dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          // Loading skeleton
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                <div className="size-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertTriangle className="size-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load records. Please try again.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-bold mb-2 dark:text-white">No records found</h3>
            <p className="text-text-muted dark:text-gray-400 mb-6">
              {searchQuery ? 'Try a different search term.' : 'Upload your first medical report to get started.'}
            </p>
            <Link 
              href="/reports"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              <Upload className="size-5" />
              Upload Report
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredReports.map(report => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="group p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
              >
                {/* Icon */}
                <div className="size-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <FileText className="size-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors truncate">
                    {report.title}
                  </h3>
                  <p className="text-sm text-text-muted dark:text-gray-400">
                    Analyzed {formatDate(report.createdAt)} • {report.fileType === 'PDF' ? 'Lab Results' : 'Imaging'}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={report.status} />

                {/* Arrow */}
                <ChevronRight className="size-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
