'use client'

import React from 'react'
import APP from '@/config'
import { cn } from '@/shared/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

export type EventSelectItem = {
  id: string
  name?: string | null
  title?: string | null
  start_time?: string | null
  end_time?: string | null
}

type Props = {
  value: string
  onChange: (nextValue: string) => void
  events: EventSelectItem[]
  className?: string
  disabled?: boolean
  sortMode?: 'challenge-filter-bar' | 'none'
  referenceTimeMs?: number
  showMain?: boolean
  mainValue?: string
  mainLabel?: string
  showAll?: boolean
  allValue?: string
  allLabel?: string
  getEventLabel?: (evt: EventSelectItem) => string
}

export default function EventSelect({
  value,
  onChange,
  events,
  className,
  disabled,
  sortMode = 'challenge-filter-bar',
  referenceTimeMs,
  showMain = !APP.hideEventMain,
  mainValue = 'main',
  mainLabel = String(APP.eventMainLabel || 'Main'),
  showAll = true,
  allValue = 'all',
  allLabel = 'All Events',
  getEventLabel = (evt) => String(evt.name ?? evt.title ?? 'Untitled'),
}: Props) {
  const nowMs = referenceTimeMs ?? Date.now()

  const isValueKnown = React.useMemo(() => {
    if (value === allValue && showAll) return true
    if (value === mainValue && showMain) return true
    return events.some((e) => String(e.id) === String(value))
  }, [value, events, showAll, allValue, showMain, mainValue])

  const sortedEvents = React.useMemo(() => {
    if (sortMode === 'none') return events

    const getState = (evt: EventSelectItem) => {
      const start = evt.start_time ? new Date(evt.start_time).getTime() : null
      const end = evt.end_time ? new Date(evt.end_time).getTime() : null

      if (!start && !end) return 'permanent' as const
      if (end && nowMs > end) return 'ended' as const
      if (start && nowMs < start) return 'upcoming' as const
      return 'ongoing' as const
    }

    const statePriority: Record<ReturnType<typeof getState>, number> = {
      permanent: 0,
      ongoing: 1,
      upcoming: 2,
      ended: 3,
    }

    const safeTime = (t: number | null) => (typeof t === 'number' && !Number.isNaN(t) ? t : null)

    return [...events].sort((a, b) => {
      const stateA = getState(a)
      const stateB = getState(b)
      if (stateA !== stateB) return statePriority[stateA] - statePriority[stateB]

      const aStart = safeTime(a.start_time ? new Date(a.start_time).getTime() : null)
      const bStart = safeTime(b.start_time ? new Date(b.start_time).getTime() : null)
      const aEnd = safeTime(a.end_time ? new Date(a.end_time).getTime() : null)
      const bEnd = safeTime(b.end_time ? new Date(b.end_time).getTime() : null)

      if (stateA === 'permanent') {
        const aKey = aStart ?? 0
        const bKey = bStart ?? 0
        return aKey - bKey || getEventLabel(a).localeCompare(getEventLabel(b))
      }

      if (stateA === 'ongoing') {
        const aKey = aEnd ?? Infinity
        const bKey = bEnd ?? Infinity
        return aKey - bKey || getEventLabel(a).localeCompare(getEventLabel(b))
      }

      if (stateA === 'upcoming') {
        const aKey = aStart ?? Infinity
        const bKey = bStart ?? Infinity
        return aKey - bKey || getEventLabel(a).localeCompare(getEventLabel(b))
      }

      if (stateA === 'ended') {
        const aKey = aEnd ?? 0
        const bKey = bEnd ?? 0
        return bKey - aKey || getEventLabel(a).localeCompare(getEventLabel(b))
      }

      return 0
    })
  }, [events, sortMode, nowMs, getEventLabel])

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={onChange}
    >
      <SelectTrigger className={cn('h-auto min-h-10 cursor-pointer caret-transparent px-4 py-2', className)}>
        <SelectValue placeholder="Select event" />
      </SelectTrigger>
      <SelectContent>
        {!isValueKnown && (
          <SelectItem value={value} disabled>
            Event not found - select again
          </SelectItem>
        )}
        {showAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {showMain && <SelectItem value={mainValue}>{mainLabel}</SelectItem>}
        {sortedEvents.map((ev) => (
          <SelectItem key={ev.id} value={ev.id}>
            {getEventLabel(ev)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
