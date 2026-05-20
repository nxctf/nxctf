'use client'

import React from 'react'
import { motion } from 'framer-motion'

import APP from '@/config'
import PageBackground from '@/shared/components/PageBackground'
import { cn } from '@/shared/lib/utils'

interface AuthPageShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function AuthPageShell({ children, className, contentClassName }: AuthPageShellProps) {
  const watermarkSrc = APP.nxctf?.nxctf_logo || APP.image_logo

  return (
    <PageBackground
      className={cn(
        'relative flex !min-h-[calc(100vh-3.5rem)] flex-col overflow-hidden',
        className
      )}
      selectionClassName={'selection:bg-primary/30'}
    >
      {watermarkSrc && (
        <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.015] dark:opacity-[0.01]">
          <img
            src={watermarkSrc}
            alt=""
            aria-hidden="true"
            className="h-auto w-[min(56vw,520px)] select-none object-contain"
          />
        </div>
      )}

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center px-6 py-10',
          contentClassName
        )}
      >
        {children}
      </motion.main>
    </PageBackground>
  )
}
