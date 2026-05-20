"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/shared/contexts/AuthContext'
import { AdminService } from '@/features/admin/services/admin.service'
import { EventService } from '@/features/events/services/event.service'
import type { EventAdminRow, UserLite } from '../types'
import {
  confirmOpenAtom,
  selectedEventIdAtom,
  selectedUserAtom,
  usernameQueryAtom,
} from '../store/adminAdmins.atoms'
import { grantEventAdminSchema } from '../lib/schema'

export function useAdminAdminsData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [isAllowed, setIsAllowed] = useState(false)
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(true)
  const [usernameQuery, setUsernameQuery] = useAtom(usernameQueryAtom)
  const [userResults, setUserResults] = useState<UserLite[]>([])
  const [selectedUser, setSelectedUser] = useAtom(selectedUserAtom)
  const [selectedEventId, setSelectedEventId] = useAtom(selectedEventIdAtom)
  const [confirmOpen, setConfirmOpen] = useAtom(confirmOpenAtom)
  const [pendingRemove, setPendingRemove] = useState<EventAdminRow | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const adminDataQuery = useQuery({
    queryKey: ['admin-admins-data'],
    queryFn: async () => {
      const [events, globalAdmins, eventAdmins] = await Promise.all([
        EventService.getEvents(),
        AdminService.getGlobalAdmins(),
        AdminService.getEventAdmins(),
      ])
      return { events, globalAdmins, eventAdmins }
    },
    enabled: isAllowed,
  })

  const resetGrantForm = useCallback(() => {
    setUsernameQuery('')
    setSelectedUser(null)
    setUserResults([])
    setSelectedEventId('')
  }, [])

  useEffect(() => {
    let mounted = true

    const initAdminsData = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/challenges')
        return
      }

      const ok = await AdminService.isGlobalAdmin()
      if (!mounted) return

      setIsAllowed(ok)
      if (!ok) {
        router.push('/challenges')
        return
      }

      await adminDataQuery.refetch()
      if (!mounted) return
      setIsLoading(false)
    }

    initAdminsData()

    return () => {
      mounted = false
    }
  }, [authLoading, user, router, adminDataQuery, isAllowed])

  useEffect(() => {
    if (!isAllowed) return

    const q = usernameQuery.trim()
    if (!q) {
      setUserResults([])
      setSelectedUser(null)
      return
    }

    if (selectedUser && selectedUser.username.toLowerCase() === q.toLowerCase()) {
      setUserResults([])
      return
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(async () => {
      const results = await AdminService.searchUsersByUsername(q, 8)
      setUserResults(results)
    }, 250)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [usernameQuery, selectedUser, isAllowed])

  const events = adminDataQuery.data?.events ?? []
  const globalAdmins = adminDataQuery.data?.globalAdmins ?? []
  const eventAdmins = adminDataQuery.data?.eventAdmins ?? []
  const submitting = adminDataQuery.isFetching
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId],
  )

  const canSubmit = !!selectedUser?.id && !!selectedEventId && !submitting

  const askRemove = useCallback((row: EventAdminRow) => {
    setPendingRemove(row)
    setConfirmOpen(true)
  }, [])

  const doRemove = useCallback(async () => {
    if (!pendingRemove) return
    try {
      await AdminService.revokeEventAdmin(pendingRemove.user_id, pendingRemove.event_id)
      toast.success('Event admin removed')
      await queryClient.invalidateQueries({ queryKey: ['admin-admins-data'] })
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove event admin')
    } finally {
      setPendingRemove(null)
    }
  }, [pendingRemove, queryClient])

  const grantMutation = useMutation({
    mutationFn: async () => {
      const payload = grantEventAdminSchema.parse({
        userId: selectedUser?.id,
        eventId: selectedEventId,
      })
      return AdminService.grantEventAdmin(payload.userId, payload.eventId)
    },
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.message || 'Failed to grant event admin')
        return
      }
      toast.success('Event admin added')
      resetGrantForm()
      await queryClient.invalidateQueries({ queryKey: ['admin-admins-data'] })
    },
    onError: () => {
      toast.error('Failed to add event admin')
    },
  })

  const doGrant = useCallback(async () => {
    await grantMutation.mutateAsync()
  }, [grantMutation])

  return {
    user,
    authLoading,
    isLoading,
    isAllowed,
    events,
    globalAdmins,
    eventAdmins,
    usernameQuery,
    setUsernameQuery,
    userResults,
    setUserResults,
    selectedUser,
    setSelectedUser,
    selectedEventId,
    setSelectedEventId,
    selectedEvent,
    submitting,
    canSubmit,
    confirmOpen,
    setConfirmOpen,
    pendingRemove,
    askRemove,
    doRemove,
    doGrant,
    resetGrantForm,
  }
}
