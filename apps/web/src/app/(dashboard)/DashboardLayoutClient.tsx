'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/hooks'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { FamilyProvider, FamilyProfileSwitcher } from '@/components/family'
import { NotificationBell } from '@/components/notifications'
import { SearchBar } from '@/components/dashboard/SearchBar'
import { SignOutModal, SessionTimeoutModal } from '@/components/auth'


function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Session timeout - 30 minutes idle = auto logout, warn at 5 min remaining
  const { isWarningVisible, remainingSeconds, extendSession } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
  })

  const handleSignOutClick = () => {
    setShowSignOutModal(true)
  }

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      // signOut now handles the redirect internally
    } catch (error) {
      console.error('Sign out failed:', error)
      setIsSigningOut(false)
      setShowSignOutModal(false)
    }
  }

  const handleTimeoutLogout = async () => {
    await signOut()
  }

  // Get user initials for avatar
  const userInitials = user?.user_metadata?.name 
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-background-dark font-display text-text-main dark:text-gray-100">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-20 transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 px-6 lg:px-12 h-20 flex items-center justify-between gap-4">
          {/* Search Bar - Global */}
          <div className="flex-1 max-w-xl">
             <SearchBar />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Mobile Theme Toggle */}
            <div className="md:hidden">
              <ThemeToggle />
            </div>
            
            {/* Family Profile Switcher */}
            <FamilyProfileSwitcher />
            
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* Sign Out Button */}
            <button 
              className="flex items-center justify-center size-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              onClick={handleSignOutClick}
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </header>

        {/* Page content with bottom padding for mobile nav */}
        <main className="p-6 lg:p-12 pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isSigningOut}
      />

      {/* Session Timeout Warning Modal */}
      <SessionTimeoutModal
        isOpen={isWarningVisible}
        remainingSeconds={remainingSeconds}
        onExtend={extendSession}
        onLogout={handleTimeoutLogout}
      />
    </div>
  )
}

// Wrap layout with FamilyProvider
export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <FamilyProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </FamilyProvider>
  )
}
