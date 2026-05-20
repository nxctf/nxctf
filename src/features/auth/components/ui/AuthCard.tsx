'use client'

import React from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/shared/lib/utils'

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
        'w-full px-6 py-8 sm:px-8 sm:py-10',
        'bg-card border border-border rounded-2xl',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
