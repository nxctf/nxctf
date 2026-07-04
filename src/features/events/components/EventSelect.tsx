import React from 'react'
import { FilterSelect } from '@/shared/ui'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'

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
  selectClassName?: string
  disabled?: boolean
  defaultValue?: string
  active?: boolean
  clearable?: boolean
  onClear?: () => void
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
  selectClassName,
  disabled,
  defaultValue,
  active,
  clearable = false,
  onClear,
  sortMode = 'challenge-filter-bar',
  referenceTimeMs,
  showMain: propShowMain,
  mainValue = 'main',
  mainLabel: propMainLabel,
  showAll = true,
  allValue = 'all',
  allLabel = 'All Events',
  getEventLabel = (evt) => String(evt.name ?? evt.title ?? 'Untitled'),
}: Props) {
  const { settings } = useSystemSettings()
  const showMain = propShowMain ?? !settings.disable_default_challenges
  const mainLabel = propMainLabel ?? String(settings.event_main_label || 'Main')

  const nowMs = referenceTimeMs ?? Date.now()
  const resolvedDefaultValue = defaultValue ?? allValue
  const isActive = active ?? value !== resolvedDefaultValue

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

  const selectOptions = React.useMemo(() => {
    const opts = []
    if (showAll) {
      opts.push({ value: allValue, label: allLabel })
    }
    if (showMain) {
      opts.push({ value: mainValue, label: mainLabel })
    }
    sortedEvents.forEach((ev) => {
      opts.push({ value: String(ev.id), label: getEventLabel(ev) })
    })
    return opts
  }, [showAll, allValue, allLabel, showMain, mainValue, mainLabel, sortedEvents, getEventLabel])

  return (
    <FilterSelect
      value={value}
      defaultValue={resolvedDefaultValue}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select Event"
      active={isActive}
      clearable={false}
      onClear={onClear}
      className={className}
      triggerClassName={selectClassName}
      options={selectOptions}
    />
  )
}
