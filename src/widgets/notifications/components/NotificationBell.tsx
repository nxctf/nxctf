'use client'

import React from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type NotificationBellProps = {
  notifButtonRef: React.RefObject<HTMLButtonElement | null>
  notifOpen: boolean
  unreadCount: number
  onToggle: () => void
}

export default function NotificationBell({
  notifButtonRef,
  notifOpen,
  unreadCount,
  onToggle,
}: NotificationBellProps) {
  return (
    <div className="relative mr-2" data-tour="navbar-notifications">
      <button
        ref={notifButtonRef}
        className={cn(
          'rounded-full p-1 transition-colors duration-150',
          notifOpen && 'bg-primary/10'
        )}
        title="Notifications"
        aria-label="Notifications"
        onClick={onToggle}
      >
        <Bell size={22} className="text-primary" />
      </button>

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-white">
          {unreadCount > 99 ? '99+' : String(unreadCount)}
        </span>
      )}
    </div>
  )
}
