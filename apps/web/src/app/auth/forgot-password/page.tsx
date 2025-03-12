'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 w-full max-w-[500px] flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 cursor-pointer hover:opacity-80 transition-opacity">
          <Logo className="size-10" />
          <h1 className="text-3xl font-black text-text-main dark:text-white">HealthDoc</h1>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 w-full p-8 md:p-10 rounded-4xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-white dark:border-gray-700">
          
          {isSuccess ? (
            /* Success State */
            <div className="text-center">
              <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-3">Check Your Email</h2>
              <p className="text-text-muted dark:text-gray-400 mb-6">
                We&apos;ve sent a password reset link to <strong className="text-text-main dark:text-white">{email}</strong>
              </p>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-600 dark:text-blue-400 mb-6">
                <p className="font-medium">Didn&apos;t receive the email?</p>
                <ul className="mt-2 text-left list-disc list-inside space-y-1 text-xs">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure the email address is correct</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>
              <button
                onClick={() => setIsSuccess(false)}
                className="text-primary font-bold hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            /* Form State */
            <>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors mb-6"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>

              <div className="text-center mb-8">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="size-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-2">Forgot Password?</h2>
                <p className="text-text-muted dark:text-gray-400">
                  No worries! Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-main dark:text-white placeholder:text-gray-400 font-medium"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </button>
              </form>

              <div className="mt-8 text-center text-sm font-medium text-text-muted dark:text-gray-400">
                Remember your password? <Link href="/login" className="text-primary font-bold hover:underline ml-1">Sign in</Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-[10px] text-text-muted/50">
          © 2024 HealthDoc Inc. All rights reserved.
        </div>
      </div>
    </div>
  )
}
