'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  reportId?: string
}

/**
 * Hook to fetch notifications for the current user
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const { data } = await api.get<{ notifications: Notification[]; unreadCount: number }>(
      '/api/user/notifications'
    )
    
    if (data) {
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    await api.put(`/api/user/notifications/${id}/read`, {})
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    await api.put('/api/user/notifications/read-all', {})
    fetchNotifications()
  }

  return { 
    notifications, 
    unreadCount, 
    loading, 
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}

/**
 * Hook to fetch user preferences
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<{
    emailOnComplete: boolean
    emailOnAbnormal: boolean
    weeklyDigest: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    const { data } = await api.get('/api/user/preferences')
    setPreferences(data || null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const updatePreferences = async (newPrefs: {
    emailOnComplete?: boolean
    emailOnAbnormal?: boolean
    weeklyDigest?: boolean
  }) => {
    const { data } = await api.put('/api/user/preferences', newPrefs)
    if (data) {
      setPreferences(data)
    }
    return data
  }

  return { preferences, loading, refetch: fetchPreferences, updatePreferences }
}
