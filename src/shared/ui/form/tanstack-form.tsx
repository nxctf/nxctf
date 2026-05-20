"use client"

import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Label } from '@/shared/ui/label'

type FieldShellProps = {
  id: string
  label: string
  error?: string | null
  description?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function FieldShell({
  id,
  label,
  error,
  description,
  required,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

