'use client'

import APP from '@/config'
import { getEventSections, normalizeEventImageUrl } from '../lib'
import type { EnrichedChallengeEvent } from '../types'
import AllEventsButton from './events-tab/AllEventsButton'
import EventsEmptyState from './events-tab/EventsEmptyState'
import EventsList from './events-tab/EventsList'

type Props = {
  events: EnrichedChallengeEvent[]
  selectedEventId?: string | null | 'all'
  onEventSelect: (eventId: string | null | 'all') => void
  showAllEventsButton?: boolean
  showMain?: boolean
}

export default function EventsTab({
  events,
  selectedEventId,
  onEventSelect,
  showAllEventsButton = true,
  showMain: showMainProp,
}: Props) {
  const mainLabel = String(APP.eventMainLabel || 'Main')
  const fallbackImageUrl = normalizeEventImageUrl((APP as any).eventFallbackImageUrl)
  const mainImageUrl = normalizeEventImageUrl((APP as any).eventMainImageUrl) || fallbackImageUrl
  const showMain = showMainProp !== undefined ? showMainProp : !APP.hideEventMain

  const now = new Date()
  const { availableEvents, upcomingList, endedEvents } = getEventSections(events, now)
  const hasAvailableSection = showMain || availableEvents.length > 0
  const hasUpcomingSection = upcomingList.length > 0
  const isEmpty = !hasAvailableSection && !hasUpcomingSection && endedEvents.length === 0

  return (
    <div data-tour="challenge-events-tab" className="w-full">
      <div className="flex flex-col gap-6 md:gap-8">
        {showAllEventsButton && (
          <AllEventsButton
            selected={selectedEventId === 'all'}
            onSelect={() => onEventSelect('all')}
          />
        )}

        {hasAvailableSection && (
          <EventsList
            title="Available Events"
            events={availableEvents}
            selectedEventId={selectedEventId}
            fallbackImageUrl={fallbackImageUrl}
            now={now}
            onEventSelect={onEventSelect}
            mainEvent={showMain ? {
              label: mainLabel,
              imageUrl: mainImageUrl,
              selected: selectedEventId === null,
              onSelect: () => onEventSelect(null)
            } : undefined}
          />
        )}

        {hasUpcomingSection && (
          <EventsList
            title="Upcoming Events"
            events={upcomingList}
            selectedEventId={selectedEventId}
            fallbackImageUrl={fallbackImageUrl}
            now={now}
            onEventSelect={onEventSelect}
          />
        )}

        {endedEvents.length > 0 && (
          <EventsList
            title="Past Events"
            events={endedEvents}
            selectedEventId={selectedEventId}
            fallbackImageUrl={fallbackImageUrl}
            now={now}
            onEventSelect={onEventSelect}
            tone="ended"
          />
        )}

        {isEmpty && <EventsEmptyState />}
      </div>
    </div>
  )
}
