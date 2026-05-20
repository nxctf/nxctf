'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react'

import ConfirmDialog from '@/shared/components/ConfirmDialog'
import Loader from '@/shared/components/Loader'
import PageBackground from '@/shared/components/PageBackground'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/ui'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useEventContext } from '@/features/events/contexts/EventContext'

import TeamPageContent from './TeamPageContent'
import { useMyTeam } from '../hooks/useMyTeam'
import { useTeamEvents } from '../hooks/useTeamEvents'
import type { TeamChallenge, TeamInfo, TeamMember, TeamSummary } from '../types'
import { cn } from '@/shared/lib/utils'

export default function TeamsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { startedEvents, selectedEvent, setSelectedEvent } = useEventContext()

  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('Are you sure?')
  const [confirmExpected, setConfirmExpected] = useState<string | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const confirmActionRef = useRef<() => Promise<void> | void>(() => { })

  // First check if user is logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Get data using hooks
  const [tempSolvedEventIds, setTempSolvedEventIds] = useState<string[]>([])
  const [tempHasMainSolved, setTempHasMainSolved] = useState<boolean>(false)

  const { teamEvents, showMainOption, effectiveSelectedEvent } = useTeamEvents(
    startedEvents,
    tempSolvedEventIds,
    tempHasMainSolved,
    selectedEvent
  )

  const {
    loading,
    busy,
    team,
    members,
    summary,
    challenges,
    solvedEventIds,
    hasMainSolved,
    status,
    setStatus,
    initialLoading,
    canManage,
    handleCreateTeam,
    handleJoinTeam,
    handleLeaveTeam,
    handleDeleteTeam,
    handleRegenerateInvite,
    handleKickMember,
    handleTransferCaptain,
    handleRenameTeam
  } = useMyTeam(user, effectiveSelectedEvent)

  // Sync back solved data to useTeamEvents
  useEffect(() => {
    setTempSolvedEventIds(solvedEventIds)
    setTempHasMainSolved(hasMainSolved)
  }, [solvedEventIds, hasMainSolved])

  // Stable states to prevent DOM swap flicker
  const [stableTeam, setStableTeam] = useState<TeamInfo | null>(null)
  const [stableMembers, setStableMembers] = useState<TeamMember[]>([])
  const [stableSummary, setStableSummary] = useState<TeamSummary | null>(null)
  const [stableChallenges, setStableChallenges] = useState<TeamChallenge[]>([])

  useEffect(() => {
    requestAnimationFrame(() => {
      setStableTeam(team)
      setStableMembers(members)
      setStableSummary(summary)
      setStableChallenges(challenges)
    })
  }, [team, members, summary, challenges])

  const onCreateTeam = async () => {
    await handleCreateTeam(teamName)
    setTeamName('')
  }

  const onJoinTeam = async () => {
    await handleJoinTeam(inviteCode)
    setInviteCode('')
  }

  const onLeaveTeamClick = () => {
    if (!team) return
    setConfirmMessage('Leave this team?')
    setConfirmExpected('leave this team')
    setConfirmInput('')
    confirmActionRef.current = handleLeaveTeam
    setConfirmOpen(true)
  }

  const onDeleteTeamClick = () => {
    if (!team) return
    setConfirmMessage('Delete this team? This cannot be undone.')
    setConfirmExpected('delete this team')
    setConfirmInput('')
    confirmActionRef.current = () => handleDeleteTeam(team.id)
    setConfirmOpen(true)
  }

  const onRegenerateInviteClick = () => {
    if (!team) return
    setConfirmMessage('Regenerate invite code? Old code will be invalid.')
    setConfirmExpected(null)
    setConfirmInput('')
    confirmActionRef.current = () => handleRegenerateInvite(team.id)
    setConfirmOpen(true)
  }

  const onCopyInvite = async () => {
    if (!team?.invite_code) return
    try {
      await navigator.clipboard.writeText(team.invite_code)
      setStatus({ type: 'success', message: 'Invite code copied.' })
    } catch {
      setStatus({ type: 'error', message: 'Failed to copy invite code.' })
    }
  }

  const onKickMemberClick = (member: TeamMember) => {
    if (!team) return
    setConfirmMessage(`Kick ${member.username} from the team?`)
    setConfirmExpected(null)
    setConfirmInput('')
    confirmActionRef.current = () => handleKickMember(team.id, member)
    setConfirmOpen(true)
  }

  const onTransferCaptainClick = (member: TeamMember) => {
    if (!team) return
    setConfirmMessage(`Transfer captain role to ${member.username}? You will become a regular member.`)
    setConfirmExpected('transfer captain')
    setConfirmInput('')
    confirmActionRef.current = () => handleTransferCaptain(team.id, member)
    setConfirmOpen(true)
  }

  const onRenameTeamInternal = (newName: string) => {
    if (!team) return Promise.resolve({ success: false, error: 'No team' })
    return handleRenameTeam(team.id, newName)
  }

  if (authLoading) {
    return (
      <PageBackground
        className="flex justify-center items-center overflow-hidden"
        selectionClassName="selection:bg-blue-500/30"
      >
        <Loader color="text-blue-500" />
      </PageBackground>
    )
  }

  if (!user) return null

  return (
    <PageBackground selectionClassName={'selection:bg-primary/30'}>
      <div className={cn('relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 py-3 sm:py-4', "space-y-4")}>
        {initialLoading ? (
          <div className="flex justify-center py-12">
            <Loader color="text-blue-500" />
          </div>
        ) : (
          <>
            {loading && team && (
              <div className="fixed top-20 right-8 z-50 opacity-70 pointer-events-none">
                <Loader />
              </div>
            )}

            {status && (
              <div
                className={cn("rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm border",
                  status.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/50'
                )}
              >
                {status.message}
              </div>
            )}

            {!team ? (
              <div className="grid grid-cols-1 items-start gap-6 pt-2 md:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.75fr)]">
                <div className={cn("space-y-4 p-6", 'bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40')}>
                  <div className="space-y-2">
                    <h2 className={'text-xl font-black tracking-tight text-foreground sm:text-2xl'}>
                      Squad up for the <span className="text-blue-600 dark:text-blue-400">Next Conquest.</span>
                    </h2>
                    <p className={cn('text-xs text-muted-foreground', "text-sm leading-6")}>
                      Join an existing crew or build your own elite team of hackers. Solve together, win together.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className={cn("flex items-center gap-3 p-4", 'bg-card border border-border rounded-xl')}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className={'text-xs font-bold uppercase tracking-widest text-muted-foreground'}>Collaboration</p>
                        <p className="text-sm font-bold">Shared Solves</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 p-4", 'bg-card border border-border rounded-xl')}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className={'text-xs font-bold uppercase tracking-widest text-muted-foreground'}>Competition</p>
                        <p className="text-sm font-bold">Team Rank</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className={'bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40'}>
                    <CardHeader>
                      <CardTitle className={cn('text-xs font-bold uppercase tracking-widest text-muted-foreground', "flex items-center gap-2 !text-gray-900 dark:!text-white")}>
                        <Sparkles size={16} className="text-blue-500" /> Start Your Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className={cn('text-xs font-bold uppercase tracking-widest text-muted-foreground', "ml-1 !text-[10px]")}>Team Name</label>
                        <Input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="CyberKnights, VoidWalkers, etc."
                          disabled={busy}
                          className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'}
                        />
                      </div>
                      <Button
                        onClick={onCreateTeam}
                        disabled={busy || !teamName.trim()}
                        className="h-10 w-full font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20"
                      >
                        Create Team
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200 dark:border-gray-800/60" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-background px-3 text-muted-foreground font-black tracking-[0.2em]">Or Join One</span>
                    </div>
                  </div>

                  <Card className={'bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40'}>
                    <CardHeader>
                      <CardTitle className={cn('text-xs font-bold uppercase tracking-widest text-muted-foreground', "flex items-center gap-2 !text-gray-900 dark:!text-white")}>
                        <UserPlus size={16} className="text-emerald-500" /> Enter Invite Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Paste code here..."
                        disabled={busy}
                        className={`${'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'} font-mono text-center tracking-widest`}
                      />
                      <Button
                        onClick={onJoinTeam}
                        disabled={busy || !inviteCode.trim()}
                        variant="secondary"
                        className="h-10 w-full font-bold uppercase tracking-widest"
                      >
                        Join Team
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <TeamPageContent
                key={effectiveSelectedEvent}
                team={stableTeam || team}
                members={stableMembers.length > 0 ? stableMembers : members}
                summary={stableSummary || summary}
                challenges={stableChallenges.length > 0 ? stableChallenges : challenges}
                currentUserId={user.id}
                canManage={canManage}
                busy={busy}
                showManageActions
                onRenameTeam={onRenameTeamInternal}
                onCopyInvite={onCopyInvite}
                onRegenerateInvite={onRegenerateInviteClick}
                onLeaveTeam={onLeaveTeamClick}
                onDeleteTeam={onDeleteTeamClick}
                onKickMember={onKickMemberClick}
                onTransferCaptain={onTransferCaptainClick}

                effectiveSelectedEvent={effectiveSelectedEvent}
                setSelectedEvent={setSelectedEvent}
                teamEvents={teamEvents as any}
                showMainOption={showMainOption}
                onBack={() => router.back()}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmInput('')
            setConfirmExpected(null)
            setConfirmMessage('Are you sure?')
          }
          setConfirmOpen(open)
        }}
        variant="destructive"
        title="Confirm"
        description={
          confirmExpected ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {confirmMessage}
              </p>
              <div className="space-y-2 rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-100 dark:border-red-900/30">
                <p className="text-xs text-red-600 dark:text-red-400 uppercase font-black tracking-widest">
                  Verification Required
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Type <span className="font-mono font-bold text-red-600 dark:text-red-400">{confirmExpected}</span> below.
                </p>
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={confirmExpected}
                  className="bg-card border-destructive/20"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium py-4">{confirmMessage}</p>
          )
        }
        onConfirm={async () => {
          await confirmActionRef.current?.()
        }}
        confirmLabel="Confirm Action"
        cancelLabel="Cancel"
        confirmDisabled={
          !!confirmExpected &&
          confirmInput.trim().toLowerCase() !== confirmExpected
        }
      />
    </PageBackground>
  )
}
