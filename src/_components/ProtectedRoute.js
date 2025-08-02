'use client'

import { useUser } from '@/context/UserContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // if we've finished loading and there's no user, redirect to login
    if (!loading && !user) {
      // avoid infinite loop if already on login
      if (pathname !== '/login') {
        router.replace('/login')
      }
    }
  }, [loading, user, pathname, router])

  // while checking auth show nothing / spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  // if no user after loading, bail out (redirect is happening in effect)
  if (!user) return null

  return <>{children}</>
}
