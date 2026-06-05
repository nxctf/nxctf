import React from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Eye, KeyRound, Lock, Unlock } from 'lucide-react'
import Image from 'next/image'
import APP from '@/config'
import { Button } from '@/shared/ui'
import { ADMIN_ROW_CLASS, AdminDataSurface, AdminEmptyState, AdminListSurface, AdminStatusBadge } from '@/features/admin/ui'
import { normalizeEventImageUrl } from '@/features/challenges/lib'
import type { Event } from '../types'

interface EventListCardProps {
  events: Event[]
  onEdit: (evt: Event) => void
  onDelete: (evt: Event) => void
}

function formatEventDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEventState(evt: Event) {
  const now = Date.now()
  const start = evt.start_time ? new Date(evt.start_time).getTime() : null
  const end = evt.end_time ? new Date(evt.end_time).getTime() : null

  if (!start && !end) return { label: 'Permanent', tone: 'info' as const }
  if (end && now > end) return { label: 'Ended', tone: 'muted' as const }
  if (start && now < start) return { label: 'Upcoming', tone: 'warning' as const }
  return { label: 'Ongoing', tone: 'success' as const }
}

function getJoinModeMeta(joinMode?: Event['join_mode']) {
  if (joinMode === 'request') return { label: 'Request', icon: Lock }
  if (joinMode === 'key') return { label: 'Key', icon: KeyRound }
  return { label: 'Open', icon: Unlock }
}

const EventListCard: React.FC<EventListCardProps> = ({ events, onEdit, onDelete }) => {
  return (
    <AdminDataSurface
      empty={events.length === 0 ? (
        <AdminEmptyState
          title="No events yet"
          description="Create your first event to get started."
        />
      ) : null}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AdminListSurface>
          {events.map((evt) => (
            <EventListItem
              key={evt.id}
              event={evt}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </AdminListSurface>
      </motion.div>
    </AdminDataSurface>
  )
}

function EventListItem({
  event,
  onEdit,
  onDelete,
}: {
  event: Event
  onEdit: (evt: Event) => void
  onDelete: (evt: Event) => void
}) {
  const eventState = getEventState(event)
  const joinMode = getJoinModeMeta(event.join_mode)
  const JoinIcon = joinMode.icon
  const fallbackImageUrl = normalizeEventImageUrl((APP as any).eventFallbackImageUrl)
  const eventImageUrl = normalizeEventImageUrl(event.image_url) || fallbackImageUrl

  return (
    <div className={`${ADMIN_ROW_CLASS} flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between`}>
      <div className="flex min-w-0 gap-4">
        <div className="relative hidden h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-gray-200/80 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-gray-800 dark:from-blue-950/20 dark:to-indigo-950/20 sm:block">
          {eventImageUrl ? (
            <Image
              src={eventImageUrl}
              alt={event.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CalendarClock className="h-7 w-7 text-blue-500/25" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate text-sm font-bold text-gray-900 dark:text-white">
              {event.name}
            </h3>
            <AdminStatusBadge tone={eventState.tone}>
              {eventState.label}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              <JoinIcon className="h-3 w-3" />
              {joinMode.label}
            </AdminStatusBadge>
            {event.always_show_challenges && (
              <AdminStatusBadge tone="info">
                <Eye className="h-3 w-3" />
                Always visible
              </AdminStatusBadge>
            )}
          </div>

          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
            {event.description || 'No description'}
          </p>

          <div className="grid gap-2 text-xs font-medium text-gray-500 dark:text-gray-500 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">Start: {formatEventDate(event.start_time)}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">End: {formatEventDate(event.end_time)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 lg:self-center">
        <Button variant="outline" size="sm" onClick={() => onEdit(event)} className="rounded-xl">
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(event)} className="rounded-xl">
          Delete
        </Button>
      </div>
    </div>
  )
}

export default EventListCard
