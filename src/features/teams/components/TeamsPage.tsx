'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Users, UserPlus, Sparkles, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { isValidTeamName } from '@/features/auth'

import Loader from '@/shared/components/Loader'
import PageLoader from '@/shared/components/PageLoader'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import PageBackground from '@/shared/components/PageBackground'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/shared/ui'
import {
  PAGE_MAIN_CONTAINER_4XL,
  SURFACE_GLASS_CARD_COMPACT_CLASS,
  SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS,
  SURFACE_GLASS_INPUT_CLASS,
  THEME_PRIMARY_SELECTION_CLASS,
  TYPO_PAGE_TITLE_CLASS,
  TYPO_SECTION_TITLE_CLASS,
  TYPO_MUTED_CLASS
} from '@/shared/styles'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useEventContext } from '@/features/events/contexts/EventContext'
import { APP } from '@/config'

import TeamPageContent from './TeamPageContent'
import { useMyTeam } from '../hooks/useMyTeam'
import { useTeamEvents } from '../hooks/useTeamEvents'
import { TeamMember } from '../types'
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
  const [stableTeam, setStableTeam] = useState<any>(null)
  const [stableMembers, setStableMembers] = useState<any[]>([])
  const [stableSummary, setStableSummary] = useState<any>(null)
  const [stableChallenges, setStableChallenges] = useState<any[]>([])

  useEffect(() => {
    requestAnimationFrame(() => {
      setStableTeam(team)
      setStableMembers(members)
      setStableSummary(summary)
      setStableChallenges(challenges)
    })
  }, [team, members, summary, challenges])

  const onCreateTeam = async () => {
    const trimmed = teamName.trim()
    const nameError = isValidTeamName(trimmed)
    if (nameError) {
      toast.error(nameError)
      return
    }
    await handleCreateTeam(trimmed)
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
      toast.success('Invite code copied.')
    } catch {
      toast.error('Failed to copy invite code.')
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

  const onRenameTeamInternal = (newName: string, pictureUrl?: string | null) => {
    if (!team) return Promise.resolve({ success: false, error: 'No team' })
    return handleRenameTeam(team.id, newName, pictureUrl)
  }

  if (!APP.teams.enabled) {
    router.replace('/challenges')
    return null
  }

  if (authLoading) return <Loader fullscreen />

  if (!user) return null

  return (
    <PageBackground selectionClassName={THEME_PRIMARY_SELECTION_CLASS}>
      <div className={cn(PAGE_MAIN_CONTAINER_4XL, "space-y-4")}>
        {initialLoading ? <PageLoader /> : (
          <>
            {loading && team && (
              <div className="fixed top-20 right-8 z-50 opacity-70 pointer-events-none">
                <Loader />
              </div>
            )}

            {!team ? (
              <div className="grid grid-cols-1 items-start gap-6 pt-2 md:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.75fr)]">
                <div className={cn("space-y-4 p-4 sm:p-6", SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS)}>
                  <div className="space-y-2">
                    <h2 className={TYPO_PAGE_TITLE_CLASS}>
                      Squad up for the <span className="text-blue-600 dark:text-blue-400">Next Conquest.</span>
                    </h2>
                    <p className={cn(TYPO_MUTED_CLASS, "text-sm leading-6")}>
                      Join an existing crew or build your own elite team of hackers. Solve together, win together.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className={cn("flex items-center gap-3 p-4", SURFACE_GLASS_CARD_COMPACT_CLASS)}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className={TYPO_SECTION_TITLE_CLASS}>Collaboration</p>
                        <p className="text-sm font-bold">Shared Solves</p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 p-4", SURFACE_GLASS_CARD_COMPACT_CLASS)}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className={TYPO_SECTION_TITLE_CLASS}>Competition</p>
                        <p className="text-sm font-bold">Team Rank</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className={SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS}>
                    <CardHeader>
                      <CardTitle className={cn(TYPO_SECTION_TITLE_CLASS, "flex items-center gap-2 !text-gray-900 dark:!text-white")}>
                        <Sparkles size={16} className="text-blue-500" /> Start Your Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={(e) => { e.preventDefault(); onCreateTeam() }}>
                        <div className="space-y-2">
                          <label className={cn(TYPO_SECTION_TITLE_CLASS, "ml-1 !text-[10px]")}>Team Name</label>
                          <Input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="CyberKnights, VoidWalkers, etc."
                            disabled={busy}
                            className={SURFACE_GLASS_INPUT_CLASS}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={busy || !teamName.trim()}
                          className="mt-4 h-10 w-full font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20"
                        >
                          Create Team
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200 dark:border-gray-800/60" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-[#fafafa]/60 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-0.5 rounded-full border border-gray-200/20 dark:border-gray-800/30 text-gray-400 font-black tracking-[0.2em]">Or Join One</span>
                    </div>
                  </div>

                  <Card className={SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS}>
                    <CardHeader>
                      <CardTitle className={cn(TYPO_SECTION_TITLE_CLASS, "flex items-center gap-2 !text-gray-900 dark:!text-white")}>
                        <UserPlus size={16} className="text-emerald-500" /> Enter Invite Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={(e) => { e.preventDefault(); onJoinTeam() }}>
                        <Input
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="Paste code here..."
                          disabled={busy}
                          className={`${SURFACE_GLASS_INPUT_CLASS} font-mono text-center tracking-widest`}
                        />
                        <Button
                          type="submit"
                          disabled={busy || !inviteCode.trim()}
                          variant="secondary"
                          className="mt-4 h-10 w-full font-bold uppercase tracking-widest"
                        >
                          Join Team
                        </Button>
                      </form>
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
        icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
        title="Confirm"
        description={confirmMessage}
        verificationText={confirmExpected ?? undefined}
        verificationValue={confirmInput}
        onVerificationValueChange={setConfirmInput}
        onConfirm={async () => {
          await confirmActionRef.current?.()
        }}
        confirmLabel="Confirm Action"
        cancelLabel="Cancel"
      />
    </PageBackground>
  )
}
