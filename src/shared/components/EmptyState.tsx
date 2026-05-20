'use client'

import React from 'react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  containerHeight?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  containerHeight = "py-10"
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${containerHeight} ${className}`}>
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 sm:h-16 sm:w-16"
      >
        <div className="flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
          {icon}
        </div>
      </div>
      <h3
        className="mb-2 text-base font-medium text-gray-900 dark:text-white"
      >
        {title}
      </h3>
      {description && (
        <div
          className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </div>
      )}
      {action && (
        <div
          className="mt-4"
        >
          {action}
        </div>
      )}
    </div>
  )
}
