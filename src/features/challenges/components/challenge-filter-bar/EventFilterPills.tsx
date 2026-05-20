'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Lock, Zap } from 'lucide-react'

import APP from '@/config'
import { cn, formatEventTimingLabel } from '@/shared/lib/utils'
import {
  getEventVisualState,
  getVisibleSortedEvents,
  shouldShowEventTimingAlways,
} from '../../lib'
import type { ChallengeEventFilterItem, EventSelectorValue } from '../../types'

type EventFilterPillsProps = {
  events: ChallengeEventFilterItem[]
  selectedEventId?: EventSelectorValue
  onEventChange: (eventId: EventSelectorValue) => void
  hideAllEventOption: boolean
  hideMainEventOption: boolean
  includeEndedEvents: boolean
  showEventState: boolean
  upcomingVisibilityWindowDays: number | null
  isEventDirty: boolean
  anyFilterDirty: boolean
  className?: string
}

export default function EventFilterPills({
  events,
  selectedEventId,
  onEventChange,
  hideAllEventOption,
  hideMainEventOption,
  includeEndedEvents,
  showEventState,
  upcomingVisibilityWindowDays,
  isEventDirty,
  anyFilterDirty,
  className,
}: EventFilterPillsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = React.useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  })
  const mainLabel = String(APP.eventMainLabel || 'Main')
  const sortedEvents = React.useMemo(() => {
    return getVisibleSortedEvents({
      events,
      selectedEventId,
      includeEndedEvents,
      showEventState,
      upcomingVisibilityWindowDays,
    })
  }, [events, includeEndedEvents, selectedEventId, showEventState, upcomingVisibilityWindowDays])

  const selectedEvent = React.useMemo(() => {
    if (typeof selectedEventId !== 'string') return null
    if (selectedEventId === 'all') return null
    return events.find((event) => event.id === selectedEventId) ?? null
  }, [events, selectedEventId])

  const selectedTimingLabel = React.useMemo(() => {
    return selectedEvent ? formatEventTimingLabel(selectedEvent) : null
  }, [selectedEvent])

  const stateStyles = {
    'upcoming-soon': 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    'ending-soon': 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    ongoing: 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    ended: 'opacity-50 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400',
    upcoming: '',
  }

  const updateScrollState = React.useCallback(() => {
    const node = scrollRef.current
    if (!node) return

    const maxScrollLeft = node.scrollWidth - node.clientWidth
    setScrollState({
      hasOverflow: maxScrollLeft > 2,
      canScrollLeft: node.scrollLeft > 2,
      canScrollRight: node.scrollLeft < maxScrollLeft - 2,
    })
  }, [])

  React.useEffect(() => {
    updateScrollState()

    const node = scrollRef.current
    if (!node) return

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(node)
    window.addEventListener('resize', updateScrollState)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [sortedEvents, hideAllEventOption, hideMainEventOption, updateScrollState])

  const scrollEvents = (direction: 'left' | 'right') => {
    const node = scrollRef.current
    if (!node) return

    node.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth',
    })
  }

  return (
    <div data-tour="challenge-event-selector" className={cn('flex min-w-0 items-center gap-1.5', className)}>
      {scrollState.hasOverflow && (
        <button
          type="button"
          onClick={() => scrollEvents('left')}
          disabled={!scrollState.canScrollLeft}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-35 ${'bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all'}`}
          aria-label="Scroll events left"
          title="Scroll events left"
        >
          <ChevronLeft size={15} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="scroll-hidden flex min-w-0 flex-1 flex-row flex-nowrap gap-1.5 overflow-x-auto py-0.5"
      >
        {!hideAllEventOption && (
          <button
            type="button"
            onClick={() => onEventChange('all')}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition ${selectedEventId === 'all' ? 'bg-primary border border-primary text-primary-foreground caret-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0' : 'bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all'} ${!isEventDirty && anyFilterDirty ? 'opacity-90' : ''}`}
          >
            All
          </button>
        )}
        {!hideMainEventOption && !APP.hideEventMain && (
          <button
            type="button"
            onClick={() => onEventChange(null)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition ${!selectedEventId ? 'bg-primary border border-primary text-primary-foreground caret-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0' : 'bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all'}`}
          >
            {mainLabel}
          </button>
        )}
        {sortedEvents.map((event) => {
          const timing = formatEventTimingLabel(event)
          const isSelected = selectedEventId === event.id
          const state = getEventVisualState({
            event,
            showEventState,
            upcomingVisibilityWindowDays,
          })
          const isEndedButAlwaysVisible = state === 'ended' && Boolean(event.always_show_challenges)

          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventChange(event.id)}
              className={`
                flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition
                ${isEndedButAlwaysVisible && !isSelected ? 'text-[10px] opacity-40 border-dashed' : ''}
                ${isSelected
                  ? 'bg-primary border border-primary text-primary-foreground caret-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0'
                  : ('bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all' + (showEventState ? ` ${stateStyles[state]}` : ''))
                }
              `}
              title={timing || undefined}
            >
              {showEventState && state === 'upcoming-soon' && (
                <Zap size={10} className="text-yellow-500" />
              )}

              {showEventState && state === 'ending-soon' && (
                <Zap size={10} className="text-purple-500" />
              )}

              {event.isLocked && <Lock size={10} className="opacity-70" />}
              <span>{event.name}</span>

              {showEventState && isEndedButAlwaysVisible && !isSelected && (
                <span className="text-[9px] opacity-70">ended</span>
              )}

              {showEventState && (isSelected || shouldShowEventTimingAlways({
                event,
                showEventState,
                upcomingVisibilityWindowDays,
              })) && timing && (
                  <span className="ml-1 text-[9px] opacity-80 hidden sm:inline normal-case font-medium">
                    {timing}
                  </span>
                )}
            </button>
          )
        })}
      </div>

      {scrollState.hasOverflow && (
        <button
          type="button"
          onClick={() => scrollEvents('right')}
          disabled={!scrollState.canScrollRight}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-35 ${'bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all'}`}
          aria-label="Scroll events right"
          title="Scroll events right"
        >
          <ChevronRight size={15} />
        </button>
      )}

      {showEventState && selectedTimingLabel && (
        <div className="sm:hidden mt-2 text-xs text-gray-600 dark:text-gray-300">
          {selectedTimingLabel}
        </div>
      )}
    </div>
  )
}
