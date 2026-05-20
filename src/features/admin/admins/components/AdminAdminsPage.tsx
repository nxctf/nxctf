"use client"

import { Loader } from '@/shared/components'
import AddEventAdminCard from './AddEventAdminCard'
import EventAdminsCard from './EventAdminsCard'
import GlobalAdminsCard from './GlobalAdminsCard'
import RemoveEventAdminConfirmDialog from './RemoveEventAdminConfirmDialog'
import { useAdminAdminsData } from '../hooks/useAdminAdminsData'
import { AdminPageShell } from '../../ui'

export default function AdminAdminsPage() {
  const {
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
  } = useAdminAdminsData()

  if (authLoading || isLoading) return <Loader fullscreen />
  if (!user || !isAllowed) return null

  return (
    <>
      <AdminPageShell>
        <div className="space-y-5">
          <GlobalAdminsCard admins={globalAdmins} />

          <EventAdminsCard admins={eventAdmins} onAskRemove={askRemove} />

          <AddEventAdminCard
            events={events}
            usernameQuery={usernameQuery}
            userResults={userResults}
            selectedUser={selectedUser}
            selectedEventId={selectedEventId}
            selectedEventName={selectedEvent?.name ?? null}
            submitting={submitting}
            canSubmit={canSubmit}
            onUsernameChange={(value) => {
              setUsernameQuery(value)
              setSelectedUser(null)
            }}
            onUserSelect={(user) => {
              setSelectedUser(user)
              setUsernameQuery(user.username)
              setUserResults([])
            }}
            onEventChange={setSelectedEventId}
            onSubmit={doGrant}
            onReset={resetGrantForm}
          />
        </div>
      </AdminPageShell>

      <RemoveEventAdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pendingRemove={pendingRemove}
        onConfirm={doRemove}
      />
    </>
  )
}
