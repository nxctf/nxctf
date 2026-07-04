'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SearchX } from 'lucide-react'
import { getUserByUsername } from '@/features/users/services/user-profile.service'
import { useAuth } from '@/shared/contexts/AuthContext'
import UserProfile from '@/features/users/components/UserProfile'
import { UserEmptyState } from '@/features/users/components/ui/UserEmptyState'
import APP from '@/config'
import { NXCTF } from '@/_vars/const'
import PageBackground from '@/shared/components/PageBackground'

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔧 Fix trailing ? di URL
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.search === '?' &&
      window.location.hash === ''
    ) {
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [])

  // 🔐 Redirect kalau belum login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // 🔄 Fetch userId dari username
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      const username = decodeURIComponent(params.username as string)

      try {
        const userData = await getUserByUsername(username)

        if (cancelled) return

        if (!userData) {
          setError('User not found')
          setLoading(false)
          return
        }

        // 🔥 kalau buka profile sendiri → redirect biar konsisten
        if (userData.id === user.id) {
          router.replace('/profile')
          return
        }

        setUserId(userData.id)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        console.error('Error fetching user:', err)
        setError('Failed to load user profile')
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [user, params.username, router])

  // ⏳ Tunggu auth (JANGAN fullscreen biar gak flash)
  if (authLoading) {
    return null
  }

  // ⛔ Jangan render kalau belum login (redirect jalan dulu)
  if (!user) return null

  // ❌ Error UI (ini boleh beda)
  if (error) {
    return (
      <PageBackground
        className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden"
        selectionClassName="selection:bg-blue-500/30"
      >
        {(NXCTF.nxctf_logo || APP.image_logo) && (
          <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.015] dark:opacity-[0.01]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NXCTF.nxctf_logo || APP.image_logo}
              alt=""
              aria-hidden="true"
              className="h-auto w-[min(56vw,520px)] select-none object-contain"
            />
          </div>
        )}
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-5xl items-center justify-center px-6 py-16">
          <UserEmptyState
            icon={SearchX}
            title="Oops!"
            description={error}
            action={(
              <button
                type="button"
                onClick={() => router.push('/challenges')}
                className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
              >
                Back to Challenges
              </button>
            )}
            className="w-full max-w-md"
          />
        </main>
      </PageBackground>
    )
  }

  // ✅ SELALU render UserProfile (kunci anti flicker)
  return (
    <UserProfile
      userId={userId}
      loading={loading}
      error={error}
      onBack={() => router.back()}
      isCurrentUser={userId === user?.id}
    />
  )
}
