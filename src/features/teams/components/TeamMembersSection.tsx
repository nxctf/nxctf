'use client'

import Link from 'next/link'
import { Crown, Users, UserX } from 'lucide-react'

import EmptyState from '@/shared/components/EmptyState'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { TeamMember } from '../types'

interface TeamMembersSectionProps {
  members: TeamMember[]
  canManage?: boolean
  currentUserId?: string
  onKickMember?: (member: TeamMember) => void
  onTransferCaptain?: (member: TeamMember) => void
  busy?: boolean
  isOverview?: boolean
}

export default function TeamMembersSection({
  members,
  canManage,
  currentUserId,
  onKickMember,
  onTransferCaptain,
  busy,
}: TeamMembersSectionProps) {
  return (
    <Card className="bg-card border border-border rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={18} className="text-blue-500" /> 
          Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {members.length === 0 ? (
          <EmptyState
            icon={<UserX className="w-full h-full" />}
            title="No members found"
            description="Invite your friends to join your team!"
            containerHeight="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {members.map((m) => (
              <div key={m.user_id} className={`group relative overflow-hidden p-3 ${'bg-card border border-border rounded-xl'} ${'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40'}`}>
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-sm text-gray-500 dark:text-gray-400">
                    {m.username.slice(0, 1).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/user/${encodeURIComponent(m.username)}`}
                        className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 transition-colors truncate"
                      >
                        {m.username}
                      </Link>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${m.role === 'captain'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        }`}>
                        {m.role}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 dark:text-gray-200">{m.first_solve_count ?? 0}</span> Solves
                      </div>
                      <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 dark:text-gray-200">{m.solo_score ?? 0}</span> Pts
                      </div>
                    </div>
                  </div>

                  {canManage && m.user_id !== currentUserId && onKickMember && onTransferCaptain && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        onClick={() => onTransferCaptain(m)}
                        disabled={busy}
                        title="Transfer Captain"
                      >
                        <Crown size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => onKickMember(m)}
                        disabled={busy}
                        title="Kick Member"
                      >
                        <UserX size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
