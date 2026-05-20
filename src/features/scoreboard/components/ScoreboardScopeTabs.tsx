'use client'

import { Trophy, Globe } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useTransition } from 'react'

type ScoreboardScopeTabsProps = {
  view: 'top' | 'all'
  onViewChange: (view: 'top' | 'all') => void
  className?: string
}

export default function ScoreboardScopeTabs({
  view,
  onViewChange,
  className,
}: ScoreboardScopeTabsProps) {
  const isTopActive = view === 'top'
  const [, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(() => {
      onViewChange(isTopActive ? 'all' : 'top')
    })
  }

  return (
    <div
      className={cn(
        'flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center',
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'inline-flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/40 p-1 text-xs font-semibold shadow-sm backdrop-blur-sm transition hover:border-blue-500/30 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-gray-900/70 sm:w-auto xl:w-[200px]'
        )}
      >
        <span
          className={cn(
            'inline-flex h-full min-w-0 items-center justify-center gap-1.5 rounded-lg',
            isTopActive
              ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
              : 'shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            isTopActive ? 'w-8 shrink-0' : 'flex-1 px-2'
          )}
        >
          <Trophy className={cn('h-4 w-4 shrink-0', isTopActive && 'text-blue-600 dark:text-blue-400')} />
          {!isTopActive && <span className="truncate">Top 100</span>}
        </span>

        <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />

        <span
          className={cn(
            'inline-flex h-full min-w-0 items-center justify-center gap-1.5 rounded-lg',
            !isTopActive
              ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
              : 'shrink-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            !isTopActive ? 'w-8 shrink-0' : 'flex-1 px-2'
          )}
        >
          <Globe className={cn('h-4 w-4 shrink-0', !isTopActive && 'text-blue-600 dark:text-blue-400')} />
          {isTopActive && <span className="truncate">Top 1000</span>}
        </span>
      </button>
    </div>
  )
}
