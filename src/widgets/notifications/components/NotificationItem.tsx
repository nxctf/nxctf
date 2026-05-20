'use client'

import { Megaphone, Server, Flag, Trash2 } from 'lucide-react'
import { cn, formatRelativeDate } from '@/shared/lib/utils'

function formatNotificationText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, (match) => match.slice(3, -3))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type NotificationItemProps = {
  notification: {
    id: string
    title: string
    message: string
    level: string
    created_at: string
  }
  isRead: boolean
  onDelete?: (id: string) => void
  onClick?: () => void
}

function getIconAndLabel(level: string) {
  switch (level) {
    case 'info_challenges':
      return { Icon: Flag, label: 'Challenges', colorClass: 'text-blue-500 bg-blue-500/10 ring-blue-500/20 dark:text-blue-400' }
    case 'info_platform':
      return { Icon: Server, label: 'System', colorClass: 'text-indigo-500 bg-indigo-500/10 ring-indigo-500/20 dark:text-indigo-400' }
    case 'info':
    default:
      return { Icon: Megaphone, label: 'Broadcast', colorClass: 'text-orange-500 bg-orange-500/10 ring-orange-500/20 dark:text-orange-400' }
  }
}

export default function NotificationItem({
  notification,
  isRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const { Icon, label, colorClass } = getIconAndLabel(notification.level)

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
        onClick ? "cursor-pointer" : "",
        !isRead
          ? "bg-blue-500/[0.03] dark:bg-blue-400/[0.04] ring-1 ring-blue-500/20"
          : "hover:bg-blue-500/5 dark:hover:bg-blue-400/5 ring-1 ring-transparent hover:ring-gray-200/50 dark:hover:ring-gray-800/50"
      )}
    >
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-105", colorClass)}>
        <Icon size={14} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[13px] font-bold truncate leading-tight text-foreground" title={notification.title}>
            {notification.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {!isRead && (
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(notification.id)
                }}
                className="p-1.5 -mr-1.5 -mt-1.5 rounded text-gray-400/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Delete broadcast"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400/90 leading-relaxed whitespace-pre-line break-words line-clamp-3 font-medium">
          {formatNotificationText(notification.message)}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          <span>{label}</span>
          <span>•</span>
          <span>{notification.created_at ? formatRelativeDate(notification.created_at) : ''}</span>
        </div>
      </div>
    </div>
  )
}
