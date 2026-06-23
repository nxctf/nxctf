'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '@/shared/types'
import { BannedOverlay } from '@/features/auth'

type AuthContextType = {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    import('@/features/auth/services/auth.service')
      .then(({ AuthService }) => AuthService.getCurrentUser())
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const isBanned = user && !user.is_admin && user.banned_until && new Date(user.banned_until) > new Date()

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {isBanned ? <BannedOverlay user={user} variant="fullscreen" /> : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
