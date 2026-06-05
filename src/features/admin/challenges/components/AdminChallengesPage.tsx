"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

import { useAuth } from '@/shared/contexts/AuthContext'
import APP from '@/config'

import ChallengeListPanel from './ChallengeListPanel'
import ChallengeFormDialogHost from './ChallengeFormDialogHost'
import DeleteChallengeConfirmDialog from './DeleteChallengeConfirmDialog'
import { FlagPreviewDialog } from './FlagPreviewDialog'
import { useAdminChallengesData } from '../hooks/useAdminChallengesData'
import { useChallengeForm } from '../hooks/useChallengeForm'
import { getFilteredAdminChallenges } from '../lib'
import type { AdminChallengeEventId, AdminChallengeFilterState, Challenge } from '../types'
import { AdminContentLoading, AdminPageShell } from '../../ui'

export default function AdminChallengesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

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
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("")
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

      if (urlEvent) setEventId(resolvedUrlEvent)
      if (urlAdd) {
        resetForm({ event_id: resolvedUrlEvent && resolvedUrlEvent !== 'all' ? resolvedUrlEvent : null })
        setOpenForm(true)
      }
    }

    init()
  }, [user, authLoading, searchParams, initAdminData, router, resetForm])

  // Handlers
  const handleOpenAdd = () => {
    const defaultEventId = !isGlobalAdmin && typeof eventId === 'string' ? eventId : null
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
      setDeleteConfirmInput("")
      setConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (pendingDelete && deleteConfirmInput === pendingDelete.title) {
      await removeChallenge(pendingDelete.id)
      setConfirmOpen(false)
    } else {
      toast.error("Confirmation text does not match")
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
      categoryOrder: APP.challengeCategories || [],
    })
  }, [challenges, adminScope, isGlobalAdmin, eventId, filters])

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
        categories={APP.challengeCategories || []}
        events={events}
        hideMainEventOption={!isGlobalAdmin}
        onSubmitSuccess={() => { initAdminData(true) }}
      />

      <DeleteChallengeConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pendingDelete={pendingDelete}
        confirmInput={deleteConfirmInput}
        onConfirmInputChange={setDeleteConfirmInput}
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
