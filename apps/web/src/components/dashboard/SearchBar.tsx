"use client";

import React, { useState } from 'react';

export function SearchBar() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative flex items-center transition-all duration-300 w-full ${isFocused ? 'md:w-96' : 'md:w-64'}`}>
      <span className={`material-symbols-outlined absolute left-4 text-gray-400 pointer-events-none transition-colors ${isFocused ? 'text-primary' : ''}`}>
        search
      </span>
      <input 
        type="text" 
        placeholder="Search..." 
        className="w-full pl-12 pr-4 py-2.5 rounded-full bg-gray-100/50 dark:bg-gray-700/50 border-transparent focus:bg-white dark:focus:bg-gray-800 border focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div className="absolute right-3 flex gap-1 pointer-events-none">
        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
