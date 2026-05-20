'use client'

import type { EnrichedChallengeEvent } from '../../types'
import EventCard from './EventCard'
import MainEventCard from './MainEventCard'

type MainEventOption = {
  label: string
  imageUrl: string | null
  selected: boolean
  onSelect: () => void
}

type EventsListProps = {
  title: string
  events: EnrichedChallengeEvent[]
  selectedEventId?: string | null | 'all'
  fallbackImageUrl: string | null
  now: Date
  onEventSelect: (eventId: string | null | 'all') => void
  mainEvent?: MainEventOption
  tone?: 'default' | 'ended'
  titleClassName?: string
}

export default function EventsList({
  title,
  events,
  selectedEventId,
  fallbackImageUrl,
  now,
  onEventSelect,
  mainEvent,
  tone = 'default',
}: EventsListProps) {
  const delayOffset = mainEvent ? 1 : 0

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {mainEvent && (
          <MainEventCard
            label={mainEvent.label}
            imageUrl={mainEvent.imageUrl}
            selected={mainEvent.selected}
            delay={0}
            onSelect={mainEvent.onSelect}
          />
        )}

        {events.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            selected={selectedEventId === event.id}
            fallbackImageUrl={fallbackImageUrl}
            now={now}
            delay={(index + delayOffset) * 0.05}
            tone={tone}
            onSelect={() => onEventSelect(event.id)}
          />
        ))}
      </div>
    </div>
  )
}
