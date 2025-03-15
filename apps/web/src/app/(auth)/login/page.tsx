'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/ui/Logo'
import { TOTPVerificationStep, BackupCodeInput, EmailOTPStep } from '@/components/auth'

// Login step states
type LoginStep = 'credentials' | 'totp' | 'backup_code' | 'email_otp'

function LoginForm() {
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  
  // Login step state
  const [step, setStep] = useState<LoginStep>('credentials')
  
  // Track if we are actively submitting the login form to prevent auto-redirect
  const loginInProgress = useRef(false)
  
  // Credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // 2FA state
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  
  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user, isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setRedirectTo(params.get('redirectTo') || '/dashboard')
    }
  }, [])
  
  // Check if component is mounted to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  
  useEffect(() => {
    if (user && isMounted && !isAuthLoading && !loginInProgress.current) {
      // Only redirect if:
      // 1. User is authenticated
      // 2. We are NOT currently in the middle of a login submission (checked via ref)
      // This allows the handleCredentialsSubmit flow to handle the redirect manually
      // after 2FA checks are complete.
      router.push(redirectTo)
    }
  }, [user, router, redirectTo, isMounted, isAuthLoading])

  if (isAuthLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-text-main dark:text-white font-medium">Redirecting...</span>
      </div>
    )
  }

  // Reset to credentials step
  const resetLogin = () => {
    setStep('credentials')
    setError(null)
    setPendingUserId(null)
    setPassword('')
  }

  // Step 1: Validate credentials and check 2FA status
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    loginInProgress.current = true

    try {
      const supabase = createClient()
      
      // First, validate credentials with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      
      if (!authData.user) {
        throw new Error('Failed to authenticate')
      }

      // Check if user has 2FA enabled
      const { data: preLoginData } = await api.post<{ requires2FA: boolean; requiresEmailOTP: boolean; userId: string }>('/api/auth/pre-login', { email })
      
      if (preLoginData?.requires2FA) {
        // User has 2FA enabled - sign out from partial session and show TOTP screen
        await supabase.auth.signOut()
        setPendingUserId(authData.user.id)
        setStep('totp')
      } else {
        // No TOTP set up - Email OTP is mandatory fallback for ALL users
        await supabase.auth.signOut()
        setPendingUserId(authData.user.id)
        
        // Send email OTP
        await api.post('/api/auth/send-email-otp', { 
          email, 
          userId: authData.user.id 
        })
        
        setStep('email_otp')
      }
    } catch (err) {
      console.error('Login error:', err) // Debug log
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      loginInProgress.current = false
    } finally {
      setIsLoading(false)
      // Note: We don't reset loginInProgress here universally.
      // If successful, we want it to remain true so the useEffect doesn't trigger.
      // If we moved to step 'totp'/'email_otp', we've signed out, so user is null, effect won't trigger.
    }
  }

  // Step 2a: Verify TOTP code
  const handleTOTPVerify = async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate TOTP with our API
      const { data, error: apiError } = await api.post<{ success: boolean; verified: boolean }>('/api/auth/validate-2fa-login', {
        userId: pendingUserId,
        code,
        isBackupCode: false
      })

      if (apiError || !data?.verified) {
        setError(apiError || 'Invalid verification code')
        setIsLoading(false)
        return
      }

      // TOTP verified - now sign in again to get session
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Log successful login
      await api.logEvent('LOGIN')
      
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2b: Verify backup code
  const handleBackupCodeVerify = async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await api.post<{ success: boolean; verified: boolean }>('/api/auth/validate-2fa-login', {
        userId: pendingUserId,
        code,
        isBackupCode: true
      })

      if (apiError || !data?.verified) {
        setError(apiError || 'Invalid backup code')
        setIsLoading(false)
        return
      }

      // Backup code verified - sign in
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      await api.logEvent('LOGIN')
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Verify email OTP
  const handleEmailOTPVerify = async (code: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await api.post<{ success: boolean; verified: boolean }>('/api/auth/verify-email-otp', {
        email,
        code,
        userId: pendingUserId
      })

      if (apiError || !data?.verified) {
        setError(apiError || 'Invalid verification code')
        setIsLoading(false)
        return
      }

      // Email verified - sign in
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      await api.logEvent('LOGIN')
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Resend email OTP
  const handleResendEmailOTP = async () => {
    try {
      await api.post('/api/auth/send-email-otp', { 
        email, 
        userId: pendingUserId 
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }

  // Switch from TOTP to Email OTP (for users who prefer email or don't have phone)
  const handleSwitchToEmailOTP = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await api.post('/api/auth/send-email-otp', { 
        email, 
        userId: pendingUserId 
      })
      setStep('email_otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to provider')
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
          
          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-2">Welcome Back</h2>
                <p className="text-text-muted dark:text-gray-400">Sign in to your account to continue</p>
              </div>

              <div className="flex justify-center mb-8">
                <button 
                  onClick={() => handleOAuthLogin('google')}
                  className="flex items-center justify-center gap-2 py-3 px-6 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 group w-full"
                >
                   <div className="size-5">
                     <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                     </svg>
                   </div>
                   <span className="font-bold text-sm text-text-main dark:text-white">Sign in with Google</span>
                </button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-gray-800 px-4 text-gray-400 font-bold tracking-widest uppercase">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
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

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-text-main dark:text-gray-200">Password</label>
                    <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
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
                  Sign In
                </button>
              </form>

              <div className="mt-8 text-center text-sm font-medium text-text-muted dark:text-gray-400">
                Don&apos;t have an account? <Link href="/register" className="text-primary font-bold hover:underline ml-1">Sign up</Link>
              </div>
            </>
          )}

          {/* Step 2a: TOTP Verification */}
          {step === 'totp' && (
            <TOTPVerificationStep
              onVerify={handleTOTPVerify}
              onUseBackupCode={() => setStep('backup_code')}
              onUseEmailOTP={handleSwitchToEmailOTP}
              onCancel={resetLogin}
              error={error}
              isLoading={isLoading}
            />
          )}

          {/* Step 2b: Backup Code */}
          {step === 'backup_code' && (
            <BackupCodeInput
              onVerify={handleBackupCodeVerify}
              onBack={() => setStep('totp')}
              error={error}
              isLoading={isLoading}
            />
          )}

          {/* Step 3: Email OTP */}
          {step === 'email_otp' && (
            <EmailOTPStep
              email={email}
              onVerify={handleEmailOTPVerify}
              onResend={handleResendEmailOTP}
              onCancel={resetLogin}
              error={error}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer Badges */}
        <div className="mt-12 flex flex-col md:flex-row items-center gap-6 md:gap-8 opacity-60">
           <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-text-muted uppercase">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              HIPAA Compliant
           </div>
           <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.15em] text-text-muted uppercase">
              <span className="material-symbols-outlined text-sm">lock</span>
              256-BIT AES
           </div>
        </div>
        <div className="mt-4 text-[10px] text-text-muted/50">
          © 2024 HealthDoc Inc. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
