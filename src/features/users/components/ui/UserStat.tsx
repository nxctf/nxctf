import type React from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type UserStatProps = {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function UserStat({ icon: Icon, label, value, detail, onClick, className }: UserStatProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group flex min-h-[72px] w-full items-center gap-3 p-3 text-left sm:min-h-21',
        'bg-card border border-border rounded-xl',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 transition-transform duration-300 group-hover:scale-105 dark:text-blue-400 sm:h-10 sm:w-10 sm:rounded-xl">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('text-xl font-black tracking-tighter text-foreground sm:text-2xl', "leading-tight")}>
          {value}
        </div>
        <div className={cn('text-xs font-bold uppercase tracking-widest text-muted-foreground', "mt-1 !text-[10px]")}>
          {label}
        </div>
        {detail && (
          <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400 font-medium">
            {detail}
          </div>
        )}
      </div>
    </Component>
  )
}
