import { LocateFixed } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type BaseScoreboardRankBadgeProps = {
  label: string
  rank?: number | null
  score?: React.ReactNode
  scoreLabel?: string
  rowHref?: string | null
  missingLabel: string
  className?: string
}

export default function BaseScoreboardRankBadge({
  label,
  rank,
  score,
  scoreLabel = 'Score',
  rowHref,
  missingLabel,
  className,
}: BaseScoreboardRankBadgeProps) {
  const hasRank = typeof rank === 'number' && rank > 0

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden divide-x divide-blue-500/20 rounded-lg border border-blue-500/20 bg-blue-50/50 shadow-sm backdrop-blur-sm dark:divide-blue-500/20 dark:border-blue-500/20 dark:bg-blue-900/10',
        className
      )}
    >
      {hasRank ? (
        <>
          <div className="flex h-8 items-center gap-2 px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">
              {label}
            </span>
            <span className="text-sm font-black text-gray-900 dark:text-white">
              #{rank}
            </span>
          </div>
          {typeof score !== 'undefined' && (
            <div className="flex h-8 items-center gap-2 px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {scoreLabel}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {score}
              </span>
            </div>
          )}
          {rowHref && (
            <button
              onClick={(e) => {
                e.preventDefault()
                const id = rowHref.startsWith('#') ? rowHref.slice(1) : rowHref
                const element = document.getElementById(id)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
                  }, 2000)
                }
              }}
              className="flex h-8 w-8 items-center justify-center text-blue-600 transition-colors hover:bg-blue-500/10 focus-visible:bg-blue-500/10 focus-visible:outline-none dark:text-blue-400 dark:hover:bg-blue-500/20 dark:focus-visible:bg-blue-500/20"
              title="Jump to my rank"
            >
              <LocateFixed size={14} />
            </button>
          )}
        </>
      ) : (
        <div className="flex h-8 items-center gap-2 px-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">
            {label}
          </span>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {missingLabel}
          </span>
        </div>
      )}
    </div>
  )
}
