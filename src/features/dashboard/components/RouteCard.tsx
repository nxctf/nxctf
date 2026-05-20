import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export function RouteCard({
  title,
  description,
  href,
  icon,
  className,
}: {
  title: string
  description: string
  href: string
  icon: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all',
        'hover:border-primary/30 hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
          {icon}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}
