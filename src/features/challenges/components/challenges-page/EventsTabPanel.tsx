'use client'

import { useMemo, useState } from 'react'
import EventsTab from '../EventsTab'
import AllEventsButton from '../events-tab/AllEventsButton'
import type { ChallengesMainTab, EnrichedChallengeEvent } from '../../types'
import ChallengePageTabs from './ChallengePageTabs'
import DesktopEventsSidebar, { type EventFilterState } from '../events-tab/DesktopEventsSidebar'

type EventsTabPanelProps = {
  currentTab: ChallengesMainTab
  events: EnrichedChallengeEvent[]
  selectedEventId?: string | null | 'all'
  onTabChange: (tab: ChallengesMainTab) => void
  onEventSelect: (eventId: string | null | 'all') => void
}

export default function EventsTabPanel({
  currentTab,
  events,
  selectedEventId,
  onTabChange,
  onEventSelect,
}: EventsTabPanelProps) {
  const [filters, setFilters] = useState<EventFilterState>({
    search: '',
    status: 'all',
  })

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const nameMatch = event.name.toLowerCase().includes(search)
        const descMatch = event.description?.toLowerCase().includes(search)
        if (!nameMatch && !descMatch) return false
      }

      // Status filter
      if (filters.status !== 'all') {
        const now = new Date()
        const start = event.start_time ? new Date(event.start_time) : null
        const end = event.end_time ? new Date(event.end_time) : null

        if (filters.status === 'active') {
          const isActive = (!start || start <= now) && (!end || end >= now)
          if (!isActive) return false
        } else if (filters.status === 'upcoming') {
          const isUpcoming = start && start > now
          if (!isUpcoming) return false
        } else if (filters.status === 'past') {
          const isPast = end && end < now
          if (!isPast) return false
        }
      }

      return true
    })
  }, [events, filters])

  return (
    <div className="xl:grid xl:grid-cols-[176px_minmax(0,1fr)] xl:gap-8 2xl:gap-10 items-start">
      <div className="relative z-30 flex flex-col gap-4 xl:sticky xl:top-[80px] xl:self-start 2xl:gap-5 [will-change:transform]">
        <ChallengePageTabs
          currentTab={currentTab}
          onTabChange={onTabChange}
          showSummary={false}
          className="xl:w-44 [&_button]:xl:w-44"
        />

        <DesktopEventsSidebar
          filters={filters}
          onFilterChange={setFilters}
          events={events}
        />
      </div>

      <div className="min-w-0 space-y-4 2xl:space-y-5 [will-change:transform]">
        <AllEventsButton
          selected={selectedEventId === 'all'}
          onSelect={() => onEventSelect('all')}
        />

        <EventsTab
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onEventSelect={onEventSelect}
          showAllEventsButton={false}
          showMain={(filters.status === 'all' || filters.status === 'active') && !filters.search}
        />

      </div>
    </div>
  )
}
