import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LogEntry {
  id: string;
  action: string;
  description: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const LogEntryRow = ({ log }: { log: LogEntry }) => {
  const getIcon = (action: string) => {
    if (action.includes('UPLOAD')) return 'upload_file';
    if (action.includes('LOGIN')) return 'login';
    if (action.includes('LOGOUT')) return 'logout';
    if (action.includes('DELETE')) return 'delete';
    if (action.includes('SHARE')) return 'share';
    if (action.includes('SETTINGS')) return 'settings';
    return 'info'; // default
  };

  const getDevice = (ua?: string) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Android';
    return 'Web Browser';
  };

  // Format date: "Oct 24, 2023 · 14:22"
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="py-4 px-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-lg text-primary">{getIcon(log.action)}</span>
          <span className="font-bold dark:text-white whitespace-nowrap">{log.description || log.action}</span>
        </div>
      </td>
      <td className="py-4 px-6 md:px-8 text-text-muted whitespace-nowrap">{getDevice(log.userAgent)}</td>
      <td className="py-4 px-6 md:px-8 text-text-muted font-mono text-xs">{log.ipAddress || '-'}</td>
      <td className="py-4 px-6 md:px-8 text-right text-text-muted text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
    </tr>
  );
};

import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export function ActivityLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await api.get('/api/audit?limit=10');

        if (error) throw new Error(error);

        setLogs(data.logs || []);
      } catch (err: any) {
        console.error('Fetch logs error:', err);
        setError(err.message || 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLogs();
    }
  }, [user]);

  const handleExport = async () => {
    try {
      setExporting(true);
      // Fetch all logs (limit 1000 for export)
      const { data, error } = await api.get('/api/audit?limit=1000');
      
      if (error) throw new Error(error);
      
      const allLogs = data.logs || [];
      if (allLogs.length === 0) return;

      // Convert to CSV
      const headers = ['Date', 'Time', 'Action', 'Description', 'Device', 'IP Address'];
      const rows = allLogs.map((log: LogEntry) => {
        const d = new Date(log.createdAt);
        return [
          d.toLocaleDateString('en-US'),
          d.toLocaleTimeString('en-US'),
          log.action,
          log.description || log.action,
          log.userAgent || 'Unknown',
          log.ipAddress || '-'
        ].map(cell => `"${cell}"`).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      // Optional: show toast/alert
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-1 dark:text-white">Activity Log</h3>
            <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm">HIPAA-compliant audit trail of all account actions.</p>
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/20">
                <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">Action</th>
                <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">Device / Source</th>
                <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">IP Address</th>
                <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50 dark:divide-gray-700/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-4 px-6 md:px-8">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="py-4 px-6 md:px-8"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-4 px-6 md:px-8"><Skeleton className="h-4 w-28" /></td>
                  <td className="py-4 px-6 md:px-8 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 text-center">
          <Skeleton className="h-4 w-28 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold mb-1 dark:text-white">Activity Log</h3>
          <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm">HIPAA-compliant audit trail of all account actions.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="text-primary font-bold text-xs md:text-sm hover:underline disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-700/20">
              <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">Action</th>
              <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">Device / Source</th>
              <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest">IP Address</th>
              <th className="py-4 px-6 md:px-8 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50 dark:divide-gray-700/50">
            {error ? (
               <tr>
                 <td colSpan={4} className="py-8 text-center text-red-500">{error}</td>
               </tr>
            ) : logs.length === 0 ? (
               <tr>
                 <td colSpan={4} className="py-8 text-center text-text-muted">No activity recorded yet.</td>
               </tr>
            ) : (
              logs.map(log => <LogEntryRow key={log.id} log={log} />)
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-900/30 text-center">
        <button className="text-text-muted text-xs font-bold hover:text-primary transition-colors">View All Logs</button>
      </div>
    </div>
  );
}
