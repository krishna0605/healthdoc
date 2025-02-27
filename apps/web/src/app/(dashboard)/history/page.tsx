'use client'

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTrends, useMetricNames } from '@/hooks/useTrends';

export default function HistoryPage() {
  const { metricNames, loading: namesLoading } = useMetricNames();
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [timeRange, setTimeRange] = useState('1y');

  const { trends, metrics, reportCount, loading, error } = useTrends(selectedMetric || undefined);

  // Set default metric when names load
  useEffect(() => {
    if (metricNames.length > 0 && !selectedMetric) {
      setSelectedMetric(metricNames[0].name);
    }
  }, [metricNames, selectedMetric]);

  // Get data points for selected metric
  const dataPoints = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    value: t[selectedMetric] as number | undefined,
    status: t[`${selectedMetric}_status`] as string | undefined,
    unit: t[`${selectedMetric}_unit`] as string | undefined,
    title: t.title
  })).filter(d => d.value !== undefined);

  const maxValue = dataPoints.length > 0 ? Math.max(...dataPoints.map(d => d.value!)) : 100;
  const minValue = dataPoints.length > 0 ? Math.min(...dataPoints.map(d => d.value!)) : 0;
  const range = maxValue - minValue || 1;

  const currentMetric = metricNames.find(m => m.name === selectedMetric);

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
        <div className="w-full flex justify-between items-start md:block">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 dark:text-white">Health Trends</h1>
            <p className="text-text-muted dark:text-gray-400 text-sm md:text-base">Visualize how your biomarkers change over time.</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Info Card */}
      <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 flex items-start gap-4">
        <div className="size-10 md:size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl md:text-2xl">info</span>
        </div>
        <div>
          <h4 className="font-bold text-primary mb-1 text-sm md:text-base">How Trends Work</h4>
          <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm leading-relaxed max-w-3xl">
            Select a biomarker from the dropdown to see how your values have changed across multiple reports. 
            {reportCount > 0 
              ? ` You have ${reportCount} analyzed reports available for trend analysis.`
              : ' Upload and analyze more reports to see trends.'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Select Biomarker</label>
            <div className="relative max-w-md">
              {namesLoading ? (
                <div className="w-full h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              ) : metricNames.length === 0 ? (
                <div className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-text-muted text-sm">
                  No metrics available yet
                </div>
              ) : (
                <>
                  <select 
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none font-bold text-sm md:text-base dark:text-white pr-10 cursor-pointer"
                  >
                    {metricNames.map((m) => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {['3m', '6m', '1y', 'All'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  timeRange === range 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-gray-50 dark:bg-gray-700 text-text-muted hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-lg md:text-xl font-bold dark:text-white">{selectedMetric || 'Select a Metric'}</h3>
            <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm">
              Showing values in {currentMetric?.unit || 'units'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-primary"></div>
              <span className="text-xs font-bold text-text-muted">Your Values</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-4">show_chart</span>
            <p className="text-text-muted dark:text-gray-400 text-center">
              No data available for this metric.<br />
              <span className="text-sm">Upload more reports with this biomarker to see trends.</span>
            </p>
          </div>
        ) : (
          <div className="h-64 md:h-80 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] md:text-xs font-mono text-text-muted">
              <span>{(maxValue + range * 0.1).toFixed(1)}</span>
              <span>{((maxValue + minValue) / 2).toFixed(1)}</span>
              <span>{(minValue - range * 0.1).toFixed(1)}</span>
            </div>
            
            {/* Chart area */}
            <div className="ml-12 h-full flex items-end justify-between gap-2 md:gap-4 pb-8 relative">
              {/* Data bars */}
              {dataPoints.map((point, i) => {
                const heightPercent = ((point.value! - minValue) / range) * 100;
                const clampedHeight = Math.max(10, Math.min(100, heightPercent));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="w-6 md:w-10 lg:w-16 bg-linear-to-t from-primary to-primary/70 rounded-t-xl transition-all duration-500 hover:from-primary/90 hover:to-primary/60 group cursor-pointer relative"
                        style={{ height: `${clampedHeight * 2}px` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-main dark:bg-white text-white dark:text-text-main px-2 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {point.value} {currentMetric?.unit || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis labels */}
            <div className="ml-12 flex justify-between text-[10px] md:text-xs font-bold text-text-muted mt-2">
              {dataPoints.map((point, i) => (
                <span key={i} className="flex-1 text-center truncate">{point.date}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold mb-6 dark:text-white">Understanding Your Trends</h3>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 dark:text-white">Improving</h4>
              <p className="text-xs text-text-muted leading-relaxed">Your values are moving toward the optimal range.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
            <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">trending_flat</span>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 dark:text-white">Stable</h4>
              <p className="text-xs text-text-muted leading-relaxed">Values are consistent, which is often a positive sign.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl">
            <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">trending_down</span>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1 dark:text-white">Needs Attention</h4>
              <p className="text-xs text-text-muted leading-relaxed">Consider discussing this trend with your doctor.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
