'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts/AuthContext'
import { Loader } from '@/shared/components'

export default function NotFound() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/challenges' : '/login')
    }
  }, [user, loading, router])

  return <Loader fullscreen />
}
