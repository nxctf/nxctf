'use client'

'use client'

import type { CSSProperties } from 'react'
import { Calendar } from 'lucide-react'
import Image from 'next/image'
import { SurfaceCard } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

type MainEventCardProps = {
  label: string
  imageUrl: string | null
  selected: boolean
  delay: number
  onSelect: () => void
  disabled?: boolean
}

export default function MainEventCard({
  label,
  imageUrl,
  selected,
  delay,
  onSelect,
  disabled,
}: MainEventCardProps) {
  return (
    <div
      key="__main__"
      style={{ '--card-reveal-delay': `${delay}s` } as CSSProperties}
      className={cn(
        "event-card-reveal relative group h-full transition-all duration-200",
        disabled ? "cursor-not-allowed opacity-50 filter grayscale" : "cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
      )}
      onClick={disabled ? undefined : onSelect}
    >
      {/* Glow Effect on Hover */}
      {!disabled && (
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] rounded-2xl transition-colors duration-300 pointer-events-none" />
      )}

      <SurfaceCard
        variant="glass"
        className={cn(
          'relative flex h-full flex-col overflow-hidden transition-all duration-300',
          !disabled && 'group-hover:border-blue-500/50 hover:shadow-md',
          selected && !disabled && 'border-blue-500/50 bg-blue-500/[0.03]'
        )}
      >
        {/* Image Section */}
        <div className="relative h-40 w-full overflow-hidden border-b border-gray-100 dark:border-gray-800/50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={label}
              fill
              className={cn("object-cover transition-transform duration-500", !disabled && "group-hover:scale-105")}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-center">
              <Calendar size={24} className="text-blue-500/20" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {disabled ? (
                <div className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                  Disabled
                </div>
              ) : (
                <div className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  Main
                </div>
              )}
            </div>

            <h4 className={cn(
              "text-sm md:text-base font-bold leading-tight transition-colors line-clamp-1",
              disabled ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            )}>
              {label}
            </h4>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              <Calendar size={12} className="text-blue-500/50" />
              <span>{disabled ? 'Currently Unavailable' : 'Platform Default'}</span>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
