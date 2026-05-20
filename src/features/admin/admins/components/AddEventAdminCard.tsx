import React from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { ADMIN_CARD_PLAIN_CLASS } from '@/features/admin/ui'
import type { Event, UserLite } from '../types'

interface AddEventAdminCardProps {
  events: Event[]
  usernameQuery: string
  userResults: UserLite[]
  selectedUser: UserLite | null
  selectedEventId: string
  selectedEventName: string | null
  submitting: boolean
  canSubmit: boolean
  onUsernameChange: (value: string) => void
  onUserSelect: (user: UserLite) => void
  onEventChange: (eventId: string) => void
  onSubmit: () => void
  onReset: () => void
}

const AddEventAdminCard: React.FC<AddEventAdminCardProps> = ({
  events,
  usernameQuery,
  userResults,
  selectedUser,
  selectedEventId,
  selectedEventName,
  submitting,
  canSubmit,
  onUsernameChange,
  onUserSelect,
  onEventChange,
  onSubmit,
  onReset,
}) => {
  return (
    <Card className={ADMIN_CARD_PLAIN_CLASS}>
      <CardHeader>
        <CardTitle>Add Event Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Search Username</Label>
            <div className="relative">
              <Input value={usernameQuery} onChange={(e) => onUsernameChange(e.target.value)} placeholder="Type username..." />

              {userResults.length > 0 && !selectedUser && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-hidden">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onUserSelect(u)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{u.username}</span>
                        {u.is_admin ? <span className="text-xs text-muted-foreground">global admin</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">Choose a user, then select an event.</div>
          </div>

          <div>
            <Label>Event</Label>
            <Select value={selectedEventId} onValueChange={onEventChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pick an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEventName ? (
              <div className="mt-2 text-xs text-muted-foreground">
                Selected: <span className="font-medium">{selectedEventName}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {submitting ? 'Adding...' : 'Add'}
          </Button>
          <Button variant="ghost" onClick={onReset} disabled={submitting}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AddEventAdminCard
