'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SearchX } from 'lucide-react'
import Loader from '@/shared/components/Loader'
import UserProfile from '@/features/users/components/UserProfile'
import { UserEmptyState } from '@/features/users/components/ui/UserEmptyState'
import { UserProfileService } from '@/features/users/services/user-profile.service'
import { useAuth } from '@/shared/contexts/AuthContext'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, router, user])

  useEffect(() => {
    const currentUserId = user?.id
    if (!currentUserId) return
    let cancelled = false

    async function loadUser(): Promise<void> {
      setLoading(true)
      setError(null)
      const username = decodeURIComponent(String(params.username ?? ''))
      const userData = await UserProfileService.getUserByUsername(username)

      if (cancelled) return
      if (!userData) {
        setError('User not found')
        setLoading(false)
        return
      }
      if (userData.id === currentUserId) {
        router.replace('/profile')
        return
      }
      setUserId(userData.id)
      setLoading(false)
    }

    loadUser().catch(() => {
      if (!cancelled) {
        setError('Failed to load user profile')
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [params.username, router, user])

  if (authLoading || loading) return <Loader fullscreen />
  if (!user) return null
  if (error || !userId) {
    return (
      <UserEmptyState
        icon={SearchX}
        title={error ?? 'User not found'}
        description="The profile you are looking for is unavailable."
      />
    )
  }

  return (
    <AppSidebarShell
      title="User Profile"
      subtitle="Public user profile and challenge progress."
      sidebar={
        <AppPageSidebar
          title="User Profile"
          description="Inspect player profile context and related routes."
          links={[
            { href: '/scoreboard', label: 'Scoreboard', description: 'Ranking overview.' },
            { href: '/teams/scoreboard', label: 'Team Rank', description: 'Team standings.' },
            { href: '/profile', label: 'My Profile', description: 'Return to your account.' },
          ]}
        />
      }
      mobileSidebarTitle="User Profile"
    >
      <UserProfile userId={userId} loading={false} onBack={() => router.back()} />
    </AppSidebarShell>
  )
}
