'use client'

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useReports, useReportComparison } from '@/hooks/useReports';

export default function ComparePage() {
  const { reports, loading: reportsLoading } = useReports();
  const [report1Id, setReport1Id] = useState<string | null>(null);
  const [report2Id, setReport2Id] = useState<string | null>(null);
  
  const { comparison, loading: compareLoading, error } = useReportComparison(report1Id, report2Id);

  // Set default selections when reports load
  useEffect(() => {
    if (reports.length >= 2 && !report1Id && !report2Id) {
      setReport1Id(reports[0].id);
      setReport2Id(reports[1].id);
    } else if (reports.length === 1 && !report1Id) {
      setReport1Id(reports[0].id);
    }
  }, [reports, report1Id, report2Id]);

  const readyReports = reports.filter(r => r.status === 'READY');
  const canCompare = readyReports.length >= 2;

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
        <div className="w-full flex justify-between items-start md:block">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 dark:text-white">Compare Reports</h1>
            <p className="text-text-muted dark:text-gray-400 text-sm md:text-base">Analyze changes between two medical reports over time.</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Selection Section */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm mb-6 md:mb-8">
        {reportsLoading ? (
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        ) : !canCompare ? (
          <div className="text-center py-8">
            <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl text-gray-400">compare_arrows</span>
            </div>
            <p className="text-text-muted dark:text-gray-400 mb-2">You need at least 2 analyzed reports to compare.</p>
            <p className="text-sm text-gray-400">Upload and analyze more reports to use this feature.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-end">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Baseline Report</label>
                <div className="relative">
                  <select 
                    value={report1Id || ''}
                    onChange={(e) => setReport1Id(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none font-bold text-sm md:text-base dark:text-white pr-10"
                  >
                    {readyReports.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.id === report2Id}>
                        {r.title} ({new Date(r.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Comparison Report</label>
                <div className="relative">
                  <select 
                    value={report2Id || ''}
                    onChange={(e) => setReport2Id(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none font-bold text-sm md:text-base dark:text-white pr-10"
                  >
                    {readyReports.filter(r => r.id !== report1Id).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({new Date(r.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Results */}
      {compareLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-[2rem] p-6 border border-red-100 dark:border-red-800/30">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {comparison && !compareLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 md:p-6 rounded-2xl text-center border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-2xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400">{comparison.summary?.improved || 0}</p>
              <p className="text-emerald-700 dark:text-emerald-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Improved</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 md:p-6 rounded-2xl text-center border border-blue-100 dark:border-blue-800/30">
              <p className="text-2xl md:text-4xl font-black text-blue-600 dark:text-blue-400">{comparison.summary?.same || 0}</p>
              <p className="text-blue-700 dark:text-blue-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Stable</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 md:p-6 rounded-2xl text-center border border-orange-100 dark:border-orange-800/30">
              <p className="text-2xl md:text-4xl font-black text-orange-600 dark:text-orange-400">{comparison.summary?.declined || 0}</p>
              <p className="text-orange-700 dark:text-orange-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Declined</p>
            </div>
          </div>

          {/* Metrics Table */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
            <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-1 dark:text-white">Metric Comparison</h3>
                <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm">Side-by-side analysis of key biomarkers.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/20">
                    <th className="py-4 px-5 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">Metric</th>
                    <th className="py-4 px-5 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      {comparison.report1?.title?.substring(0, 15) || 'Report 1'}
                    </th>
                    <th className="py-4 px-5 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                      {comparison.report2?.title?.substring(0, 15) || 'Report 2'}
                    </th>
                    <th className="py-4 px-5 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Change</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50 dark:divide-gray-700/50">
                  {comparison.comparison?.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="py-4 px-5 md:px-8 font-bold dark:text-white">{m.name}</td>
                      <td className="py-4 px-5 md:px-8 text-text-muted font-mono text-xs">
                        {m.report1 ? `${m.report1.value} ${m.report1.unit}` : '-'}
                      </td>
                      <td className="py-4 px-5 md:px-8 text-text-muted font-mono text-xs">
                        {m.report2 ? `${m.report2.value} ${m.report2.unit}` : '-'}
                      </td>
                      <td className="py-4 px-5 md:px-8 text-center">
                        {m.change && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                            m.direction === 'improved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            m.direction === 'declined' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            <span className="material-symbols-outlined text-xs">
                              {m.direction === 'improved' || m.direction === 'increased' ? 'trending_up' : 
                               m.direction === 'declined' || m.direction === 'decreased' ? 'trending_down' : 'trending_flat'}
                            </span>
                            {m.change}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {(!comparison.comparison || comparison.comparison.length === 0) && (
                <div className="py-12 text-center">
                  <p className="text-text-muted dark:text-gray-400">No comparable metrics found between these reports.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
