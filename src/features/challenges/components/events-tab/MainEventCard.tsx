'use client'

import type { CSSProperties } from 'react'
import { Calendar } from 'lucide-react'
import Image from 'next/image'

type MainEventCardProps = {
  label: string
  imageUrl: string | null
  selected: boolean
  delay: number
  onSelect: () => void
}

export default function MainEventCard({
  label,
  imageUrl,
  selected,
  delay,
  onSelect,
}: MainEventCardProps) {
  return (
    <div
      key="__main__"
      style={{ '--card-reveal-delay': `${delay}s` } as CSSProperties}
      className="event-card-reveal relative group cursor-pointer h-full transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
      onClick={onSelect}
    >
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] rounded-2xl transition-colors duration-300 pointer-events-none" />

      <div className={`relative h-full flex flex-col overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300
        ${selected
          ? 'bg-blue-500/[0.03] border-blue-500/50 shadow-sm'
          : 'bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 group-hover:border-blue-500/50 shadow-sm'}
        hover:shadow-md`}
      >
        {/* Image Section */}
        <div className="relative h-40 w-full overflow-hidden border-b border-gray-100 dark:border-gray-800/50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
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
              <div className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                Main
              </div>
            </div>

            <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {label}
            </h4>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
              <Calendar size={12} className="text-blue-500/50" />
              <span>Platform Default</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
