'use client'

import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type ProfileChallengeListItemProps = {
  title: string
  subtitle: ReactNode
  titleBadge?: ReactNode
  trailing?: ReactNode
  className?: string
}

export default function ProfileChallengeListItem({
  title,
  subtitle,
  titleBadge,
  trailing,
  className,
}: ProfileChallengeListItemProps) {
  return (
    <div
      className={cn(
        'flex min-h-[64px] flex-col justify-between gap-2 p-3.5 sm:flex-row sm:items-center',
        'bg-card border border-border rounded-xl',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className={cn("min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap", 'text-sm font-semibold text-foreground')}>
            {title}
          </h3>
          {titleBadge ? <div className="shrink-0">{titleBadge}</div> : null}
        </div>

        <div className={cn("mt-0.5 min-h-4 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap", 'text-xs font-medium text-muted-foreground')}>
          {subtitle}
        </div>
      </div>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}
