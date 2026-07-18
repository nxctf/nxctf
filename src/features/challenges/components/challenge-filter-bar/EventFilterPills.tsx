'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Lock, Zap, SlidersHorizontal } from 'lucide-react'
import APP from '@/config'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { formatEventTimingLabel } from '@/shared/lib'
import { cn } from '@/shared/lib/utils'
import {
  SURFACE_FILTER_ITEM_CLASS,
  SURFACE_FILTER_ITEM_ACTIVE_CLASS,
} from '@/shared/styles'
import {
  getEventVisualState,
  getVisibleSortedEvents,
  shouldShowEventTimingAlways,
} from '../../lib'
import { useFilterContext } from '../../contexts/FilterContext'
import type { ChallengeEventFilterItem, EventSelectorValue } from '../../types'

type EventFilterPillsProps = {
  events: ChallengeEventFilterItem[]
  selectedEventId?: EventSelectorValue
  onEventChange: (eventId: EventSelectorValue) => void
  hideAllEventOption: boolean
  hideMainEventOption: boolean
  includeEndedEvents: boolean
  showEventState: boolean
  eventNavigationMode: 'scroll' | 'select'
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
  eventNavigationMode,
  upcomingVisibilityWindowDays,
  isEventDirty,
  anyFilterDirty,
  className,
}: EventFilterPillsProps) {
  const { settings } = useSystemSettings()
  const { filters, toggleEventExclusion, resetExcludedEvents } = useFilterContext()
  const excludedIds = filters.excludedEventIds || []
  const isFiltered = excludedIds.length > 0
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeEvents = React.useMemo(() => {
    const nowMs = Date.now()
    return events.filter((event) => {
      if (!event.end_time) return true
      const end = new Date(event.end_time).getTime()
      return Number.isNaN(end) || nowMs <= end
    })
  }, [events])

  const optionButtonRefs = React.useRef(new Map<EventSelectorValue, HTMLButtonElement>())
  const [scrollState, setScrollState] = React.useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  })
  const mainLabel = String(settings.event_main_label || 'Main')

  const activeEventsWithOptions = React.useMemo(() => {
    const options = [{ id: 'main', name: mainLabel }]
    activeEvents.forEach((evt) => {
      options.push({ id: evt.id, name: evt.name })
    })
    return options
  }, [activeEvents, mainLabel])
  const sortedEvents = React.useMemo(() => {
    return getVisibleSortedEvents({
      events,
      selectedEventId,
      includeEndedEvents,
      showEventState,
      upcomingVisibilityWindowDays,
    })
  }, [events, includeEndedEvents, selectedEventId, showEventState, upcomingVisibilityWindowDays])

  const eventOptions = React.useMemo(() => {
    const options: Array<{ value: EventSelectorValue; label: string }> = []

    if (!hideAllEventOption) {
      options.push({ value: 'all', label: 'All' })
    }

    if (!hideMainEventOption && !settings.disable_default_challenges) {
      options.push({ value: null, label: mainLabel })
    }

    sortedEvents.forEach((event) => {
      options.push({ value: event.id, label: event.name })
    })

    return options
  }, [hideAllEventOption, hideMainEventOption, mainLabel, sortedEvents])

  const selectedOptionIndex = React.useMemo(() => {
    return eventOptions.findIndex((option) => option.value === selectedEventId)
  }, [eventOptions, selectedEventId])

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

  const setOptionButtonRef = React.useCallback((value: EventSelectorValue) => {
    return (node: HTMLButtonElement | null) => {
      if (node) {
        optionButtonRefs.current.set(value, node)
      } else {
        optionButtonRefs.current.delete(value)
      }
    }
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

  React.useEffect(() => {
    const selectedNode = optionButtonRefs.current.get(selectedEventId ?? null)
    selectedNode?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [eventOptions.length, selectedEventId])

  const scrollEvents = (direction: 'left' | 'right') => {
    const node = scrollRef.current
    if (!node) return

    node.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth',
    })
  }

  const navigateEvent = (direction: 'left' | 'right') => {
    if (eventOptions.length === 0) return

    const fallbackIndex = direction === 'right' ? 0 : eventOptions.length - 1
    const nextIndex = selectedOptionIndex === -1
      ? fallbackIndex
      : direction === 'right'
        ? selectedOptionIndex + 1
        : selectedOptionIndex - 1

    if (nextIndex < 0 || nextIndex >= eventOptions.length) return

    onEventChange(eventOptions[nextIndex].value)
  }

  const isSelectNavigation = eventNavigationMode === 'select'
  const hasSelectableEvents = sortedEvents.length > 0 && eventOptions.length > 1
  const canNavigateLeft = selectedOptionIndex === -1
    ? hasSelectableEvents
    : selectedOptionIndex > 0
  const canNavigateRight = selectedOptionIndex === -1
    ? hasSelectableEvents
    : selectedOptionIndex < eventOptions.length - 1
  const showNavigationButtons = isSelectNavigation
    ? hasSelectableEvents
    : scrollState.hasOverflow

  return (
    <div data-tour="challenge-event-selector" className={cn('flex min-w-0 items-center gap-1.5', className)}>
      {showNavigationButtons && (
        <button
          type="button"
          onClick={() => navigateEvent('left')}
          disabled={!canNavigateLeft}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-35 ${SURFACE_FILTER_ITEM_CLASS}`}
          aria-label="Previous event"
          title="Previous event"
        >
          <ChevronLeft size={15} />
        </button>
      )}

      {!hideAllEventOption && (
        <div className="relative shrink-0 flex items-center" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen((o) => !o)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-l-lg rounded-r-none border border-r-0 transition",
              popoverOpen || isFiltered
                ? "border-blue-600 bg-blue-600 text-white shadow-inner dark:bg-blue-600 dark:border-blue-600"
                : SURFACE_FILTER_ITEM_CLASS
            )}
            title="Configure Event List"
          >
            <SlidersHorizontal size={13} />
          </button>
          <button
            type="button"
            ref={setOptionButtonRef('all')}
            onClick={() => onEventChange('all')}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-r-lg rounded-l-none px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition border h-8",
              selectedEventId === 'all' ? SURFACE_FILTER_ITEM_ACTIVE_CLASS : SURFACE_FILTER_ITEM_CLASS,
              !isEventDirty && anyFilterDirty ? 'opacity-90' : ''
            )}
          >
            All
          </button>
          {popoverOpen && (
            <div className="absolute left-0 top-full mt-3 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-3 z-50">
              <div className="mb-2 flex items-center justify-between border-b pb-1.5 dark:border-gray-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Filter Event All</span>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={resetExcludedEvents}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                {activeEventsWithOptions.map((evt) => {
                  const isIncluded = !excludedIds.includes(evt.id)
                  return (
                    <label
                      key={evt.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => toggleEventExclusion(evt.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                        {evt.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="scroll-hidden flex min-w-0 flex-1 flex-row flex-nowrap gap-1.5 overflow-x-auto py-0.5"
      >
        {!hideMainEventOption && !settings.disable_default_challenges && (
          <button
            type="button"
            ref={setOptionButtonRef(null)}
            onClick={() => onEventChange(null)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition ${!selectedEventId ? SURFACE_FILTER_ITEM_ACTIVE_CLASS : SURFACE_FILTER_ITEM_CLASS}`}
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
              ref={setOptionButtonRef(event.id)}
              onClick={() => onEventChange(event.id)}
              className={`
                flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition
                ${isEndedButAlwaysVisible && !isSelected ? 'text-[10px] opacity-40 border-dashed' : ''}
                ${isSelected
                  ? SURFACE_FILTER_ITEM_ACTIVE_CLASS
                  : (SURFACE_FILTER_ITEM_CLASS + (showEventState ? ` ${stateStyles[state]}` : ''))
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

      {showNavigationButtons && (
        <button
          type="button"
          onClick={() => navigateEvent('right')}
          disabled={!canNavigateRight}
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-35 ${SURFACE_FILTER_ITEM_CLASS}`}
          aria-label="Next event"
          title="Next event"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}
