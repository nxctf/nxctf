'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { Calendar, Clock, History, LayoutGrid, Search, type LucideIcon } from 'lucide-react'

import type { EnrichedChallengeEvent } from '../../types'
import { getEventSections } from '../../lib'

export type EventFilterState = {
  search: string
  status: 'all' | 'active' | 'upcoming' | 'past'
}

type DesktopEventsSidebarProps = {
  filters: EventFilterState
  onFilterChange: (filters: EventFilterState) => void
  events: EnrichedChallengeEvent[]
}

export default function DesktopEventsSidebar({
  filters,
  onFilterChange,
  events,
}: DesktopEventsSidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const now = new Date()
  const { availableEvents, upcomingList, endedEvents } = getEventSections(events, now)

  const stats = {
    all: events.length,
    active: availableEvents.length,
    upcoming: upcomingList.length,
    past: endedEvents.length,
  }

  const handleStatusChange = (status: EventFilterState['status']) => {
    onFilterChange({ ...filters, status })
  }

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search })
  }

  return (
    <aside className="relative z-20 hidden max-h-[calc(100vh-8.75rem)] overflow-y-auto xl:block scroll-hidden">
      <div className="flex w-44 flex-col gap-1.5 rounded-2xl border border-blue-500/20 bg-white/60 p-2 shadow-sm shadow-blue-500/5 backdrop-blur-md dark:border-blue-500/10 dark:bg-gray-900/60">
        <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Filters
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={iconButtonClass(Boolean(filters.search))}
        >
          <Search size={18} />
          <span className="truncate">{filters.search || 'Search Events'}</span>
        </button>

        <div className="my-1 h-px w-full bg-gray-200 dark:bg-gray-800" />

        <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Status
        </div>

        <FilterButton
          label="All Events"
          active={filters.status === 'all'}
          icon={LayoutGrid}
          count={stats.all}
          onClick={() => handleStatusChange('all')}
        />

        <FilterButton
          label="Active"
          active={filters.status === 'active'}
          icon={Clock}
          iconClassName="text-green-500"
          count={stats.active}
          onClick={() => handleStatusChange('active')}
        />

        <FilterButton
          label="Upcoming"
          active={filters.status === 'upcoming'}
          icon={Calendar}
          iconClassName="text-blue-500"
          count={stats.upcoming}
          onClick={() => handleStatusChange('upcoming')}
        />

        <FilterButton
          label="Past"
          active={filters.status === 'past'}
          icon={History}
          iconClassName="text-gray-500"
          count={stats.past}
          onClick={() => handleStatusChange('past')}
        />
      </div>

      {searchOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-start justify-center bg-gray-950/40 px-4 pt-28 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl border border-blue-500/20 bg-white/95 p-3 shadow-2xl shadow-blue-500/10 dark:border-blue-500/10 dark:bg-gray-950/95"
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search events..."
              className="h-12 w-full rounded-xl border border-gray-200 bg-white/80 pl-11 pr-4 text-base font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900/80 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && setSearchOpen(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </aside>
  )
}

function iconButtonClass(active: boolean) {
  return `relative inline-flex h-9 w-full items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${active ? 'bg-primary border border-primary text-primary-foreground caret-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0' : 'bg-background border border-input text-foreground caret-transparent hover:border-ring/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 transition-all'
    }`
}

type FilterButtonProps = {
  label: string
  active: boolean
  icon: LucideIcon
  iconClassName?: string
  count?: number
  onClick: () => void
}

function FilterButton({ label, active, icon: Icon, iconClassName, count, onClick }: FilterButtonProps) {
  return (
    <button type="button" onClick={onClick} className={iconButtonClass(active)}>
      <Icon size={18} className={active ? 'text-white' : iconClassName} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] ${active ? 'text-white/70' : 'text-gray-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
