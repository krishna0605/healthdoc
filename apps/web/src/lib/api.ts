import { createClient } from '@/lib/supabase/client'

export const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  if (url.startsWith('http')) return url
  return `https://${url}`
}

export const API_URL = getBaseUrl()
if (typeof window !== 'undefined') {
  console.log('🔌 API Configured at:', API_URL)
}

/**
 * Get the current user's auth token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * API client with automatic auth token injection
 */
export const api = {
  /**
   * Make an authenticated GET request
   */
  async get<T = any>(endpoint: string): Promise<{ data: T; error?: string }> {
    const token = await getAuthToken()
    if (!token) {
      return { data: null as any, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { data: null as any, error: errorData.error || `Request failed: ${response.status}` }
      }

      const result = await response.json()
      return { data: result.data }
    } catch (error: any) {
      return { data: null as any, error: error.message || 'Network error' }
    }
  },

  /**
   * Make an authenticated POST request
   */
  async post<T = any>(endpoint: string, body: any): Promise<{ data: T; error?: string }> {
    const token = await getAuthToken()
    if (!token) {
      return { data: null as any, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { data: null as any, error: errorData.error || `Request failed: ${response.status}` }
      }

      const result = await response.json()
      return { data: result.data || result }
    } catch (error: any) {
      return { data: null as any, error: error.message || 'Network error' }
    }
  },

  /**
   * Make an unauthenticated POST request (for pre-login 2FA operations)
   */
  async postPublic<T = any>(endpoint: string, body: any): Promise<{ data: T; error?: string }> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { data: null as any, error: errorData.error || `Request failed: ${response.status}` }
      }

      const result = await response.json()
      return { data: result.data || result }
    } catch (error: any) {
      return { data: null as any, error: error.message || 'Network error' }
    }
  },

  /**
   * Make an authenticated PUT request
   */
  async put<T = any>(endpoint: string, body: any): Promise<{ data: T; error?: string }> {
    const token = await getAuthToken()
    if (!token) {
      return { data: null as any, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { data: null as any, error: errorData.error || `Request failed: ${response.status}` }
      }

      const result = await response.json()
      return { data: result.data || result }
    } catch (error: any) {
      return { data: null as any, error: error.message || 'Network error' }
    }
  },

  /**
   * Make an authenticated DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<{ data: T; error?: string; success?: boolean }> {
    const token = await getAuthToken()
    if (!token) {
      return { data: null as any, error: 'Not authenticated' }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { data: null as any, error: errorData.error || `Request failed: ${response.status}` }
      }

      const result = await response.json()
      return { data: result.data, success: result.success }
    } catch (error: any) {
      return { data: null as any, error: error.message || 'Network error' }
    }
  },

  /**
   * Log an activity event
   */
  async logEvent(action: string, metadata?: Record<string, any>) {
    return this.post('/api/audit/log', { action, metadata })
  }
}
