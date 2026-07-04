"use client"

import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Server } from 'lucide-react'
import APP from '@/config'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import Loader from '@/shared/components/Loader'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import { AdminContentLoading, AdminPageShell, AdminPageSurface, AdminStickyToolbar, AdminTabs, useTabState } from '@/features/admin/ui'
import {
  buildLiveServiceRows,
  buildPlatformChallengeGroups,
  getFilteredLiveRows,
  getFilteredPlatformGroups,
  getUniqueOptions,
} from '../lib/admin-services-utils'
import { useAdminServicesData } from '../hooks/useAdminServicesData'
import { useChallengeForm } from '../../challenges/hooks/useChallengeForm'
import type { AdminNxctlActionTarget, AdminServiceRow, AdminServicesFilters, AdminServiceTab } from '../types'
import { FlagPreviewDialog } from '../../challenges/components/FlagPreviewDialog'
import ChallengeFormDialogHost from '../../challenges/components/ChallengeFormDialogHost'
import AdminLiveServicesTable from './AdminLiveServicesTable'
import AdminPlatformChallengesTable from './AdminPlatformChallengesTable'
import AdminServicesToolbar from './AdminServicesToolbar'

const DEFAULT_FILTERS: AdminServicesFilters = {
  search: '',
  key: 'all',
  enabled: 'all',
  requiresKey: 'all',
  keyAvailable: 'all',
  validity: 'all',
  source: 'all',
  runtimeStatus: 'all',
}

function SafeStatusNotice({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <AdminPageSurface className="border-amber-500/25 bg-amber-500/10">
      <div className="flex gap-3 px-5 py-4 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="break-words text-xs text-amber-700 dark:text-amber-200/80">
            {message}
          </div>
        </div>
      </div>
    </AdminPageSurface>
  )
}

