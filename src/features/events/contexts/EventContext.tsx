'use client'

import React from 'react'
import { EventService } from '@/features/events/services/event.service'
import type { Event } from '@/shared/types'
import { getSelectedEventSetting, setSelectedEventSetting } from '@/shared/lib/settings'
import { useAuth } from '@/shared/contexts/AuthContext'

export type SelectedEvent = 'all' | 'main' | string

type EventContextValue = {
  events: Event[]
  startedEvents: Event[]
  eventsLoading: boolean
  selectedEvent: SelectedEvent
  setSelectedEvent: (value: SelectedEvent) => void
  refreshEvents: () => Promise<void>
}

const EventContext = React.createContext<EventContextValue | null>(null)

const normalizeSelectedEvent = (value: string | null): SelectedEvent => {
  if (!value) return 'all'
  const normalized = String(value).trim()
  if (!normalized || normalized === 'undefined') return 'all'
  if (normalized === 'null') return 'main'
  return normalized
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [events, setEvents] = React.useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = React.useState(false)
  const [selectedEvent, setSelectedEventState] = React.useState<SelectedEvent>(() => {
    if (typeof window === 'undefined') return 'all'
    try {
      return normalizeSelectedEvent(getSelectedEventSetting())
    } catch {
      return 'all'
    }
  })

  // Persist selection to localStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setSelectedEventSetting(String(selectedEvent))
    } catch {
      // ignore
    }
  }, [selectedEvent])

  const refreshEvents = React.useCallback(async () => {
    setEventsLoading(true)
    try {
      const data = await EventService.getEvents()
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (loading) return
    refreshEvents()
  }, [loading, user?.id, refreshEvents])

  const startedEvents = React.useMemo(() => EventService.filterStartedEvents(events || []), [events])

  const setSelectedEvent = React.useCallback((value: SelectedEvent) => {
    setSelectedEventState(normalizeSelectedEvent(value))
  }, [])

  const ctx = React.useMemo<EventContextValue>(
    () => ({
      events,
      startedEvents,
      eventsLoading,
      selectedEvent,
      setSelectedEvent,
      refreshEvents,
    }),
    [events, startedEvents, eventsLoading, selectedEvent, setSelectedEvent, refreshEvents],
  )

  return <EventContext.Provider value={ctx}>{children}</EventContext.Provider>
}

export function useEventContext() {
  const ctx = React.useContext(EventContext)
  if (!ctx) throw new Error('useEventContext must be used within <EventProvider>')
  return ctx
}
