'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  dateOfBirth?: string
  gender?: string
  avatarColor: string
  isDefault: boolean
  createdAt: string
  _count?: {
    reports: number
  }
}

/**
 * Hook to fetch all family members for the current user
 */
export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await api.get<FamilyMember[]>('/api/family')
    
    if (error) {
      setError(error)
      setMembers([])
    } else {
      setMembers(data || [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return { members, loading, error, refetch: fetchMembers }
}

/**
 * Initialize family profile (creates "Self" if none exist)
 */
export async function initFamilyProfile() {
  return api.post<FamilyMember>('/api/family/init', {})
}

/**
 * Create a new family member
 */
export async function createFamilyMember(data: {
  name: string
  relationship: string
  dateOfBirth?: string
  gender?: string
  avatarColor?: string
}) {
  return api.post<FamilyMember>('/api/family', data)
}

/**
 * Update a family member
 */
export async function updateFamilyMember(id: string, data: {
  name?: string
  relationship?: string
  dateOfBirth?: string
  gender?: string
  avatarColor?: string
}) {
  return api.put<FamilyMember>(`/api/family/${id}`, data)
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(id: string) {
  return api.delete(`/api/family/${id}`)
}

/**
 * Set a family member as default profile
 */
export async function setDefaultProfile(id: string) {
  return api.put(`/api/family/${id}/default`, {})
}
