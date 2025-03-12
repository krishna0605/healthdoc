'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'


function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    
    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error
      
      setResendSuccess(true)
      setCountdown(60) // 60 second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="z-10 w-full max-w-[500px] flex flex-col items-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-10 cursor-pointer hover:opacity-80 transition-opacity">
        <Logo className="size-10" />
        <h1 className="text-3xl font-black text-text-main dark:text-white">HealthDoc</h1>
      </Link>

      {/* Card */}
      <div className="bg-white dark:bg-gray-800 w-full p-8 md:p-10 rounded-4xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white dark:border-gray-700">
        
        <div className="text-center">
          {/* Icon */}
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="size-10 text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-3">
            Check Your Email
          </h2>
          
          <p className="text-text-muted dark:text-gray-400 mb-2">
            We&apos;ve sent a verification link to:
          </p>
          
          {email && (
            <p className="text-lg font-bold text-text-main dark:text-white mb-6">
              {email}
            </p>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">info</span>
              What to do next:
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Look for an email from HealthDoc</li>
              <li>Click the verification link in the email</li>
              <li>You&apos;ll be redirected back to sign in</li>
            </ol>
          </div>

          {/* Tips */}
          <div className="text-left mb-6">
            <p className="text-sm text-text-muted dark:text-gray-400 mb-2">
              <strong>Didn&apos;t receive it?</strong>
            </p>
            <ul className="text-xs text-text-muted dark:text-gray-500 space-y-1 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure the email address is correct</li>
              <li>Wait a few minutes and try resending</li>
            </ul>
          </div>

          {/* Resend Button */}
          {resendSuccess && (
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400 mb-4 flex items-center justify-center gap-2">
              <CheckCircle className="size-4" />
              Verification email sent!
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-4 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={isResending || countdown > 0 || !email}
            className="w-full py-3 border border-gray-200 dark:border-gray-600 text-text-main dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          >
            {isResending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-[10px] text-text-muted/50">
        © 2024 HealthDoc Inc. All rights reserved.
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
