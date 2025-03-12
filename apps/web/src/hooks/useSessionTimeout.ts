import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number      // Inactivity timeout (default: 30)
  warningMinutes?: number      // Warning before timeout (default: 5)
  onTimeout?: () => void       // Custom timeout handler
  onWarning?: () => void       // Custom warning handler
}

interface SessionTimeoutState {
  isWarningVisible: boolean
  remainingSeconds: number
  resetTimer: () => void
  extendSession: () => void
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}): SessionTimeoutState {
  const {
    timeoutMinutes = 30,
    warningMinutes = 5,
    onTimeout,
    onWarning
  } = options

  const { user, signOut } = useAuth()
  
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = warningMinutes * 60 * 1000

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const handleTimeout = useCallback(async () => {
    clearAllTimers()
    setIsWarningVisible(false)
    
    if (onTimeout) {
      onTimeout()
    } else {
      // Default: sign out user
      await signOut()
    }
  }, [onTimeout, signOut, clearAllTimers])

  const handleWarning = useCallback(() => {
    setIsWarningVisible(true)
    setRemainingSeconds(warningMinutes * 60)
    
    if (onWarning) {
      onWarning()
    }

    // Start countdown
    countdownRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onWarning, warningMinutes])

  const resetTimer = useCallback(() => {
    if (!user) return
    
    lastActivityRef.current = Date.now()
    clearAllTimers()
    setIsWarningVisible(false)
    setRemainingSeconds(0)

    // Set warning timer
    warningRef.current = setTimeout(() => {
      handleWarning()
    }, timeoutMs - warningMs)

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, timeoutMs)
  }, [user, timeoutMs, warningMs, handleWarning, handleTimeout, clearAllTimers])

  const extendSession = useCallback(() => {
    setIsWarningVisible(false)
    setRemainingSeconds(0)
    resetTimer()
  }, [resetTimer])

  // Activity listeners
  useEffect(() => {
    if (!user) return

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    
    const handleActivity = () => {
      // Only reset if not in warning state and enough time has passed
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (!isWarningVisible && timeSinceLastActivity > 1000) {
        resetTimer()
      }
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Initial timer setup
    resetTimer()

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      clearAllTimers()
    }
  }, [user, isWarningVisible, resetTimer, clearAllTimers])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  return {
    isWarningVisible,
    remainingSeconds,
    resetTimer,
    extendSession
  }
}
