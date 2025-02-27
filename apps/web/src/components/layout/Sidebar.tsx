"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    className?: string;
}

// Logo SVG component
const Logo = () => (
  <svg fill="none" viewBox="0 0 48 48" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill="currentColor" />
    <path d="M24 10L38 38H10L24 10Z" fill="white" />
  </svg>
);

interface SidebarItemProps {
  icon: string;
  href: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, href, active = false }) => (
  <Link 
    href={href} 
    className={`flex-1 md:flex-none flex justify-center py-3 md:py-2 md:w-full 
      border-t-4 md:border-t-0 md:border-l-4 
      ${active ? 'border-primary text-primary' : 'border-transparent text-gray-400'}
      transition-all rounded-lg md:rounded-none hover:bg-gray-50 dark:hover:bg-gray-700 md:hover:bg-transparent`
    }
  >
    <span className={`material-symbols-outlined text-2xl cursor-pointer hover:text-primary transition-colors ${active ? 'text-primary' : ''}`}>
      {icon}
    </span>
  </Link>
);

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Get user initials for avatar
  const userInitials = user?.user_metadata?.name 
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';
  
  // Helper to determine if an item is active
  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (pathname?.startsWith('/reports/') && path === '/reports') return true;
    return false;
  };

  return (
    <aside className={`fixed z-50 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md 
        md:w-20 md:h-full md:left-0 md:top-0 md:border-r md:border-gray-100 md:dark:border-gray-700 md:flex-col md:py-8
        w-full h-auto bottom-0 left-0 border-t border-gray-100 dark:border-gray-700 flex flex-row justify-around py-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none pb-[calc(0.5rem+env(safe-area-inset-bottom))]
        ${className}`}
    >
      {/* Desktop Logo */}
      <Link href="/" className="hidden md:flex mb-12 text-primary cursor-pointer hover:opacity-80 transition-opacity items-center justify-center">
        <div className="size-10 text-primary flex items-center justify-center">
          <Logo />
        </div>
      </Link>
      
      <nav className="flex md:flex-col gap-1 md:gap-8 w-full md:w-auto justify-between md:justify-start">
        <SidebarItem icon="grid_view" href="/dashboard" active={isActive('/dashboard')} />
        <SidebarItem icon="folder_open" href="/records" active={isActive('/records')} />
        <SidebarItem icon="show_chart" href="/history" active={isActive('/history')} />
        <SidebarItem icon="compare_arrows" href="/compare" active={isActive('/compare')} />
        <SidebarItem icon="groups" href="/family" active={isActive('/family')} />
        <SidebarItem icon="settings" href="/settings" active={isActive('/settings')} />
      </nav>

      {/* Desktop Theme Toggle & Avatar */}
      <div className="hidden md:flex mt-auto flex-col items-center gap-6 mb-8">
        <ThemeToggle />

        <Link href="/settings" className="cursor-pointer hover:scale-110 transition-transform" title="Profile & Settings">
          <div className="size-10 rounded-full bg-linear-to-tr from-green-300 to-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white font-bold text-sm">
            {userInitials}
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
