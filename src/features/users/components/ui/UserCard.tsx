'use client'

import React from 'react'
import { cn } from '@/shared/lib/utils'

type UserCardProps = {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function UserCard({ children, className, hover = true }: UserCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40',
        className
      )}
    >
      {children}
    </div>
  )
}
