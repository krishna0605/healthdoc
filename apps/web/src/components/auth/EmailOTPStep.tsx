'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react'

interface EmailOTPStepProps {
  email: string
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onCancel: () => void
  error?: string | null
  isLoading?: boolean
}

export function EmailOTPStep({
  email,
  onVerify,
  onResend,
  onCancel,
  error,
  isLoading = false
}: EmailOTPStepProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

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

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setResendSuccess(false)
    await onResend()
    setResendSuccess(true)
    setResendCooldown(60) // 60 second cooldown
    
    // Clear success message after 3 seconds
    setTimeout(() => setResendSuccess(false), 3000)
  }

  // Mask email for privacy
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="size-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="size-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">
          Check Your Email
        </h2>
        <p className="text-text-muted dark:text-gray-400">
          We sent a verification code to
        </p>
        <p className="font-bold text-text-main dark:text-white mt-1">
          {maskedEmail}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-6 text-center">
          {error}
        </div>
      )}

      {/* Resend Success */}
      {resendSuccess && (
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400 mb-6 text-center flex items-center justify-center gap-2">
          <CheckCircle className="size-4" />
          New code sent!
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
          Code expires in 10 minutes
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
              <Mail className="size-5" />
              Verify Email
            </>
          )}
        </button>
      </form>

      {/* Resend option */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isLoading || resendCooldown > 0}
          className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`size-4 ${resendCooldown > 0 ? '' : ''}`} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification code'}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
        <p className="text-xs text-text-muted dark:text-gray-400 mb-2 font-medium">
          Didn&apos;t receive the code?
        </p>
        <ul className="text-xs text-text-muted dark:text-gray-500 space-y-1 list-disc list-inside">
          <li>Check your spam or junk folder</li>
          <li>Make sure your email is correct</li>
          <li>Wait a moment and try resending</li>
        </ul>
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
