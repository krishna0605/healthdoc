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

export function ActivityLog() {
  const { user, getToken } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/audit?limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch logs');

        const data = await res.json();
        setLogs(data.data.logs || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLogs();
    }
  }, [user, getToken]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold mb-1 dark:text-white">Activity Log</h3>
          <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm">HIPAA-compliant audit trail of all account actions.</p>
        </div>
        <button className="text-primary font-bold text-xs md:text-sm hover:underline">Export CSV</button>
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
            {loading ? (
               <tr>
                 <td colSpan={4} className="py-8 text-center text-text-muted">Loading logs...</td>
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
