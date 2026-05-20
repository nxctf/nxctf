import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pt-8', className)}>
      {children}
    </div>
  )
}
