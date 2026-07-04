"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

import { useAuth } from '@/shared/contexts/AuthContext'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import APP from '@/config'
import ConfirmDialog from '@/shared/components/ConfirmDialog'

import ChallengeListPanel from './ChallengeListPanel'
import ChallengeFormDialogHost from './ChallengeFormDialogHost'
import { FlagPreviewDialog } from './FlagPreviewDialog'
import { useAdminChallengesData } from '../hooks/useAdminChallengesData'
import { useChallengeForm } from '../hooks/useChallengeForm'
import { getAdminScope, getEvents, getFilteredAdminChallenges } from '../lib'
import type { AdminChallengeEventId, AdminChallengeFilterState, Challenge } from '../types'
import { AdminContentLoading, AdminPageShell } from '../../ui'

function getDefaultManagedEventId(scope: { is_global_admin: boolean; event_ids: string[] } | null, events: Array<{ id: string }>) {
  if (scope?.is_global_admin) return null
  const allowedIds = new Set(scope?.event_ids ?? [])
  return events.find((event) => allowedIds.has(String(event.id)))?.id ?? null
}

export default function AdminChallengesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { categories: dbCategories } = useCategories()

  const {
    challenges,
    events,
    adminScope,
    isLoading: dataLoading,
    isRefreshing,
    initAdminData,
    toggleChallengeActive,
    toggleChallengeMaintenance,
    removeChallenge
  } = useAdminChallengesData()

  const challengeForm = useChallengeForm()
  const {
    resetForm,
    loadChallengeForEdit,
    flagPreviewOpen,
    setFlagPreviewOpen,
    fetchedFlag,
    setFetchedFlag,
    handleViewFlag,
  } = challengeForm

  // Local Page State
  const [openForm, setOpenForm] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Challenge | null>(null)
  const [eventId, setEventId] = useState<AdminChallengeEventId>('all')
  const [filters, setFilters] = useState<AdminChallengeFilterState>({
    category: "all",
    difficulty: "all",
    search: "",
    scope: "all",
    visibility: "all",
    service: "all",
    sortBy: "points_desc",
  })

  const isGlobalAdmin = adminScope?.is_global_admin ?? false

  // URL Params Effect
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/challenges')
      return
    }

    const init = async () => {
      await initAdminData()

      const urlEvent = searchParams.get('event')
      const urlAdd = searchParams.get('add') === '1'
      const resolvedUrlEvent = urlEvent === 'main' ? null : urlEvent
      const scope = await getAdminScope()
      const eventList = await getEvents()
      const defaultManagedEventId = getDefaultManagedEventId(scope, eventList)
      const allowedEventSet = new Set(scope.event_ids ?? [])
      const canUseUrlEvent = scope.is_global_admin
        || (typeof resolvedUrlEvent === 'string' && allowedEventSet.has(resolvedUrlEvent))

      if (urlEvent) {
        setEventId(canUseUrlEvent ? resolvedUrlEvent : (defaultManagedEventId ?? 'all'))
      }
      if (urlAdd) {
        const addEventId = canUseUrlEvent && resolvedUrlEvent && resolvedUrlEvent !== 'all'
          ? resolvedUrlEvent
          : (resolvedUrlEvent === 'all' ? '' : defaultManagedEventId)
        resetForm({ event_id: addEventId })
        setOpenForm(true)
      }
    }

    init()
  }, [user, authLoading, searchParams, initAdminData, router, resetForm])

  // Handlers
  const handleOpenAdd = () => {
    const defaultEventId = eventId === 'all' ? '' : eventId
    resetForm({ event_id: defaultEventId })
    setOpenForm(true)
  }

  const handleOpenEdit = async (c: Challenge) => {
    await loadChallengeForEdit(c)
    setOpenForm(true)
  }

  const handleAskDelete = (id: string) => {
    const ch = challenges.find(c => c.id === id)
    if (ch) {
      setPendingDelete(ch)
      setConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (pendingDelete) {
      await removeChallenge(pendingDelete.id)
    }
  }

  // Memoized Filtered List
  const filteredChallenges = useMemo(() => {
    return getFilteredAdminChallenges({
      challenges,
      adminScope,
      isGlobalAdmin,
      eventId,
      filters,
      categoryOrder: dbCategories.map(c => c.name),
    })
  }, [challenges, adminScope, isGlobalAdmin, eventId, filters, dbCategories])

  if (authLoading || (dataLoading && !adminScope)) return <AdminContentLoading variant="challenges" />
  if (!user) return null

  if (dataLoading) {
    return (
      <AdminPageShell>
        <AdminContentLoading variant="challenges" />
      </AdminPageShell>
    )
  }

  return (
    <>
      <AdminPageShell>
        <div className="min-w-0">
          <ChallengeListPanel
            challenges={challenges}
            filteredChallenges={filteredChallenges}
            events={events}
            filters={filters}
            selectedEventId={eventId}
            isRefreshing={isRefreshing}
            isGlobalAdmin={isGlobalAdmin}
            onFiltersChange={setFilters}
            onEventChange={setEventId}
            onAdd={handleOpenAdd}
            onEdit={handleOpenEdit}
            onDelete={handleAskDelete}
            onViewFlag={handleViewFlag}
            onToggleMaintenance={toggleChallengeMaintenance}
            onToggleActive={toggleChallengeActive}
          />
        </div>
      </AdminPageShell>

      <ChallengeFormDialogHost
        open={openForm}
        onOpenChange={setOpenForm}
        challengeForm={challengeForm}
        categories={dbCategories.map(c => c.name)}
        events={events}
        hideMainEventOption={!isGlobalAdmin}
        onSubmitSuccess={() => { initAdminData(true) }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Challenge"
        variant="destructive"
        description="Are you sure you want to delete this challenge? This action cannot be undone."
        verificationText={pendingDelete?.title}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
      <FlagPreviewDialog
        open={flagPreviewOpen}
        onOpenChange={(v) => {
          if (!v) {
            setFlagPreviewOpen(false);
            setFetchedFlag(null);
          }
        }}
        fetchedFlag={fetchedFlag}
      />
    </>
  )
}
