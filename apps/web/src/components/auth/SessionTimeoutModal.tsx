'use client'

import { useEffect } from 'react'
import { Clock, RefreshCw, LogOut } from 'lucide-react'

interface SessionTimeoutModalProps {
  isOpen: boolean
  remainingSeconds: number
  onExtend: () => void
  onLogout: () => void
}

export function SessionTimeoutModal({ 
  isOpen, 
  remainingSeconds, 
  onExtend, 
  onLogout 
}: SessionTimeoutModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          
          {/* Icon */}
          <div className="size-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="size-8 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-center text-text-main dark:text-white mb-2">
            Session Expiring Soon
          </h2>

          {/* Description */}
          <p className="text-center text-text-muted dark:text-gray-400 mb-4">
            Your session will expire due to inactivity. Would you like to continue working?
          </p>

          {/* Countdown */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Time remaining:</p>
              <p className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-text-main dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
            <button
              onClick={onExtend}
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="size-4" />
              Stay Signed In
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
