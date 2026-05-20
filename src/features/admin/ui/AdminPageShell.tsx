'use client'

import React from 'react'
import { cn } from '@/shared/lib/utils'

interface AdminPageShellProps {
  children: React.ReactNode
  mainClassName?: string
  backButtonClassName?: string
}

const AdminPageShell = ({
  children,
  mainClassName = '',
  backButtonClassName: _backButtonClassName = '',
}: AdminPageShellProps) => {
  return (
    <div className="min-h-screen bg-muted/30">
      <main
        className={cn(
          'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8',
          mainClassName
        )}
      >
        {children}
      </main>
    </div>
  )
}

export default AdminPageShell
