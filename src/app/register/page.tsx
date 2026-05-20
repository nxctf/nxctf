'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts/AuthContext'
import Loader from '@/shared/components/Loader'
import { AuthPageShell } from '@/features/auth/components/ui/AuthPageShell'
import RegisterForm from '@/features/auth/components/RegisterForm'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) router.push('/challenges')
  }, [user, authLoading, router])

  if (authLoading) return <Loader fullscreen />

  return (
    <AuthPageShell>
      <div className="w-full max-w-lg">
        <RegisterForm />
      </div>
    </AuthPageShell>
  )
}
