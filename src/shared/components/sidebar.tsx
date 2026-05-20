import Link from 'next/link'
import type { ElementType, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Badge, Button } from '@/shared/ui'

export type SidebarSectionProps = {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function SidebarSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SidebarSectionProps) {
  return (
    <section className={cn('space-y-2', className)}>
      {title || description || action ? (
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="min-w-0 space-y-0.5">
            {title ? (
              <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn('space-y-1.5', contentClassName)}>{children}</div>
    </section>
  )
}

export type SidebarItemProps = {
  label: ReactNode
  description?: ReactNode
  icon?: ElementType
  iconNode?: ReactNode
  active?: boolean
  trailing?: ReactNode
  title?: string
  onClick?: () => void
  href?: string
  className?: string
}

export function SidebarItem({
  label,
  description,
  icon: Icon,
  iconNode,
  active = false,
  trailing,
  title,
  onClick,
  href,
  className,
}: SidebarItemProps) {
  const content = (
    <>
      {iconNode ? iconNode : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium">{label}</span>
        {description ? (
          <span className="block truncate text-xs opacity-75">{description}</span>
        ) : null}
      </span>
      {trailing}
    </>
  )

  const itemClassName = cn(
    'group flex h-auto min-h-10 w-full items-center justify-start gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
    active
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'border border-input bg-background text-foreground hover:border-ring/40 hover:bg-accent hover:text-accent-foreground',
    className,
  )

  if (href) {
    return (
      <Link href={href} title={title} className={itemClassName}>
        {content}
      </Link>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={itemClassName}
    >
      {content}
    </Button>
  )
}

export function SidebarCount({ children }: { children: ReactNode }) {
  return (
    <Badge variant="outline" className="ml-auto shrink-0 px-1.5 py-0 text-[10px]">
      {children}
    </Badge>
  )
}
