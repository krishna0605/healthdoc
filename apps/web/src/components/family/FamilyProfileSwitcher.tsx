'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, Plus, User, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FamilyMember {
  id: string
  name: string
  relationship: string
  avatarColor: string
  isDefault: boolean
}

interface FamilyContextType {
  members: FamilyMember[]
  activeMember: FamilyMember | null
  setActiveMember: (member: FamilyMember | null) => void
  loading: boolean
  refresh: () => void
}

const FamilyContext = createContext<FamilyContextType>({
  members: [],
  activeMember: null,
  setActiveMember: () => {},
  loading: true,
  refresh: () => {}
})

export function useFamilyContext() {
  return useContext(FamilyContext)
}

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [activeMember, setActiveMemberState] = useState<FamilyMember | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMembers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/family`,
        { headers: { 'Authorization': `Bearer ${session.access_token}` } }
      )

      if (response.ok) {
        const result = await response.json()
        setMembers(result.data)

        // Restore from localStorage or use default
        const savedId = localStorage.getItem('activeFamilyMemberId')
        const defaultMember = result.data.find((m: FamilyMember) => m.isDefault)
        const savedMember = result.data.find((m: FamilyMember) => m.id === savedId)
        
        setActiveMemberState(savedMember || defaultMember || result.data[0] || null)
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const setActiveMember = (member: FamilyMember | null) => {
    setActiveMemberState(member)
    if (member) {
      localStorage.setItem('activeFamilyMemberId', member.id)
    } else {
      localStorage.removeItem('activeFamilyMemberId')
    }
  }

  return (
    <FamilyContext.Provider value={{ members, activeMember, setActiveMember, loading, refresh: fetchMembers }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function FamilyProfileSwitcher() {
  const { members, activeMember, setActiveMember, loading } = useFamilyContext()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  if (loading || members.length === 0) {
    return null // Don't show if no members
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {activeMember ? (
          <>
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: activeMember.avatarColor }}
            >
              {activeMember.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
              {activeMember.name}
            </span>
          </>
        ) : (
          <>
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Select Profile</span>
          </>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
            <div className="p-2 border-b bg-gray-50">
              <p className="text-xs font-medium text-gray-500 px-2">Switch Profile</p>
            </div>
            
            <div className="max-h-60 overflow-y-auto py-1">
              {members.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    setActiveMember(member)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                    activeMember?.id === member.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.relationship}</p>
                  </div>
                  {activeMember?.id === member.id && (
                    <Check className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t">
              <button
                onClick={() => {
                  router.push('/family')
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Manage Family Profiles
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
