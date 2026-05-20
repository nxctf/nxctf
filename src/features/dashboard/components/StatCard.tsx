import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-xl border bg-card p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-background">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
