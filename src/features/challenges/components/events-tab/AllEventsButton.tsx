'use client'

import type { CSSProperties } from 'react'
import { Layers } from 'lucide-react'

type AllEventsButtonProps = {
  selected: boolean
  delay?: number
  onSelect: () => void
}

export default function AllEventsButton({
  selected,
  delay = 0,
  onSelect,
}: AllEventsButtonProps) {
  return (
    <button
      onClick={onSelect}
      style={{ '--card-reveal-delay': `${delay}s` } as CSSProperties}
      className={`event-card-reveal relative w-full px-5 py-4 rounded-2xl border backdrop-blur-md transition-all duration-200 text-left group hover:-translate-y-1 active:scale-[0.98]
        ${selected
          ? 'bg-blue-500/[0.03] border-blue-500/50 shadow-sm'
          : 'bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 shadow-sm'}
      `}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] rounded-2xl transition-colors duration-300 pointer-events-none" />

      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
            <Layers size={20} />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              All Challenges
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              Browse across all available events
            </p>
          </div>
        </div>

        {selected && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <div className="font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-wider">
              Active
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
