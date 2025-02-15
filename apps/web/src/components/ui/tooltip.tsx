'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-black rounded shadow-sm opacity-100 transition-opacity whitespace-nowrap",
            "-top-8 left-1/2 -translate-x-1/2", // Default position: top center
            "after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-t-black after:border-x-transparent after:border-b-transparent", // Arrow
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
