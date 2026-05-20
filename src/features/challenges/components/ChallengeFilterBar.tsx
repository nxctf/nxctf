'use client'

import React from 'react'
import { getChallengeFilterDirtyState } from '../lib'
import type {
  ChallengeEventFilterItem,
  ChallengeFilterSettings,
  ChallengeFilterState,
  ChallengeSortMode,
  EventSelectorValue,
} from '../types'
import ChallengeFilterControls from './challenge-filter-bar/ChallengeFilterControls'
import EventFilterPills from './challenge-filter-bar/EventFilterPills'

type Props = {
  filters: ChallengeFilterState
  events?: ChallengeEventFilterItem[]
  selectedEventId?: EventSelectorValue
  onEventChange?: (eventId: EventSelectorValue) => void
  hideAllEventOption?: boolean
  hideMainEventOption?: boolean
  includeEndedEvents?: boolean
  // When false, do not show timing/visual state (colors/icons) for events.
  // Useful for admin views where timing badges are not desired.
  showEventState?: boolean
  // Controls which upcoming events appear in the event pill filter.
  // Default: 30 days. Set to null to show all upcoming events (useful for admin).
  upcomingVisibilityWindowDays?: number | null
  settings?: ChallengeFilterSettings
  categories: string[]
  difficulties: string[]
  onFilterChange: (filters: any) => void
  onSettingsChange?: (settings: ChallengeFilterSettings) => void
  onClear: () => void
  showStatusFilter?: boolean
  showSearch?: boolean
  hideSidebarFiltersOnDesktop?: boolean
  sortMode?: ChallengeSortMode
  onSortModeChange?: () => void
}

export default function ChallengeFilterBar({
  filters,
  events,
  selectedEventId,
  onEventChange,
  hideAllEventOption = false,
  hideMainEventOption = false,
  includeEndedEvents = false,
  showEventState = true,
  upcomingVisibilityWindowDays = 30,
  settings,
  categories,
  difficulties,
  onFilterChange,
  onSettingsChange,
  onClear,
  showStatusFilter = true,
  showSearch = true,
  hideSidebarFiltersOnDesktop = false,
  sortMode = 'default',
  onSortModeChange,
}: Props) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const dirtyState = getChallengeFilterDirtyState(filters, selectedEventId)
  const showEventFilters = events && onEventChange

  return (
    <div
      data-tour="challenge-filter-bar"
      className="relative z-10 w-full rounded-2xl border border-border bg-card/95 p-2 shadow-sm"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {showEventFilters && (
          <EventFilterPills
            events={events}
            selectedEventId={selectedEventId}
            onEventChange={onEventChange}
            hideAllEventOption={hideAllEventOption}
            hideMainEventOption={hideMainEventOption}
            includeEndedEvents={includeEndedEvents}
            showEventState={showEventState}
            upcomingVisibilityWindowDays={upcomingVisibilityWindowDays}
            isEventDirty={dirtyState.isEventDirty}
            anyFilterDirty={dirtyState.anyFilterDirty}
            className="flex-1"
          />
        )}

        <ChallengeFilterControls
          filters={filters}
          settings={settings}
          categories={categories}
          difficulties={difficulties}
          dirtyState={dirtyState}
          settingsOpen={settingsOpen}
          showStatusFilter={showStatusFilter}
          hideSidebarFiltersOnDesktop={hideSidebarFiltersOnDesktop}
          sortMode={sortMode}
          showSearch={showSearch}
          onFilterChange={onFilterChange}
          onSettingsOpenChange={setSettingsOpen}
          onSettingsChange={onSettingsChange}
          onClear={onClear}
          onSortModeChange={onSortModeChange}
        />
      </div>
    </div>
  )
}
