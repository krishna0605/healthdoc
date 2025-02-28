"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

// HealthDoc Logo SVG
import { Logo } from '@/components/ui/Logo';


export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#e9eff1] dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <Logo />
          <h2 className="text-text-main dark:text-gray-50 text-xl font-black tracking-tight">HealthDoc</h2>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          <Link className="text-sm font-medium text-text-main dark:text-gray-300 hover:text-primary transition-colors" href="/features">Features</Link>
          <Link className="text-sm font-medium text-text-main dark:text-gray-300 hover:text-primary transition-colors" href="/pricing">Pricing</Link>
          <Link className="text-sm font-medium text-text-main dark:text-gray-300 hover:text-primary transition-colors" href="/about">About</Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-bold text-text-main dark:text-gray-50 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Login</Link>
          <Link href="/register" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-95">Get Started</Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-text-main dark:text-white">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <Link className="text-lg font-medium text-text-main dark:text-gray-200" href="/features">Features</Link>
          <Link className="text-lg font-medium text-text-main dark:text-gray-200" href="/pricing">Pricing</Link>
          <Link className="text-lg font-medium text-text-main dark:text-gray-200" href="/about">About</Link>
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
          <Link href="/login" className="w-full text-center font-bold text-text-main dark:text-white py-3 border border-gray-200 dark:border-gray-700 rounded-xl">Login</Link>
          <Link href="/register" className="w-full text-center font-bold bg-primary text-white py-3 rounded-xl shadow-lg shadow-primary/20">Get Started</Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
