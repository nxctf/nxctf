"use client"

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { listEventJoinRequests, reviewEventJoinRequest } from '../lib'
import type { EventJoinRequestRow } from '../types'

interface UseAdminEventJoinRequestsOptions {
  manageEventId: string
  loadEventMembers: (eventId: string) => Promise<void>
}

export function useAdminEventJoinRequests({
  manageEventId,
  loadEventMembers,
}: UseAdminEventJoinRequestsOptions) {
  const [joinRequests, setJoinRequests] = useState<EventJoinRequestRow[]>([])
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(false)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)

  const loadJoinRequests = useCallback(async (eventId: string) => {
    if (!eventId) {
      setJoinRequests([])
      return
    }
    setLoadingJoinRequests(true)
    try {
      const data = await listEventJoinRequests(eventId, 'pending')
      setJoinRequests(data)
    } finally {
      setLoadingJoinRequests(false)
    }
  }, [])

  const handleReviewRequest = useCallback(async (requestId: string, approve: boolean) => {
    if (!manageEventId) return
    setReviewingRequestId(requestId)
    try {
      await reviewEventJoinRequest(requestId, approve)
      await loadJoinRequests(manageEventId)
      await loadEventMembers(manageEventId)
      toast.success(approve ? 'Request approved' : 'Request rejected')
    } catch (err) {
      console.error(err)
      toast.error('Failed to review request')
    } finally {
      setReviewingRequestId(null)
    }
  }, [manageEventId, loadJoinRequests, loadEventMembers])

  return {
    loadJoinRequests,
    joinRequests,
    loadingJoinRequests,
    reviewingRequestId,
    handleReviewRequest,
  }
}

