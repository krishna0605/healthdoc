'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { PasswordStrengthMeter, isPasswordValid, getPasswordRequirements } from '@/components/auth'


export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Check if user has a valid reset session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // User should have a session from the reset link
      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (!isPasswordValid(password)) {
      const reqs = getPasswordRequirements(password)
      const missing = []
      if (!reqs.minLength) missing.push('8+ characters')
      if (!reqs.hasLowercase) missing.push('lowercase letter')
      if (!reqs.hasUppercase) missing.push('uppercase letter')
      if (!reqs.hasNumber) missing.push('number')
      setError(`Password requirements not met: ${missing.join(', ')}`)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error
      
      // Sign out after password reset for security
      await supabase.auth.signOut()
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-text-main dark:text-white font-medium">Verifying reset link...</span>
      </div>
    )
  }

  // Invalid/expired session
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
        <div className="bg-white dark:bg-gray-800 w-full max-w-[500px] p-8 md:p-10 rounded-4xl shadow-xl text-center">
          <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">link_off</span>
          </div>
          <h2 className="text-2xl font-black text-text-main dark:text-white mb-3">Link Expired</h2>
          <p className="text-text-muted dark:text-gray-400 mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Link 
            href="/auth/forgot-password"
            className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all"
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
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
              <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-3">Password Updated!</h2>
              <p className="text-text-muted dark:text-gray-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link 
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                <ShieldCheck className="size-5" />
                Sign In
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-8">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="size-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-2">Reset Password</h2>
                <p className="text-text-muted dark:text-gray-400">
                  Create a new secure password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-main dark:text-white placeholder:text-gray-400 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">Confirm New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-11 pr-12 py-3.5 bg-white dark:bg-gray-900 border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none text-text-main dark:text-white placeholder:text-gray-400 font-medium ${
                        confirmPassword && confirmPassword !== password 
                          ? 'border-red-300 dark:border-red-700 focus:border-red-500' 
                          : confirmPassword && confirmPassword === password
                            ? 'border-green-300 dark:border-green-700 focus:border-green-500'
                            : 'border-gray-200 dark:border-gray-700 focus:border-primary'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">error</span>
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Passwords match
                    </p>
                  )}
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
                  Reset Password
                </button>
              </form>
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
