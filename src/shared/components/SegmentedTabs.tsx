import React from 'react'
import { cn } from '@/shared/lib/utils'

type SegmentedTabsVariant = 'pill' | 'panel' | 'panelLarge' | 'compact'

type SegmentedTabsItem<T extends string> = {
  value: T
  label: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

type SegmentedTabsProps<T extends string> = {
  items: SegmentedTabsItem<T>[]
  value: T
  onChange: (value: T) => void
  variant?: SegmentedTabsVariant
  className?: string
  stretch?: boolean
}

const containerClasses: Record<SegmentedTabsVariant, string> = {
  pill:
    'inline-flex max-w-full flex-nowrap overflow-x-auto rounded-full border border-gray-200 bg-white/50 p-1 backdrop-blur scroll-hidden dark:border-white/10 dark:bg-gray-800/50',
  panel:
    'flex w-fit max-w-full flex-nowrap gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white/40 p-1.5 backdrop-blur-sm scroll-hidden dark:border-gray-800 dark:bg-gray-900/40',
  panelLarge:
    'flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white/40 p-1 backdrop-blur-sm scroll-hidden dark:border-gray-800 dark:bg-gray-900/40',
  compact:
    'flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-black/5 p-1 scroll-hidden dark:border-gray-800 dark:bg-white/5',
}

const buttonClasses: Record<SegmentedTabsVariant, string> = {
  pill:
    'flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold caret-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0',
  panel:
    'flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold caret-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0 sm:px-5',
  panelLarge:
    'flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest caret-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0',
  compact:
    'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-center text-xs font-bold caret-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0',
}

const activeClasses: Record<SegmentedTabsVariant, string> = {
  pill:
    'bg-blue-500/15 text-blue-600 shadow-sm dark:text-blue-400',
  panel:
    'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400',
  panelLarge:
    'bg-white text-blue-600 shadow-lg shadow-blue-500/10 dark:bg-gray-800 dark:text-blue-400',
  compact:
    'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400',
}

const inactiveClasses: Record<SegmentedTabsVariant, string> = {
  pill:
    'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
  panel:
    'text-gray-500 hover:bg-white/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200',
  panelLarge:
    'text-gray-500 hover:bg-white/50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200',
  compact:
    'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'panel',
  className,
  stretch = false,
}: SegmentedTabsProps<T>) {
  return (
    <div className={cn(containerClasses[variant], stretch && 'w-full', className)}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.value === value

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              buttonClasses[variant],
              stretch && 'flex-1 basis-0',
              isActive ? activeClasses[variant] : inactiveClasses[variant]
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  variant === 'compact' ? 'h-4 w-4' : 'h-4 w-4',
                  isActive && 'text-blue-600 dark:text-blue-400'
                )}
              />
            ) : null}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
