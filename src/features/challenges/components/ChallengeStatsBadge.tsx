'use client'

import { Flag } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ChallengeStats } from '../hooks/useChallengeStats'

type Props = {
  stats: ChallengeStats | null
  className?: string
}

export default function ChallengeStatsBadge({ stats, className }: Props) {
  const hasData = stats && stats.total > 0

  return (
    <div
      className={cn(
        'flex w-full h-[38px] items-center justify-between rounded-full border border-gray-200/30 bg-white/40 px-4 py-2 shadow-sm backdrop-blur-md dark:border-gray-800/30 dark:bg-gray-900/40',
        className
      )}
    >
      {hasData ? (
        <>
          <span className="select-none text-sm font-bold tabular-nums tracking-tight text-gray-900 dark:text-white">
            {stats.solved > 0 ? `#${stats.rank ?? 'N/A'}` : 'N/A'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="select-none text-sm font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.solved}/{stats.total}
            </span>
            <Flag size={13} strokeWidth={2.5} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          </div>
        </>
      ) : (
        <span className="select-none text-sm font-bold tabular-nums tracking-tight text-gray-400 dark:text-gray-500">
          N/A  N/A
        </span>
      )}
    </div>
  )
}
