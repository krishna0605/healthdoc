'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PasswordStrengthMeter, isPasswordValid, getPasswordRequirements } from '@/components/auth'
import { Logo } from '@/components/ui/Logo'


export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      setIsLoading(false)
      return
    }

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
      
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError

      // Create profile if user was created
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
          })

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Profile creation error:', profileError)
        }
      }

      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      
      // Log event (non-blocking)
      api.logEvent('REGISTER', { method: 'email' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

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
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-text-main dark:text-white mb-2">Create Account</h2>
            <p className="text-text-muted dark:text-gray-400">Start your personal health journey</p>
          </div>

          <div className="flex justify-center mb-8">
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="flex items-center justify-center gap-2 py-3 px-6 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 group w-full"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
               <span className="font-bold text-sm text-text-main dark:text-white">Sign up with Google</span>
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

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-main dark:text-white placeholder:text-gray-400 font-medium"
                  required
                />
              </div>
            </div>

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
              <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">Password</label>
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
              <label className="block text-sm font-bold text-text-main dark:text-gray-200 mb-2">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
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

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
                I agree to the{' '}
                <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || !agreedToTerms}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-text-muted dark:text-gray-400">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline ml-1">Sign in</Link>
          </div>
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
