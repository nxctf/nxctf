import React from 'react'
import AdminChallengeFilters from './AdminChallengeFilters'
import EventSelect from '@/features/events/components/EventSelect'
import type { AdminChallengeFilterState, AdminChallengeEventId, Event } from '../types'

interface AdminChallengesToolbarProps {
  filters: AdminChallengeFilterState
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  categories: string[]
  difficulties: string[]
  onClear: () => void
  actions?: React.ReactNode
  status?: React.ReactNode
  events: Event[]
  selectedEventId: AdminChallengeEventId
  onEventChange: (eventId: AdminChallengeEventId) => void
}

export default function AdminChallengesToolbar({
  filters,
  onFiltersChange,
  categories,
  difficulties,
  onClear,
  actions,
  status,
  events,
  selectedEventId,
  onEventChange,
}: AdminChallengesToolbarProps) {
  const selectedEventValue = selectedEventId === null ? 'main' : selectedEventId

  return (
    <div className="flex flex-col gap-3.5">
      {/* Row 1: Event Selector on the left, Status & Actions on the right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1.5 border-b border-gray-100/50 dark:border-gray-800/30">
        <div className="flex items-center gap-3">
          <EventSelect
            value={selectedEventValue}
            onChange={(val) => onEventChange(val === 'main' ? null : val)}
            events={events}
            className="w-full sm:w-[220px]"
          />
          {status}
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>

      {/* Row 2: Search, Clear, and Select filters */}
      <AdminChallengeFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        difficulties={difficulties}
        onClear={onClear}
      />
    </div>
  )
}
