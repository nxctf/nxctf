"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  adminAddEventMember,
  adminRemoveEventMember,
  getErrorMessage,
  listEventMembers,
  searchUsersByUsername,
} from '../lib'
import type { EventMemberRow, UserLite } from '../types'

interface UseAdminEventMembersOptions {
  manageEventId: string
}

export function useAdminEventMembers({ manageEventId }: UseAdminEventMembersOptions) {
  const [eventMembers, setEventMembers] = useState<EventMemberRow[]>([])
  const [loadingEventMembers, setLoadingEventMembers] = useState(false)
  const [memberActionUserId, setMemberActionUserId] = useState<string | null>(null)
  const [assignUserQuery, setAssignUserQuery] = useState('')
  const [searchedUsers, setSearchedUsers] = useState<UserLite[]>([])
  const [loadingUserSearch, setLoadingUserSearch] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [selectedCandidateUserIds, setSelectedCandidateUserIds] = useState<string[]>([])

  const loadEventMembers = useCallback(async (eventId: string) => {
    if (!eventId) {
      setEventMembers([])
      return
    }
    setLoadingEventMembers(true)
    try {
      const data = await listEventMembers(eventId)
      setEventMembers(data)
    } finally {
      setLoadingEventMembers(false)
    }
  }, [])

  useEffect(() => {
    const q = assignUserQuery.trim()
    if (!manageEventId || q.length < 2) {
      setSearchedUsers([])
      setLoadingUserSearch(false)
      return
    }

    let canceled = false
    setLoadingUserSearch(true)

    const timer = setTimeout(async () => {
      try {
        const data = await searchUsersByUsername(q, 12)
        if (!canceled) setSearchedUsers(data)
      } catch (err) {
        if (!canceled) {
          console.error(err)
          setSearchedUsers([])
        }
      } finally {
        if (!canceled) setLoadingUserSearch(false)
      }
    }, 250)

    return () => {
      canceled = true
      clearTimeout(timer)
    }
  }, [assignUserQuery, manageEventId])

  const clearCandidateSelection = useCallback(() => {
    setSelectedCandidateUserIds([])
  }, [])

  const handleQuickAddMember = useCallback(async (targetUserId: string) => {
    if (!manageEventId) {
      toast.error('Select an event first')
      return
    }
    setMemberActionUserId(targetUserId)
    try {
      await adminAddEventMember(manageEventId, targetUserId)
      await loadEventMembers(manageEventId)
      setAssignUserQuery('')
      setSearchedUsers([])
      clearCandidateSelection()
      toast.success('Member added to event')
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, 'Failed to add member'))
    } finally {
      setMemberActionUserId(null)
    }
  }, [manageEventId, loadEventMembers, clearCandidateSelection])

  const candidateUsers = useMemo(() => {
    const joinedSet = new Set(eventMembers.map((m) => m.user_id))
    return searchedUsers.filter((u) => !joinedSet.has(u.id)).slice(0, 8)
  }, [searchedUsers, eventMembers])

  const toggleCandidateSelection = useCallback((targetUserId: string) => {
    setSelectedCandidateUserIds((prev) => (prev.includes(targetUserId) ? prev.filter((id) => id !== targetUserId) : [...prev, targetUserId]))
  }, [])

  const selectAllCandidates = useCallback(() => {
    setSelectedCandidateUserIds(candidateUsers.map((u) => u.id))
  }, [candidateUsers])

  const handleQuickAddSelectedMembers = useCallback(async () => {
    if (!manageEventId) {
      toast.error('Select an event first')
      return
    }
    if (selectedCandidateUserIds.length === 0) {
      toast.error('No user selected')
      return
    }

    setMemberActionUserId('__bulk__')
    try {
      await Promise.all(selectedCandidateUserIds.map((userId) => adminAddEventMember(manageEventId, userId)))
      await loadEventMembers(manageEventId)
      clearCandidateSelection()
      setAssignUserQuery('')
      setSearchedUsers([])
      toast.success(`${selectedCandidateUserIds.length} member(s) added to event`)
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, 'Failed to add selected members'))
    } finally {
      setMemberActionUserId(null)
    }
  }, [manageEventId, selectedCandidateUserIds, loadEventMembers, clearCandidateSelection])

  const handleRemoveMember = useCallback(async (targetUserId: string) => {
    if (!manageEventId) return
    setMemberActionUserId(targetUserId)
    try {
      await adminRemoveEventMember(manageEventId, targetUserId)
      await loadEventMembers(manageEventId)
      toast.success('Member removed from event')
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, 'Failed to remove member'))
    } finally {
      setMemberActionUserId(null)
    }
  }, [manageEventId, loadEventMembers])

  const filteredEventMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    if (!q) return eventMembers
    return eventMembers.filter((m) => m.username.toLowerCase().includes(q) || m.user_id.toLowerCase().includes(q))
  }, [eventMembers, memberQuery])

  useEffect(() => {
    const visibleIds = new Set(candidateUsers.map((u) => u.id))
    setSelectedCandidateUserIds((prev) => prev.filter((id) => visibleIds.has(id)))
  }, [candidateUsers])

  return {
    loadEventMembers,
    assignUserQuery,
    setAssignUserQuery,
    loadingUserSearch,
    candidateUsers,
    selectedCandidateUserIds,
    toggleCandidateSelection,
    selectAllCandidates,
    clearCandidateSelection,
    handleQuickAddSelectedMembers,
    memberActionUserId,
    handleQuickAddMember,
    memberQuery,
    setMemberQuery,
    loadingEventMembers,
    filteredEventMembers,
    handleRemoveMember,
  }
}

