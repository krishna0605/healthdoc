'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check, RefreshCw, QrCode, Key, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// API helper for 2FA endpoints
async function fetch2FA(endpoint: string, options?: RequestInit) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<{ isEnabled: boolean; setupComplete: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Setup state
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)
  
  // Disable state
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)

  // Load 2FA status
  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setIsLoading(true)
      const result = await fetch2FA('/status')
      setStatus(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load 2FA status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup = async () => {
    try {
      setError(null)
      setIsLoading(true)
      const result = await fetch2FA('/setup', { method: 'POST' })
      setSetupData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      setIsVerifying(true)
      await fetch2FA('/verify', { 
        method: 'POST', 
        body: JSON.stringify({ code: verifyCode }) 
      })
      setShowBackupCodes(true)
      setStatus({ isEnabled: true, setupComplete: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      setIsDisabling(true)
      await fetch2FA('/disable', { 
        method: 'POST', 
        body: JSON.stringify({ code: disableCode }) 
      })
      setStatus({ isEnabled: false, setupComplete: false })
      setShowDisableModal(false)
      setDisableCode('')
      setSetupData(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setIsDisabling(false)
    }
  }

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'))
      setBackupCodesCopied(true)
      setTimeout(() => setBackupCodesCopied(false), 2000)
    }
  }

  const finishSetup = () => {
    setSetupData(null)
    setShowBackupCodes(false)
    setVerifyCode('')
  }

  if (isLoading && !setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/settings" 
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-black text-text-main dark:text-white">Security Settings</h1>
        <p className="text-text-muted mt-1">Manage two-factor authentication and account security</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}

      {/* 2FA Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-xl flex items-center justify-center ${
              status?.isEnabled 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {status?.isEnabled ? (
                <ShieldCheck className="size-6 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="size-6 text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-text-main dark:text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-text-muted">
                {status?.isEnabled 
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              status?.isEnabled 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {status?.isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Not enabled - show enable button or setup flow */}
          {!status?.isEnabled && !setupData && (
            <div className="text-center py-8">
              <QrCode className="size-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="font-bold text-text-main dark:text-white mb-2">Enable Two-Factor Authentication</h3>
              <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
                Use an authenticator app like Google Authenticator to generate verification codes.
              </p>
              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
                Enable 2FA
              </button>
            </div>
          )}

          {/* Setup flow - show QR code */}
          {setupData && !showBackupCodes && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-bold text-text-main dark:text-white mb-4">Scan QR Code</h3>
                {/* QR Code placeholder - render using data URL */}
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  <div className="bg-gray-100 size-48 flex items-center justify-center rounded-lg">
                    <QrCode className="size-20 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Open Google Authenticator and scan
                  </p>
                </div>
                
                {/* Manual entry */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
                  <p className="text-xs text-text-muted mb-2">Or enter this code manually:</p>
                  <code className="text-sm font-mono text-primary break-all">{setupData.secret}</code>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">
                    Enter 6-digit code from authenticator
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isVerifying || verifyCode.length !== 6}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Verify & Enable
                </button>
              </form>
            </div>
          )}

          {/* Backup codes display */}
          {showBackupCodes && setupData?.backupCodes && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="size-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-text-main dark:text-white mb-2">2FA Enabled!</h3>
                <p className="text-sm text-text-muted">Save your backup codes somewhere safe</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    These codes will only be shown once. Store them securely!
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 px-3 py-2 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-text-main dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  {backupCodesCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                  {backupCodesCopied ? 'Copied!' : 'Copy Codes'}
                </button>
                <button
                  onClick={finishSetup}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Enabled - show management options */}
          {status?.isEnabled && !setupData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Key className="size-5 text-text-muted" />
                  <span className="font-medium text-text-main dark:text-white">Backup Codes</span>
                </div>
                <button 
                  className="text-sm text-primary font-bold hover:underline"
                  onClick={() => {/* TODO: Regenerate backup codes */}}
                >
                  Regenerate
                </button>
              </div>

              <button
                onClick={() => setShowDisableModal(true)}
                className="w-full py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldOff className="size-4" />
                Disable Two-Factor Authentication
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disable Modal */}
      {showDisableModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowDisableModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-text-main dark:text-white mb-4">Disable 2FA</h3>
              <p className="text-text-muted mb-6">
                Enter your authenticator code to disable two-factor authentication.
              </p>
              
              <form onSubmit={handleDisable} className="space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDisableModal(false)}
                    className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-text-main dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDisabling || disableCode.length !== 6}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDisabling && <Loader2 className="size-4 animate-spin" />}
                    Disable
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
