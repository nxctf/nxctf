'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { SURFACE_GLASS_CARD_CLASS, SURFACE_INTERACTIVE_HOVER_CLASS } from '@/shared/styles'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'w-full px-6 pt-5 pb-7 sm:px-8 sm:pt-6 sm:pb-8',
        SURFACE_GLASS_CARD_CLASS,
        SURFACE_INTERACTIVE_HOVER_CLASS,
        className
      )}
    >
      {children}
    </motion.div>
  )
}
