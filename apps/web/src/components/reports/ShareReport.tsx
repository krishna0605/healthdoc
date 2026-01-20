'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, X, Globe, Clock, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ShareReportProps {
  reportId: string
  reportTitle: string
}

export function ShareReport({ reportId, reportTitle }: ShareReportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<{ url: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [expiry, setExpiry] = useState('7d')
  const supabase = createClient()

  const generateLink = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reports/${reportId}/share`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ expiresIn: expiry })
        }
      )

      if (response.ok) {
        const result = await response.json()
        setGeneratedLink(result.data)
      }
    } catch (error) {
      console.error('Failed to generate link:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                Share Report
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Share <span className="font-medium text-gray-700">"{reportTitle}"</span> securely with your doctor or family.
              </p>
            </div>

            {!generatedLink ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Expiration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['24h', '7d', '30d'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setExpiry(opt)}
                        className={`py-2 px-3 text-sm rounded-md border ${
                          expiry === opt 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {opt === '24h' ? '24 Hours' : opt === '7d' ? '7 Days' : '30 Days'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 text-sm text-blue-800">
                  <Shield className="w-5 h-5 shrink-0 text-blue-600" />
                  <p>
                    This generates a secure, unique link. Viewers won't need an account but can see the report summary and metrics.
                  </p>
                </div>

                <Button className="w-full mt-2" onClick={generateLink} disabled={loading}>
                  {loading ? 'Generating Link...' : 'Generate Secure Link'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-green-900">Link Ready!</h4>
                  <p className="text-sm text-green-700">
                    Expires on {new Date(generatedLink.expiresAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    readOnly 
                    value={generatedLink.url}
                    className="flex-1 p-2 text-sm bg-gray-50 border rounded-md text-gray-600 font-mono"
                  />
                  <Button size="icon" variant="outline" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full text-gray-500 hover:text-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
