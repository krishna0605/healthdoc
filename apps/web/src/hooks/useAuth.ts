'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * Hook to get and subscribe to auth state changes
 */
export type UserProfile = {
  id: string
  userId: string
  planTier: 'BASIC' | 'PRO' | 'FAMILY'
  monthlyUploadCount: number
  // add other profile fields as needed
}

export function useAuth() {
  const [user, setUser] = useState<(User & { planTier?: string, monthlyUploadCount?: number }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async (sessionUser: User | null) => {
      if (!sessionUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan_tier, monthly_upload_count')
          .eq('user_id', sessionUser.id)
          .single()

        if (!profile) {
             // Guardrail: Create profile if missing
             await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/ensure-profile`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${sessionUser.id}` } // Simplified for now, ideally use access token
             }).catch(console.error);
             
             // Retry fetch
             const { data: newProfile } = await supabase
              .from('profiles')
              .select('plan_tier, monthly_upload_count')
              .eq('user_id', sessionUser.id)
              .single()
              
             setUser({
                ...sessionUser,
                planTier: newProfile?.plan_tier || 'BASIC',
                monthlyUploadCount: newProfile?.monthly_upload_count || 0
             })
             return;
        }

        setUser({
          ...sessionUser,
          planTier: profile?.plan_tier || 'BASIC',
          monthlyUploadCount: profile?.monthly_upload_count || 0
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Fallback to basic user if profile fetch fails
        setUser(sessionUser)
      } finally {
        setIsLoading(false)
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user ?? null)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return { user, isLoading, signOut }
}
