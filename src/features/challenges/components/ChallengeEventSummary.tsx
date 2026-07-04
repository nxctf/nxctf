'use client'

import { Flag } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type ChallengeEventSummaryProps = {
  selectedEventName?: string
  eventStats?: { solvedCount: number; totalCount: number } | null
  compact?: boolean
  className?: string
  nameClassName?: string
}

export default function ChallengeEventSummary({
  selectedEventName,
  eventStats,
  compact = false,
  className,
  nameClassName,
}: ChallengeEventSummaryProps) {
  if (!selectedEventName) return null

  return (
    <div
      className={cn(
        'flex h-[38px] items-center gap-3 rounded-full border border-gray-200/30 bg-white/40 px-4 py-2 shadow-sm backdrop-blur-md dark:border-gray-800/30 dark:bg-gray-900/40',
        compact && 'gap-2 px-3',
        className
      )}
    >
      <span
        className={cn(
          'truncate text-sm font-bold tracking-tight text-gray-900 dark:text-white max-w-[150px] md:max-w-[250px]',
          compact && 'max-w-[110px] text-xs md:max-w-[160px]',
          nameClassName
        )}
      >
        {selectedEventName}
      </span>

      {eventStats && (
        <>
          <div className="h-[4px] w-[4px] rounded-full bg-gray-300 dark:bg-gray-700" />
          <div
            className={cn(
              'flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 dark:text-emerald-400',
              compact && 'gap-1 text-xs'
            )}
          >
            <Flag size={compact ? 12 : 13} strokeWidth={2.5} />
            <span>
              {eventStats.solvedCount} / {eventStats.totalCount}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
