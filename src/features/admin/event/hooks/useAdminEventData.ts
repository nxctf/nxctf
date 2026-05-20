"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts/AuthContext'
import { isGlobalAdmin } from '../lib'
import type { Event } from '../types'
import { useAdminEventBulkChallenges } from './useAdminEventBulkChallenges'
import { useAdminEventCrud } from './useAdminEventCrud'
import { useAdminEventJoinRequests } from './useAdminEventJoinRequests'
import { useAdminEventMembers } from './useAdminEventMembers'

export function useAdminEventData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [isAdminUser, setIsAdminUser] = useState(false)
  const [manageEventId, setManageEventId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const handleEventsLoaded = useCallback((eventList: Event[]) => {
    setManageEventId((prev) => prev || eventList[0]?.id || '')
  }, [])

  const { sortedEvents, loadEvents, ...eventCrud } = useAdminEventCrud({ onEventsLoaded: handleEventsLoaded })
  const { loadChallenges, ...bulkChallenges } = useAdminEventBulkChallenges()
  const { loadEventMembers, ...members } = useAdminEventMembers({ manageEventId })
  const { loadJoinRequests, ...joinRequests } = useAdminEventJoinRequests({
    manageEventId,
    loadEventMembers,
  })

  useEffect(() => {
    let mounted = true
    const init = async () => {
      if (authLoading) return
      if (!user) {
        router.push('/challenges')
        return
      }

      const adminCheck = await isGlobalAdmin()
      if (!mounted) return
      setIsAdminUser(adminCheck)
      if (!adminCheck) {
        router.push('/challenges')
        return
      }

      await loadEvents()
      await loadChallenges()
      if (mounted) setIsLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [authLoading, user, router, loadEvents, loadChallenges])

  useEffect(() => {
    if (!manageEventId && sortedEvents.length > 0) {
      setManageEventId(sortedEvents[0].id)
      return
    }
    if (manageEventId) {
      void loadJoinRequests(manageEventId)
      void loadEventMembers(manageEventId)
    }
  }, [
    manageEventId,
    sortedEvents,
    loadJoinRequests,
    loadEventMembers,
  ])

  return {
    user,
    authLoading,
    isLoading,
    isAdminUser,
    sortedEvents,
    manageEventId,
    setManageEventId,
    ...eventCrud,
    ...members,
    ...bulkChallenges,
    ...joinRequests,
  }
}
