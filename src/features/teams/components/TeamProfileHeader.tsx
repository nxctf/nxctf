'use client'

import React from 'react'
import { Calendar, Flag, Hash, LogOut, Trophy } from 'lucide-react'

import EventSelect, { type EventSelectItem } from '@/features/events/components/EventSelect'
import { Button } from '@/shared/ui'
import { TeamInfo, TeamSummary } from '../types'
import { cn } from '@/shared/lib/utils'

interface TeamProfileHeaderProps {
  team: TeamInfo
  summary: TeamSummary | null
  effectiveSelectedEvent: string | 'all'
  setSelectedEvent: (eventId: string | 'all') => void
  teamEvents: EventSelectItem[]
  showMainOption: boolean
  canManage: boolean
  onCopyInvite?: () => void
  onRegenerateInvite?: () => void
  onLeaveTeam?: () => void
  busy: boolean
  isMember?: boolean
}

export default function TeamProfileHeader({
  team,
  summary,
  effectiveSelectedEvent,
  setSelectedEvent,
  teamEvents,
  showMainOption,
  onLeaveTeam,
  busy,
  isMember = false,
}: TeamProfileHeaderProps) {
  const teamInitials = team.name.slice(0, 2).toUpperCase()

  return (
    <div className={cn("relative overflow-hidden p-5", 'bg-card border border-border rounded-xl')}>
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg border border-gray-200/50 dark:border-white/10">
            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
              {teamInitials}
            </div>
            <div className="absolute inset-0 bg-black/5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h1 className={cn('text-xl font-black tracking-tight text-foreground sm:text-2xl', "truncate")}>
              {team.name}
            </h1>
            <div className={cn("flex items-center gap-1.5", 'text-xs font-medium text-muted-foreground')}>
              <Calendar size={13} className="text-blue-500" />
              <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-60">
          <EventSelect
            value={effectiveSelectedEvent}
            onChange={setSelectedEvent}
            events={teamEvents}
            showMain={showMainOption}
            className="w-full"
            getEventLabel={(ev: any) => String(ev?.name ?? ev?.title ?? 'Untitled')}
          />

          {isMember && onLeaveTeam && (
            <Button
              variant="outline"
              onClick={onLeaveTeam}
              disabled={busy}
              className="h-10 w-full border-red-200/50 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut size={14} className="mr-1.5" /> Leave Team
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200/80 pt-5 dark:border-gray-800">
        <StatItem
          icon={<Hash size={14} className="text-emerald-500" />}
          label="Rank"
          value={summary?.rank ? `#${summary.rank}` : '-'}
        />
        <StatItem
          icon={<Trophy size={14} className="text-yellow-500" />}
          label="Points"
          value={summary?.total_score ?? summary?.unique_score ?? 0}
        />
        <StatItem
          icon={<Flag size={14} className="text-blue-500" />}
          label="Solves"
          value={summary?.unique_challenges ?? 0}
        />
      </div>
    </div>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100/50 dark:bg-gray-800/40">
        {icon}
      </div>
      <div className="min-w-0">
        <div className={cn('text-xs font-bold uppercase tracking-widest text-muted-foreground', "!text-[10px] leading-none")}>
          {label}
        </div>
        <div className={cn('text-xl font-black tracking-tighter text-foreground sm:text-2xl', "mt-1 !text-lg sm:!text-xl")}>
          {value}
        </div>
      </div>
    </div>
  )
}
