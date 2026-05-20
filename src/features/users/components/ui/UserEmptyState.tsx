import React from 'react'
import type { LucideIcon } from 'lucide-react'
import EmptyState from '@/shared/components/EmptyState'
import { cn } from '@/shared/lib/utils'

type UserEmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function UserEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: UserEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white/40 backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/40',
        className
      )}
    >
      <EmptyState
        icon={<Icon className="h-full w-full text-blue-500 dark:text-blue-400" />}
        title={title}
        description={description}
        action={action}
        containerHeight="py-8"
        className="[&_div:first-child]:bg-blue-500/10 [&_div:first-child]:text-blue-500 [&_div:first-child]:ring-1 [&_div:first-child]:ring-blue-500/20"
      />
    </div>
  )
}
