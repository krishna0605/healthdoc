'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: { text: string; chunk_index: number; relevance_score: number }[]
}

interface ReportChatProps {
  reportId: string
  onMessagesChange?: (messages: ChatMessage[]) => void
}

export function ReportChat({ reportId, onMessagesChange }: ReportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Notify parent of message changes for PDF export
    if (onMessagesChange) {
      onMessagesChange(messages)
    }
  }, [messages, onMessagesChange])

  // Fetch suggestions and history on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const headers = {
          'Authorization': `Bearer ${session.access_token}`
        }

        // Fetch suggestions and history in parallel
        const [suggestionsRes, historyRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/${reportId}/suggestions`,
            { headers }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/${reportId}/history`,
            { headers }
          )
        ])

        if (suggestionsRes.ok) {
          const data = await suggestionsRes.json()
          setSuggestions(data.data?.suggestions || [])
        }

        if (historyRes.ok) {
          const data = await historyRes.json()
          if (data.data && Array.isArray(data.data)) {
             setMessages(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error)
      }
    }
    fetchData()
  }, [reportId, supabase])

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/${reportId}/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ question })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.data?.answer || 'Sorry, I could not find an answer.',
        sources: data.data?.sources
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Query error:', error)
      const errorMessage = error?.message?.includes('fetch') || error?.message?.includes('Failed')
        ? 'The AI service is currently unavailable. Please ensure Docker is running and the AI service is started.'
        : 'Sorry, I encountered an error processing your question. Please try again.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
        <div className="size-12 rounded-full bg-gradient-to-br from-primary to-[#256b89] flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">smart_toy</span>
        </div>
        <div>
          <h3 className="font-bold dark:text-white">Ask HealthDoc AI</h3>
          <p className="text-xs text-text-muted">Powered by medical LLM</p>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/30">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <p className="text-text-muted dark:text-gray-400 text-sm mb-6">
              Ask me anything about this report!
            </p>
            
            {/* Suggestion Chips */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    className="px-4 py-2 text-xs font-bold bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message, i) => (
            <div
              key={i}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-primary' 
                  : 'bg-gradient-to-br from-primary to-[#256b89] text-white'
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {message.role === 'user' ? 'person' : 'smart_toy'}
                </span>
              </div>
              
              {/* Message Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white dark:bg-gray-800 text-text-main dark:text-white rounded-tl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {/* Show sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Sources:</p>
                    {message.sources.slice(0, 2).map((source, j) => (
                      <p key={j} className="text-[10px] text-gray-400 truncate">
                        • {source.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-[#256b89] flex items-center justify-center text-white">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="animate-pulse">Thinking</span>
                <span className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask about your results..."
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none dark:text-white"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
