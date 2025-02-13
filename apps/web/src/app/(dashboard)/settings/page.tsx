'use client'

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { usePreferences } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useTwoFactor, SetupData } from '@/hooks/useTwoFactor';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { ActivityLog } from '@/components/settings/ActivityLog';
import { FadeIn } from '@/components/animations/FadeIn';

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
  const { status: twoFactorStatus, setup2FA, verify2FA, disable2FA, loading: twoFactorLoading, error: twoFactorError } = useTwoFactor();
  
  const [saving, setSaving] = useState(false);
  
  // 2FA State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

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

  const handleStart2FASetup = async () => {
    setIsSettingUp2FA(true);
    const data = await setup2FA();
    if (data) {
      setSetupData(data);
    } else {
      setIsSettingUp2FA(false); // Reset on error
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) return;
    
    const success = await verify2FA(verificationCode);
    if (success && setupData) {
      setBackupCodes(setupData.backupCodes);
      setIsSettingUp2FA(false);
      setSetupData(null);
      setVerificationCode('');
    }
  };

  const handleDisable2FA = async () => {
    // For simplicity, we'll ask for code confirmation in a real app
    // Here we'll just disable if they confirm the dialog
    if (window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
        // In a real flow, prompt for TOTP code first. 
        // For this demo, we assume the user is authenticated in the session.
        // NOTE: The disable2FA hook expects a code, so we might need a prompt.
        const code = prompt('Please enter your 2FA code to confirm disabling:');
        if (code) {
           await disable2FA(code);
        }
    }
  };

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div className="w-full flex justify-between items-start md:block">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 dark:text-white">Account Settings</h1>
            <p className="text-text-muted dark:text-gray-400 text-sm md:text-lg">Manage your security preferences and notifications.</p>
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

      <div className="space-y-8">
          
          {/* Notification Preferences */}
          <FadeIn delay={0.1}>
            <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 md:p-10 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
              <h3 className="text-xl font-bold mb-2 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">notifications</span>
                Notification Preferences
              </h3>
              <p className="text-text-muted dark:text-gray-400 text-sm mb-8">Control how and when you receive health analysis updates.</p>

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
            </section>
          </FadeIn>

          {/* 2FA Section */}
          <FadeIn delay={0.2}>
            <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 md:p-10 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">shield_person</span>
                    Two-Factor Authentication
                  </h3>
                  <p className="text-text-muted dark:text-gray-400 text-sm">Add an extra layer of security to your health data.</p>
                </div>
                <span className={`px-3 py-1 font-bold rounded-lg uppercase tracking-wider text-xs ${twoFactorStatus.isEnabled ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                   {twoFactorStatus.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                
                {/* Left Side: Instructions / Status */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">perm_device_information</span>
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white text-base">Authenticator App</h4>
                      <p className="text-xs text-text-muted max-w-xs mt-1">Use apps like Google Authenticator or Authy to generate secure, one-time codes.</p>
                    </div>
                  </div>
                  
                  {!twoFactorStatus.isEnabled ? (
                    !isSettingUp2FA ? (
                       <button 
                         onClick={handleStart2FASetup}
                         disabled={twoFactorLoading}
                         className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm md:text-base flex items-center justify-center gap-2"
                       >
                         {twoFactorLoading ? 'Loading...' : 'Setup 2FA'}
                       </button>
                    ) : (
                      <div className="space-y-4">
                          <p className="text-sm text-text-muted">1. Scan the QR code with your authenticator app.</p>
                          <p className="text-sm text-text-muted">2. Enter the 6-digit code below to verify.</p>
                          <input 
                              type="text" 
                              maxLength={6}
                              placeholder="000000"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-center text-lg tracking-widest outline-none dark:text-white"
                          />
                           <div className="flex gap-2">
                             <button onClick={() => { setIsSettingUp2FA(false); setSetupData(null); }} className="flex-1 py-3 text-sm font-bold text-text-muted hover:text-text-main bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">Cancel</button>
                             <button 
                               onClick={handleVerify2FA} 
                               disabled={verificationCode.length !== 6 || twoFactorLoading}
                               className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                {twoFactorLoading ? 'Verifying...' : 'Verify'}
                             </button>
                           </div>
                           {twoFactorError && <p className="text-xs text-red-500 font-bold text-center">{twoFactorError}</p>}
                      </div>
                    )
                  ) : (
                      <button 
                         onClick={handleDisable2FA}
                         className="w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 py-3.5 rounded-xl font-bold transition-all text-sm md:text-base"
                      >
                         Disable 2FA
                      </button>
                  )}
                </div>

                {/* Right Side: QR Code / Backup Codes */}
                <div className="flex-1 w-full max-w-md border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[250px] relative bg-white dark:bg-gray-800">
                  {twoFactorStatus.isEnabled && !backupCodes ? (
                      <div className="flex flex-col items-center">
                          <div className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                              <Check className="size-8" />
                          </div>
                          <h4 className="text-lg font-bold dark:text-white mb-2">2FA is complete</h4>
                          <p className="text-sm text-text-muted">Your account is secured with two-factor authentication.</p>
                      </div>
                  ) : backupCodes ? (
                      <div className="w-full animate-in fade-in zoom-in duration-300">
                           <h4 className="text-lg font-bold dark:text-white mb-2 text-red-500 flex items-center justify-center gap-2">
                              <AlertTriangle className="size-5" />
                              Save these backup codes!
                           </h4>
                           <p className="text-xs text-text-muted mb-4">If you lose access to your device, these will be the only way to access your account.</p>
                           <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
                              {backupCodes.map((code, i) => (
                                  <code key={i} className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{code}</code>
                              ))}
                           </div>
                           <button 
                              onClick={() => copyToClipboard(backupCodes.join('\n'), setCopiedBackup)}
                              className="flex items-center justify-center gap-2 text-xs font-bold text-primary hover:underline w-full"
                           >
                              {copiedBackup ? <Check className="size-3" /> : <Copy className="size-3" />}
                              {copiedBackup ? 'Copied!' : 'Copy to clipboard'}
                           </button>
                           <button onClick={() => setBackupCodes(null)} className="mt-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">Done</button>
                      </div>
                  ) : isSettingUp2FA && setupData ? (
                    <div className="w-full animate-in fade-in duration-300 flex flex-col items-center">
                      <div className="bg-white p-2 rounded-xl shadow-sm mb-4">
                          <QRCodeSVG value={setupData.qrCodeUrl} size={160} level="M" />
                      </div>
                      <div className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl flex items-center justify-between gap-2 border border-gray-100 dark:border-gray-700">
                          <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{setupData.secret}</code>
                          <button 
                              onClick={() => copyToClipboard(setupData.secret, setCopiedSecret)}
                              className="text-gray-400 hover:text-primary transition-colors p-1"
                              title="Copy Secret"
                          >
                              {copiedSecret ? <Check className="size-4" /> : <Copy className="size-4" />}
                          </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">Can't scan? Enter this code manually.</p>
                    </div>
                  ) : (
                    <>
                      <div className="size-24 md:size-32 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-4 flex items-center justify-center shadow-inner">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 text-center">Setup Required</p>
                      </div>
                      <p className="text-[10px] text-gray-400">Security flow will appear here after initiation.</p>
                    </>
                  )}
                </div>
              </div>
            </section>
          </FadeIn>

          {/* Activity Log - Real Data */}
          <FadeIn delay={0.3}>
            <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 md:p-10 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
               <h3 className="text-xl font-bold mb-2 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Activity Log
               </h3>
               <p className="text-text-muted dark:text-gray-400 text-sm mb-8">Recent actions performed on your account.</p>
               <ActivityLog />
            </section>
          </FadeIn>
      </div>
    </div>
  );
}
