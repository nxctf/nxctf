'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '@/shared/components/Loader'
import UserProfile from '@/features/users/components/UserProfile'
import { useAuth } from '@/shared/contexts/AuthContext'
import { AppSidebarShell } from '@/shared/components/AppSidebarShell'
import { AppPageSidebar } from '@/shared/components/AppPageSidebar'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  if (authLoading) return <Loader fullscreen />
  if (!user) return null

  return (
    <AppSidebarShell
      title="Profile"
      subtitle="Account overview, progress, and personal settings."
      sidebar={
        <AppPageSidebar
          title="Profile"
          description="Manage account and inspect progress."
          links={[
            { href: '/profile', label: 'Overview', description: 'Stats and profile.' },
            { href: '/profile/password', label: 'Password', description: 'Security settings.' },
            { href: '/teams', label: 'Team', description: 'Team workspace.' },
          ]}
        />
      }
      mobileSidebarTitle="Profile"
    >
      <UserProfile userId={user.id} loading={false} onBack={() => router.back()} isCurrentUser />
    </AppSidebarShell>
  )
}