export default function AdminServicesPage() {
  const { categories: dbCategories } = useCategories()
  const {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isGlobalAdmin,
    events,
    serviceRows,
    platformEntries,
    platformError,
    runtimeStatus,
    isLoading,
    isRefreshing,
    statusLoading,
    actionLoading,
    globalActionLoading,
    refresh,
    runNxctlAction,
    runGlobalServiceAction,
  } = useAdminServicesData()

  const [activeTab, setActiveTab] = useTabState<AdminServiceTab>('tab', 'live')
  const [filters, setFilters] = useState<AdminServicesFilters>(DEFAULT_FILTERS)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [openForm, setOpenForm] = useState(false)
  const [pendingServiceAction, setPendingServiceAction] = useState<{ target: AdminNxctlActionTarget; action: 'up' | 'down' } | null>(null)
  const challengeForm = useChallengeForm()

  const {
    loadChallengeForEdit,
    flagPreviewOpen,
    setFlagPreviewOpen,
    fetchedFlag,
    setFetchedFlag,
  } = challengeForm

  useEffect(() => {
    if (serviceRows.length === 0 && runtimeStatus.details.length === 0 && platformEntries.length === 0) return
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [platformEntries.length, runtimeStatus.details.length, serviceRows.length])

  const platformGroups = useMemo(
    () => buildPlatformChallengeGroups(
      platformEntries,
      serviceRows,
      runtimeStatus.details,
      runtimeStatus.fetchedAt,
      nowTick
    ),
    [nowTick, platformEntries, runtimeStatus.details, runtimeStatus.fetchedAt, serviceRows]
  )

  const enrichedPlatformEntries = useMemo(
    () => platformGroups.flatMap((group) => group.entries),
    [platformGroups]
  )

  const livePlatformEntries = useMemo(() => {
    const entriesById = new Map<string, typeof platformEntries[number]>()
    ;[...platformEntries, ...enrichedPlatformEntries].forEach((entry) => {
      if (!entriesById.has(entry.id)) entriesById.set(entry.id, entry)
    })
    return Array.from(entriesById.values())
  }, [enrichedPlatformEntries, platformEntries])

  const liveRows = useMemo(
    () => buildLiveServiceRows(
      runtimeStatus.details,
      serviceRows,
      livePlatformEntries,
      runtimeStatus.fetchedAt,
      nowTick
    ),
    [livePlatformEntries, nowTick, runtimeStatus.details, runtimeStatus.fetchedAt, serviceRows]
  )

  const filteredPlatformGroups = useMemo(
    () => getFilteredPlatformGroups(platformGroups, filters, nowTick),
    [filters, nowTick, platformGroups]
  )
  const filteredLiveRows = useMemo(
    () => getFilteredLiveRows(liveRows, filters),
    [filters, liveRows]
  )
  const keyOptions = useMemo(
    () => getUniqueOptions([
      ...platformEntries.map((entry) => entry.key),
      ...serviceRows.map((row) => row.service.key),
    ]),
    [platformEntries, serviceRows]
  )

  const handleOpenEdit = async (row: AdminServiceRow) => {
    await loadChallengeForEdit(row.challenge)
    setOpenForm(true)
  }

  if (authLoading || !accessReady) return <AdminContentLoading variant="services" />
  if (!user || !isAllowed) return null

  const showPlatformLoading = platformEntries.length === 0 && (isLoading || statusLoading)

  return (
    <>
      <AdminPageShell>
        <div className="flex flex-col min-h-0 flex-1">
          <AdminStickyToolbar
            tabs={
                  <AdminTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    items={[
                      {
                        value: 'live',
                        label: 'Actual Services',
                        icon: Activity,
                      },
                      {
                        value: 'platform',
                        label: 'Supabase Services',
                        icon: Server,
                      },
                    ]}
                  />
            }
            filters={
              <AdminServicesToolbar
                filters={filters}
                keyOptions={keyOptions}
                isRefreshing={isRefreshing}
                statusLoading={statusLoading}
                onFiltersChange={setFilters}
                onRefresh={() => void refresh()}
                activeTab={activeTab}
                isGlobalAdmin={isGlobalAdmin}
                globalActionLoading={globalActionLoading}
                onGlobalAction={(action) => void runGlobalServiceAction(action)}
              />
            }
          />

          {activeTab === 'platform' && platformError && (
            <div className="mb-4 mt-2">
              <SafeStatusNotice
                title="Platform config unavailable"
                message={platformError}
              />
            </div>
          )}

          {activeTab === 'live' && runtimeStatus.error && (
            <div className="mb-4 mt-2">
              <SafeStatusNotice
                title={runtimeStatus.isComplete ? 'Runtime status warning' : 'Full live inventory unavailable'}
                message={runtimeStatus.isComplete ? runtimeStatus.error : `${runtimeStatus.error}. Showing any fallback runtime data that could be loaded.`}
              />
            </div>
          )}

          <div className="flex flex-1 min-h-0">
            {activeTab === 'platform' ? (
              showPlatformLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader size={40} />
                </div>
              ) : (
                <div className="w-full">
                  <AdminPlatformChallengesTable
                    groups={filteredPlatformGroups}
                    onEditChallenge={(row) => void handleOpenEdit(row)}
                  />
                </div>
              )
            ) : (
              <div className="w-full">
                {(isRefreshing || statusLoading) && (
                  <div className="h-0.5 overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
                  </div>
                )}
                <AdminLiveServicesTable
                  rows={filteredLiveRows}
                  isGlobalAdmin={isGlobalAdmin}
                  actionLoading={actionLoading}
                  globalActionLoading={globalActionLoading}
                  onNxctlAction={(target, action) => {
                    if (action === 'down') {
                      setPendingServiceAction({ target, action })
                    } else {
                      void runNxctlAction(target, action)
                    }
                  }}
                  onGlobalAction={(action) => void runGlobalServiceAction(action)}
                />
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>

      <ChallengeFormDialogHost
        open={openForm}
        onOpenChange={setOpenForm}
        challengeForm={challengeForm}
        categories={dbCategories.map(c => c.name)}
        events={events}
        hideMainEventOption={!isGlobalAdmin}
        onSubmitSuccess={() => { void refresh() }}
        initialTab="additional"
      />

      <ConfirmDialog
        open={pendingServiceAction !== null}
        onOpenChange={() => setPendingServiceAction(null)}
        title={pendingServiceAction ? `Stop ${pendingServiceAction.target.name}` : ''}
        variant="destructive"
        description={<p>Are you sure you want to stop NXCTL service <b>{pendingServiceAction?.target.name}</b>?</p>}
        confirmLabel="Stop Service"
        onConfirm={() => {
          if (pendingServiceAction) {
            void runNxctlAction(pendingServiceAction.target, pendingServiceAction.action)
            setPendingServiceAction(null)
          }
        }}
      />

      <FlagPreviewDialog
        open={flagPreviewOpen}
        onOpenChange={(value) => {
          if (!value) {
            setFlagPreviewOpen(false)
            setFetchedFlag(null)
          }
        }}
        fetchedFlag={fetchedFlag}
      />
    </>
  )
}
