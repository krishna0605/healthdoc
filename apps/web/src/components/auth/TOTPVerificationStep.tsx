'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Shield, KeyRound, ArrowLeft, Mail } from 'lucide-react'

interface TOTPVerificationStepProps {
  onVerify: (code: string) => Promise<void>
  onUseBackupCode: () => void
  onUseEmailOTP?: () => void // NEW: Switch to email verification
  onCancel: () => void
  error?: string | null
  isLoading?: boolean
}

export function TOTPVerificationStep({
  onVerify,
  onUseBackupCode,
  onUseEmailOTP,
  onCancel,
  error,
  isLoading = false
}: TOTPVerificationStepProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (digit && index === 5) {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) {
        onVerify(fullCode)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      onVerify(pastedData)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length === 6) {
      onVerify(fullCode)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-text-muted dark:text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-6 text-center">
          {error}
        </div>
      )}

      {/* Code Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 md:gap-3 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={isLoading}
              className="size-12 md:size-14 text-center text-2xl font-bold bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
            />
          ))}
        </div>

        {/* Timer hint */}
        <p className="text-xs text-center text-text-muted mb-6">
          Code refreshes every 30 seconds
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || code.join('').length !== 6}
          className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="size-5" />
              Verify Code
            </>
          )}
        </button>
      </form>

      {/* Alternative verification options */}
      <div className="mt-6 flex flex-col items-center gap-3">
        {onUseEmailOTP && (
          <button
            type="button"
            onClick={onUseEmailOTP}
            disabled={isLoading}
            className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <Mail className="size-4" />
            Use email verification instead
          </button>
        )}
        <button
          type="button"
          onClick={onUseBackupCode}
          disabled={isLoading}
          className="text-sm text-text-muted hover:text-primary font-medium inline-flex items-center gap-1 transition-colors"
        >
          <KeyRound className="size-4" />
          Use a backup code
        </button>
      </div>

      {/* Cancel */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="text-sm text-text-muted hover:text-text-main dark:hover:text-white transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-4" />
          Try a different account
        </button>
      </div>
    </div>
  )
}

// Backup code input variant
interface BackupCodeInputProps {
  onVerify: (code: string) => Promise<void>
  onBack: () => void
  error?: string | null
  isLoading?: boolean
}

export function BackupCodeInput({
  onVerify,
  onBack,
  error,
  isLoading = false
}: BackupCodeInputProps) {
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) {
      onVerify(code.trim())
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="size-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound className="size-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">
          Enter Backup Code
        </h2>
        <p className="text-text-muted dark:text-gray-400">
          Enter one of your 8-character backup codes
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-6 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          disabled={isLoading}
          className="w-full px-4 py-3 text-center text-xl font-mono tracking-widest bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50 mb-6"
        />

        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Backup Code'
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="text-sm text-text-muted hover:text-text-main dark:hover:text-white transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to authenticator code
        </button>
      </div>
    </div>
  )
}
