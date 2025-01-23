'use client'

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { usePreferences } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';

// Toggle Row Component
const ToggleRow = ({ label, desc, isOn, onToggle, loading }: { label: string; desc: string; isOn: boolean; onToggle: () => void; loading?: boolean }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="pr-2">
      <h4 className="font-bold text-sm text-text-main dark:text-white">{label}</h4>
      <p className="text-xs text-text-muted mt-1 max-w-lg">{desc}</p>
    </div>
    <button 
      onClick={onToggle}
      disabled={loading}
      className={`w-11 h-6 md:w-12 md:h-7 rounded-full p-1 transition-colors duration-300 shrink-0 ${isOn ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`size-4 md:size-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

// Nav Button Component
const NavButton = ({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-auto min-w-[120px] lg:w-full flex items-center justify-center lg:justify-start gap-2 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-xl transition-all duration-200 font-bold text-sm text-left whitespace-nowrap lg:whitespace-normal shrink-0 ${active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text-main dark:hover:text-white'}`}
  >
    <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>{icon}</span>
    {label}
  </button>
);

// Log Entry Component
const LogEntry = ({ icon, iconColor, action, device, ip, time }: { icon: string; iconColor: string; action: string; device: string; ip: string; time: string }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
    <td className="py-4 px-6 md:px-8">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
        <span className="font-bold dark:text-white whitespace-nowrap">{action}</span>
      </div>
    </td>
    <td className="py-4 px-6 md:px-8 text-text-muted whitespace-nowrap">{device}</td>
    <td className="py-4 px-6 md:px-8 text-text-muted font-mono text-xs">{ip}</td>
    <td className="py-4 px-6 md:px-8 text-right text-text-muted text-xs whitespace-nowrap">{time}</td>
  </tr>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences, loading: prefsLoading, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState('security');
  const [saving, setSaving] = useState(false);
  const [show2FAInput, setShow2FAInput] = useState(false);

  // Local state for toggles (synced with API)
  const [toggles, setToggles] = useState({
    emailOnComplete: true,
    emailOnAbnormal: true,
    weeklyDigest: false
  });

  // Sync with API preferences when loaded
  useEffect(() => {
    if (preferences) {
      setToggles({
        emailOnComplete: preferences.emailOnComplete,
        emailOnAbnormal: preferences.emailOnAbnormal,
        weeklyDigest: preferences.weeklyDigest
      });
    }
  }, [preferences]);

  const handleToggle = async (key: keyof typeof toggles) => {
    const newValue = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newValue }));
    
    // Save to API
    setSaving(true);
    await updatePreferences({ [key]: newValue });
    setSaving(false);
  };

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-12 gap-4">
        <div className="w-full flex justify-between items-start md:block">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 dark:text-white">Account Settings</h1>
            <p className="text-text-muted dark:text-gray-400 text-sm md:text-lg">Manage your security preferences.</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="size-10 rounded-full bg-blue-100 text-primary font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm">
            {user?.email?.substring(0, 2).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-2 overflow-x-auto flex lg:block gap-2 pb-2 lg:pb-0 no-scrollbar sticky top-0 bg-[#f8f9fa] dark:bg-background-dark z-20 -mx-4 md:mx-0 px-4 md:px-0">
          <NavButton icon="shield_person" label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          <NavButton icon="notifications" label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
          <NavButton icon="history" label="Activity" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
          <NavButton icon="person" label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6 md:space-y-8">
          
          {/* Notification Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg md:text-xl font-bold mb-2 dark:text-white">Notification Preferences</h3>
            <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm mb-6 md:mb-8">Control how and when you receive health analysis updates.</p>

            <div className="space-y-6">
              <ToggleRow 
                label="Analysis Alerts" 
                desc="Receive instant notifications when a new health report is ready." 
                isOn={toggles.emailOnComplete} 
                onToggle={() => handleToggle('emailOnComplete')}
                loading={saving || prefsLoading}
              />
              <div className="h-px bg-gray-50 dark:bg-gray-700/50"></div>
              <ToggleRow 
                label="Abnormality Alerts" 
                desc="Get notified when any abnormal values are detected in your reports." 
                isOn={toggles.emailOnAbnormal} 
                onToggle={() => handleToggle('emailOnAbnormal')}
                loading={saving || prefsLoading}
              />
              <div className="h-px bg-gray-50 dark:bg-gray-700/50"></div>
              <ToggleRow 
                label="Weekly Digest" 
                desc="A weekly summary of your health trends and upcoming screenings." 
                isOn={toggles.weeklyDigest} 
                onToggle={() => handleToggle('weeklyDigest')}
                loading={saving || prefsLoading}
              />
            </div>
          </div>

          {/* 2FA Section */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-2 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-text-muted dark:text-gray-400 text-xs md:text-sm">Add an extra layer of security to your health data.</p>
              </div>
              <span className="px-2 md:px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] md:text-xs font-bold rounded-lg uppercase tracking-wider">Disabled</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-5 md:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">perm_device_information</span>
                  </div>
                  <div>
                    <h4 className="font-bold dark:text-white text-sm md:text-base">Authenticator App</h4>
                    <p className="text-xs text-text-muted max-w-xs mt-1">Use apps like Google Authenticator or Authy to generate secure, one-time codes.</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShow2FAInput(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm md:text-base"
                >
                  Setup 2FA
                </button>
              </div>

              {/* Visual Mock of 2FA Process */}
              <div className="flex-1 w-full max-w-md border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                {!show2FAInput ? (
                  <>
                    <div className="size-24 md:size-32 bg-white dark:bg-gray-800 rounded-xl mb-4 flex items-center justify-center shadow-sm">
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 text-center">Setup Required</p>
                    </div>
                    <div className="h-10 md:h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse opacity-50"></div>
                    <p className="text-[10px] text-gray-400 mt-3">Security flow will appear here after initiation.</p>
                  </>
                ) : (
                  <div className="w-full animate-in fade-in duration-300">
                    <p className="text-sm font-bold text-text-main dark:text-white mb-4">Enter the code from your app:</p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="size-8 md:size-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center font-mono text-lg font-bold">
                          {i === 0 ? <span className="animate-pulse">|</span> : ''}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShow2FAInput(false)} className="flex-1 py-2 text-xs font-bold text-text-muted hover:text-text-main">Cancel</button>
                      <button className="flex-1 py-2 bg-text-main dark:bg-white text-white dark:text-text-main rounded-lg text-xs font-bold">Verify</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Log */}
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
                  <LogEntry 
                    icon="upload_file" 
                    iconColor="text-primary"
                    action="Report Uploaded" 
                    device="Chrome / macOS" 
                    ip="192.168.1.104" 
                    time="Oct 24, 2023 · 14:22" 
                  />
                  <LogEntry 
                    icon="login" 
                    iconColor="text-blue-500"
                    action="System Login" 
                    device="Safari / iPhone" 
                    ip="172.56.21.89" 
                    time="Oct 24, 2023 · 09:15" 
                  />
                  <LogEntry 
                    icon="share" 
                    iconColor="text-primary"
                    action="Doctor Link Created" 
                    device="Chrome / macOS" 
                    ip="192.168.1.104" 
                    time="Oct 22, 2023 · 16:45" 
                  />
                  <LogEntry 
                    icon="lock_reset" 
                    iconColor="text-text-main dark:text-gray-400"
                    action="Password Changed" 
                    device="Direct Request" 
                    ip="192.168.1.104" 
                    time="Oct 20, 2023 · 11:30" 
                  />
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 text-center">
              <button className="text-text-muted text-xs font-bold hover:text-primary transition-colors">View All Logs</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
