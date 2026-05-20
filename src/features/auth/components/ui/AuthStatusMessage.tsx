import type React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface AuthStatusMessageProps {
  children: React.ReactNode
  tone: 'error' | 'success'
  title?: string
}

export function AuthStatusMessage({ children, tone, title }: AuthStatusMessageProps) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border p-3 text-sm',
        tone === 'success'
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        {title && <div className="font-semibold">{title}</div>}
        <div className={title ? 'mt-0.5 text-xs opacity-90' : ''}>{children}</div>
      </div>
    </div>
  )
}
