'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function SimpleAuthTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const testGoogleAuth = async () => {
    setLoading(true)
    setResult('Starting Google OAuth...')
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })
      
      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult('OAuth initiated successfully')
      }
    } catch (err) {
      setResult(`Exception: ${err}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">🧪 Simple Auth Test</h1>
        <p className="text-gray-600">Test Google OAuth without complex middleware</p>
        
        <button 
          onClick={testGoogleAuth}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Testing...' : '🔐 Test Google OAuth'}
        </button>
        
        {result && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}