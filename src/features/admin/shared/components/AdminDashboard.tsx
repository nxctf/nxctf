import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

type AdminSectionProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function AdminDashboardSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: AdminSectionProps) {
  return (
    <Card className={cn('border-border/70 bg-card shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn('pt-0', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function AdminDashboardStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-6', className)}>{children}</div>
}
