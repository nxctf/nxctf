'use client'

import { Flag, Zap } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ChallengesMainTab } from '../../types'
import ChallengeEventSummary from '../ChallengeEventSummary'

type ChallengePageTabsProps = {
  currentTab: ChallengesMainTab
  onTabChange: (tab: ChallengesMainTab) => void
  selectedEventName?: string
  eventStats?: { solvedCount: number; totalCount: number } | null
  compact?: boolean
  iconOnly?: boolean
  showSummary?: boolean
  className?: string
}

export default function ChallengePageTabs({
  currentTab,
  onTabChange,
  selectedEventName,
  eventStats,
  compact = false,
  iconOnly = false,
  showSummary = true,
  className,
}: ChallengePageTabsProps) {
  const isChallengesActive = currentTab === 'challenges'
  const nextTab: ChallengesMainTab = isChallengesActive ? 'events' : 'challenges'

  return (
    <div
      data-tour="challenge-page-tabs"
      className={cn(
        'flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center',
        iconOnly && 'inline-flex',
        compact ? 'gap-2' : 'gap-4',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onTabChange(nextTab)}
        aria-label={`Switch to ${nextTab === 'challenges' ? 'Challenges' : 'Events'}`}
        title={`Switch to ${nextTab === 'challenges' ? 'Challenges' : 'Events'}`}
        className={cn(
          'inline-flex min-w-0 select-none items-center rounded-xl border border-gray-200 bg-white/40 p-2 text-xs font-semibold shadow-sm backdrop-blur-sm transition hover:border-blue-500/30 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-gray-900/70',
          compact ? 'h-11' : 'h-12',
          iconOnly ? 'w-auto' : 'w-full sm:w-auto xl:w-full'
        )}
      >
        <span
          className={cn(
            'inline-flex h-full min-w-0 items-center justify-center gap-1.5 rounded-lg transition-all',
            isChallengesActive
              ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
              : 'shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            iconOnly ? 'w-8' : isChallengesActive ? 'w-11 shrink-0' : 'flex-1 px-2'
          )}
        >
          <Flag className={cn('h-4 w-4 shrink-0', isChallengesActive && 'text-blue-600 dark:text-blue-400')} />
          {!iconOnly && !isChallengesActive && <span className="truncate">Challenges</span>}
        </span>

        <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />

        <span
          className={cn(
            'inline-flex h-full min-w-0 items-center justify-center gap-1.5 rounded-lg transition-all',
            !isChallengesActive
              ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
              : 'shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            iconOnly ? 'w-8' : !isChallengesActive ? 'w-11 shrink-0' : 'flex-1 px-2'
          )}
        >
          <Zap className={cn('h-4 w-4 shrink-0', !isChallengesActive && 'text-blue-600 dark:text-blue-400')} />
          {!iconOnly && isChallengesActive && <span className="truncate">Events</span>}
        </span>
      </button>

      {showSummary && !compact && (
        <ChallengeEventSummary
          selectedEventName={selectedEventName}
          eventStats={eventStats}
        />
      )}
    </div>
  )
}
