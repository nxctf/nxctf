import type React from 'react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

type BaseScoreboardCardProps = {
  title?: string
  icon?: LucideIcon
  headerCenter?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  titleClassName?: string
  contentClassName?: string
}

export default function BaseScoreboardCard({
  title,
  icon: Icon,
  headerCenter,
  action,
  children,
  className,
  headerClassName,
  titleClassName,
  contentClassName,
}: BaseScoreboardCardProps) {
  const hasHeader = title || headerCenter || action
  const headerLayoutClass = headerCenter
    ? 'grid grid-cols-1 gap-3 border-b border-gray-200/70 px-4 py-3.5 dark:border-gray-800/80 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-5'
    : 'flex flex-row items-center justify-between gap-3 border-b border-gray-200/70 px-4 py-3.5 dark:border-gray-800/80 sm:px-5'

  return (
    <Card className={cn('bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40', 'overflow-hidden', className)}>
      {hasHeader && (
        <CardHeader
          className={cn(headerLayoutClass, headerClassName)}
        >
          <div className="min-w-0">
            {title && (
              <CardTitle
                className={cn(
                  'flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white',
                  titleClassName
                )}
              >
                {Icon && <Icon size={18} className="text-blue-500 dark:text-blue-400" />}
                {title}
              </CardTitle>
            )}
          </div>
          {headerCenter && (
            <div className="flex min-w-0 justify-start sm:justify-center">
              {headerCenter}
            </div>
          )}
          {action && (
            <div className="flex justify-start sm:justify-end">
              {action}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={cn('p-4 sm:p-5', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
