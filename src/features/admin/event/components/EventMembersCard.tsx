import React from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/shared/ui'
import { ADMIN_NATIVE_SELECT_CLASS } from '@/features/admin/ui/form-field-styles'
import { ADMIN_CARD_CLASS, ADMIN_CARD_TITLE_CLASS, ADMIN_LIST_PANEL_CLASS, ADMIN_PANEL_CLASS } from '@/features/admin/ui'
import type { Event, EventMemberRow, UserLite } from '../types'

interface EventMembersCardProps {
  events: Event[]
  manageEventId: string
  onManageEventChange: (eventId: string) => void
  assignUserQuery: string
  onAssignUserQueryChange: (query: string) => void
  loadingUserSearch: boolean
  candidateUsers: UserLite[]
  selectedCandidateUserIds: string[]
  onToggleCandidateSelection: (userId: string) => void
  onSelectAllCandidates: () => void
  onClearCandidateSelection: () => void
  onQuickAddSelectedMembers: () => void
  memberActionUserId: string | null
  onQuickAddMember: (userId: string) => void
  memberQuery: string
  onMemberQueryChange: (query: string) => void
  loadingEventMembers: boolean
  filteredEventMembers: EventMemberRow[]
  onRemoveMember: (userId: string) => void
}

const EventMembersCard: React.FC<EventMembersCardProps> = ({
  events,
  manageEventId,
  onManageEventChange,
  assignUserQuery,
  onAssignUserQueryChange,
  loadingUserSearch,
  candidateUsers,
  selectedCandidateUserIds,
  onToggleCandidateSelection,
  onSelectAllCandidates,
  onClearCandidateSelection,
  onQuickAddSelectedMembers,
  memberActionUserId,
  onQuickAddMember,
  memberQuery,
  onMemberQueryChange,
  loadingEventMembers,
  filteredEventMembers,
  onRemoveMember,
}) => {
  return (
    <Card className={ADMIN_CARD_CLASS}>
      <CardHeader>
        <CardTitle className={ADMIN_CARD_TITLE_CLASS}>Event Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Event</Label>
          <select
            value={manageEventId}
            onChange={(e) => onManageEventChange(e.target.value)}
            className={`mt-2 ${ADMIN_NATIVE_SELECT_CLASS}`}
          >
            <option value="">Select event</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Quick Assign User</Label>
            <Input
              placeholder="Type username (min 2 chars)..."
              value={assignUserQuery}
              onChange={(e) => onAssignUserQueryChange(e.target.value)}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Search on demand. Tidak lagi memuat semua user sekaligus.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onSelectAllCandidates}
                disabled={candidateUsers.length === 0}
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearCandidateSelection}
                disabled={selectedCandidateUserIds.length === 0}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={onQuickAddSelectedMembers}
                disabled={memberActionUserId === '__bulk__' || selectedCandidateUserIds.length === 0}
              >
                Add Selected ({selectedCandidateUserIds.length})
              </Button>
            </div>
            <div className={`mt-2 ${ADMIN_LIST_PANEL_CLASS}`}>
              {manageEventId === '' ? (
                <div className="py-4 px-3 text-sm text-gray-500 dark:text-gray-400">Select event first</div>
              ) : assignUserQuery.trim().length < 2 ? (
                <div className="py-4 px-3 text-sm text-gray-500 dark:text-gray-400">Type at least 2 characters to search users</div>
              ) : loadingUserSearch ? (
                <div className="py-4 px-3 text-sm text-gray-500 dark:text-gray-400">Searching users...</div>
              ) : candidateUsers.length === 0 ? (
                <div className="py-4 px-3 text-sm text-gray-500 dark:text-gray-400">No matching users (or all already members)</div>
              ) : (
                candidateUsers.map((user) => (
                  <div key={user.id} className="px-3 py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-primary-500"
                        checked={selectedCandidateUserIds.includes(user.id)}
                        onChange={() => onToggleCandidateSelection(user.id)}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.id}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onQuickAddMember(user.id)}
                      disabled={memberActionUserId === user.id}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <Label>Current Members</Label>
            <Input
              placeholder="Search current member..."
              value={memberQuery}
              onChange={(e) => onMemberQueryChange(e.target.value)}
              className="mt-2"
            />
            <div className={`mt-2 ${ADMIN_PANEL_CLASS} max-h-75 overflow-auto`}>
              {loadingEventMembers ? (
                <div className="py-4 px-3 text-sm text-gray-500 dark:text-gray-400">Loading members...</div>
              ) : filteredEventMembers.length === 0 ? (
                <div className="py-4 px-3 text-sm text-gray-500 dark:text-gray-400">No members yet</div>
              ) : (
                filteredEventMembers.map((member) => (
                  <div key={member.user_id} className="px-3 py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{member.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.user_id}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Joined: {new Date(member.joined_at).toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemoveMember(member.user_id)}
                      disabled={memberActionUserId === member.user_id}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EventMembersCard
