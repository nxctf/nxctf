import type {
  ChallengeEventFilterItem,
  EventSelectorValue,
} from '../../types'

export type EventVisualState = 'upcoming-soon' | 'ending-soon' | 'ongoing' | 'ended' | 'upcoming'

type EventOrderingState = 'permanent' | 'ongoing' | 'upcoming' | 'ended'

function getEventOrderingState(
  event: ChallengeEventFilterItem,
  nowMs: number,
  showEventState: boolean
): EventOrderingState {
  if (!showEventState) return 'ongoing'

  const start = event.start_time ? new Date(event.start_time).getTime() : null
  const end = event.end_time ? new Date(event.end_time).getTime() : null

  if (!start && !end) return 'permanent'
  if (end && nowMs > end) return 'ended'
  if (start && nowMs < start) return 'upcoming'
  return 'ongoing'
}

export function getVisibleSortedEvents({
  events,
  selectedEventId,
  includeEndedEvents,
  showEventState,
  upcomingVisibilityWindowDays,
  nowMs = Date.now(),
}: {
  events?: ChallengeEventFilterItem[]
  selectedEventId?: EventSelectorValue
  includeEndedEvents: boolean
  showEventState: boolean
  upcomingVisibilityWindowDays: number | null
  nowMs?: number
}): ChallengeEventFilterItem[] {
  if (!events) return []

  const upcomingVisibleWindowMs =
    upcomingVisibilityWindowDays === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, upcomingVisibilityWindowDays) * 24 * 60 * 60 * 1000

  const visibleEvents = includeEndedEvents
    ? events
    : events.filter((event) => {
        if (!event.end_time) return true
        const end = new Date(event.end_time).getTime()
        if (Number.isNaN(end)) return true
        if (nowMs <= end) return true
        return Boolean(event.always_show_challenges)
      })

  const filteredUpcoming = visibleEvents.filter((event) => {
    if (typeof selectedEventId === 'string' && selectedEventId !== 'all' && event.id === selectedEventId) {
      return true
    }

    if (!event.start_time) return true
    const start = new Date(event.start_time).getTime()
    if (Number.isNaN(start)) return true
    const remaining = start - nowMs

    if (remaining <= 0) return true
    if (remaining > upcomingVisibleWindowMs) return false
    return true
  })

  return [...filteredUpcoming].sort((a, b) => {
    if (a.isLocked !== b.isLocked) {
      return a.isLocked ? 1 : -1
    }

    const stateA = getEventOrderingState(a, nowMs, showEventState)
    const stateB = getEventOrderingState(b, nowMs, showEventState)

    const statePriority: Record<EventOrderingState, number> = {
      permanent: 0,
      ongoing: 1,
      upcoming: 2,
      ended: 3,
    }

    if (stateA !== stateB) {
      return statePriority[stateA] - statePriority[stateB]
    }

    if (stateA === 'permanent') {
      const aStart = a.start_time ? new Date(a.start_time).getTime() : 0
      const bStart = b.start_time ? new Date(b.start_time).getTime() : 0
      return aStart - bStart || a.name.localeCompare(b.name)
    }

    if (stateA === 'ongoing') {
      const aEnd = a.end_time ? new Date(a.end_time).getTime() : Infinity
      const bEnd = b.end_time ? new Date(b.end_time).getTime() : Infinity
      return aEnd - bEnd
    }

    if (stateA === 'upcoming') {
      const aStart = a.start_time ? new Date(a.start_time).getTime() : Infinity
      const bStart = b.start_time ? new Date(b.start_time).getTime() : Infinity
      return aStart - bStart
    }

    if (stateA === 'ended') {
      const aEnd = a.end_time ? new Date(a.end_time).getTime() : 0
      const bEnd = b.end_time ? new Date(b.end_time).getTime() : 0
      return bEnd - aEnd
    }

    return 0
  })
}

export function shouldShowEventTimingAlways({
  event,
  showEventState,
  upcomingVisibilityWindowDays,
  nowMs = Date.now(),
}: {
  event: ChallengeEventFilterItem
  showEventState: boolean
  upcomingVisibilityWindowDays: number | null
  nowMs?: number
}): boolean {
  if (!showEventState) return false
  if (!event.end_time) return false

  const end = new Date(event.end_time).getTime()
  if (Number.isNaN(end)) return false

  const windowMs =
    upcomingVisibilityWindowDays === null
      ? Infinity
      : upcomingVisibilityWindowDays * 24 * 60 * 60 * 1000

  return end > nowMs && end - nowMs <= windowMs
}

export function getEventVisualState({
  event,
  showEventState,
  upcomingVisibilityWindowDays,
  nowMs = Date.now(),
}: {
  event: ChallengeEventFilterItem
  showEventState: boolean
  upcomingVisibilityWindowDays: number | null
  nowMs?: number
}): EventVisualState {
  if (!showEventState) return 'ongoing'

  const start = event.start_time ? new Date(event.start_time).getTime() : null
  const end = event.end_time ? new Date(event.end_time).getTime() : null

  const windowMs =
    upcomingVisibilityWindowDays === null
      ? Infinity
      : upcomingVisibilityWindowDays * 24 * 60 * 60 * 1000

  if (start && nowMs < start) {
    const diff = start - nowMs
    if (diff <= windowMs) return 'upcoming-soon'
    return 'upcoming'
  }

  if (end && nowMs > end) return 'ended'
  if (end && end - nowMs <= windowMs) return 'ending-soon'

  return 'ongoing'
}
