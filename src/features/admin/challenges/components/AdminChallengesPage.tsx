"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

import { Loader } from '@/shared/components'
import { useAuth } from '@/shared/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import APP from '@/config'

import ChallengeListPanel from './ChallengeListPanel'
import ChallengeSidebar from './ChallengeSidebar'
import ChallengeFormDialogHost from './ChallengeFormDialogHost'
import DeleteChallengeConfirmDialog from './DeleteChallengeConfirmDialog'
import { FlagPreviewDialog } from './FlagPreviewDialog'
import { useAdminChallengesData } from '../hooks/useAdminChallengesData'
import { useChallengeForm } from '../hooks/useChallengeForm'
import { getFilteredAdminChallenges } from '../lib'
import type { AdminChallengeEventId, AdminChallengeFilterState, Challenge } from '../types'

export default function AdminChallengesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const {
    challenges,
    solvers,
    siteInfo,
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
  const [nxctlGlobalAction, setNxctlGlobalAction] = useState<'up' | 'down' | null>(null)
  const [filters, setFilters] = useState<AdminChallengeFilterState>({
    category: "all",
    difficulty: "all",
    search: "",
    feature: "N",
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

      if (urlEvent) setEventId(urlEvent)
      if (urlAdd) {
        resetForm({ event_id: urlEvent && urlEvent !== 'all' ? urlEvent : null })
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

  const handleNxctlGlobalAction = async (action: 'up' | 'down') => {
    if (action === 'down' && !window.confirm('Stop all NXCTL services?')) return

    setNxctlGlobalAction(action)
    const toastId = toast.loading(`${action === 'up' ? 'Starting' : 'Stopping'} all NXCTL services...`)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        toast.error('Admin session not found', { id: toastId })
        return
      }

      const res = await fetch('/api/nxctl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, all: true }),
      })
      const data = await res.json()

      if (!res.ok) {
        const detail = typeof data?.detail === 'string'
          ? data.detail
          : data?.detail?.message || data?.error || 'Unknown error'
        toast.error(`NXCTL ${action} all failed: ${detail}`, { id: toastId })
        return
      }

      toast.success(`NXCTL ${action} all completed`, { id: toastId })
    } catch (error) {
      console.error(`Failed to run NXCTL ${action} all`, error)
      toast.error(`NXCTL ${action} all failed`, { id: toastId })
    } finally {
      setNxctlGlobalAction(null)
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

  if (authLoading || dataLoading) return <Loader fullscreen />
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
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
            nxctlGlobalAction={nxctlGlobalAction}
            onNxctlGlobalAction={handleNxctlGlobalAction}
            onEdit={handleOpenEdit}
            onDelete={handleAskDelete}
            onViewFlag={handleViewFlag}
            onToggleMaintenance={toggleChallengeMaintenance}
            onToggleActive={toggleChallengeActive}
          />

          <ChallengeSidebar
            challenges={challenges}
            solvers={solvers}
            siteInfo={siteInfo}
            isGlobalAdmin={isGlobalAdmin}
            onViewAllSolvers={() => router.push('/admin/solvers')}
          />
        </div>
      </main>

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
    </div>
  )
}
