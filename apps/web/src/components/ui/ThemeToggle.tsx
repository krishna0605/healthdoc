"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync state with DOM on mount
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`p-2.5 rounded-xl w-10 h-10 ${className}`} />
    );
  }

  return (
    <button 
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-xl transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-muted hover:text-primary dark:text-gray-400 dark:hover:text-white overflow-hidden group ${className}`}
      aria-label="Toggle Dark Mode"
    >
      <div className={`transition-all duration-500 ease-in-out transform ${isDark ? 'rotate-90 opacity-0 absolute' : 'rotate-0 opacity-100'}`}>
        <Moon className="size-5" />
      </div>
      <div className={`transition-all duration-500 ease-in-out transform ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`}>
        <Sun className="size-5" />
      </div>
    </button>
  );
};

export default ThemeToggle;
