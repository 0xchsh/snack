'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'

interface AuthWrapperProps {
  children: (user: User | null, loading: boolean) => React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check auth via API
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        console.log('AuthWrapper: API check result:', data)
        if (data.authenticated && data.user) {
          // Map API response to User type
          const apiUser: User = {
            id: data.user.id,
            email: data.user.email ?? '',
            username: data.user.metadata?.username || data.user.email?.split('@')[0] || 'user',
            first_name: data.user.metadata?.first_name || null,
            last_name: data.user.metadata?.last_name || null,
            profile_picture_url: data.user.metadata?.avatar_url || null,
            profile_is_public: true,
            bio: data.user.metadata?.bio || null,
            subscription_status: 'free',
            subscription_tier: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setUser(apiUser)
          console.log('AuthWrapper: User set from API')
        } else {
          setUser(null)
          console.log('AuthWrapper: No user from API')
        }
      })
      .catch(err => {
        console.error('AuthWrapper: API check failed:', err)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return <>{children(user, loading)}</>
}
