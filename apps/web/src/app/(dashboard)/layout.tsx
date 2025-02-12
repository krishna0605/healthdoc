'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/hooks'
import { FamilyProvider, FamilyProfileSwitcher } from '@/components/family'
import { NotificationBell } from '@/components/notifications'


function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 px-6 lg:px-12 h-20 flex items-center justify-end">
          <div className="flex items-center gap-4">
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
              onClick={handleSignOut}
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
    </div>
  )
}

// Wrap layout with FamilyProvider
export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FamilyProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </FamilyProvider>
  )
}
