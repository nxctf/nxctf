import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TeamService } from '@/features/teams/services/team.service'
import { TeamInfo, TeamMember, TeamSummary, TeamChallenge } from '../types'

export function useMyTeam(user: any, effectiveSelectedEvent: string | number) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [summary, setSummary] = useState<TeamSummary | null>(null)
  const [challenges, setChallenges] = useState<TeamChallenge[]>([])
  const [solvedEventIds, setSolvedEventIds] = useState<string[]>([])
  const [hasMainSolved, setHasMainSolved] = useState<boolean>(false)
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const teamRef = useRef<TeamInfo | null>(null)

  const loadTeamData = useCallback(async () => {
    if (!user) return
    const isFirstLoad = teamRef.current === null
    if (isFirstLoad) setLoading(true)
    setStatus(null)

    const p_event_id = (effectiveSelectedEvent === 'all' || effectiveSelectedEvent === 'main') ? null : String(effectiveSelectedEvent)
    const p_event_mode = effectiveSelectedEvent === 'all' ? 'any' : effectiveSelectedEvent === 'main' ? 'main' : 'event'

    try {
      const [teamRes, summaryRes, challengesRes] = await Promise.all([
        TeamService.getMyTeam(p_event_id, p_event_mode),
        TeamService.getMyTeamSummary(p_event_id, p_event_mode),
        TeamService.getMyTeamChallenges(p_event_id, p_event_mode),
      ])

      const nextTeam = teamRes.team ?? null
      teamRef.current = nextTeam
      setTeam(nextTeam)
      setMembers(teamRes.members ?? [])
      setSummary(summaryRes.stats ?? null)
      setChallenges(challengesRes.challenges ?? [])
      setSolvedEventIds(teamRes.solved_event_ids ?? [])
      setHasMainSolved(!!teamRes.has_main_solved)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [user, effectiveSelectedEvent])

  useEffect(() => {
    loadTeamData()
  }, [loadTeamData])

  const currentMember = useMemo(() => members.find(m => m.user_id === user?.id), [members, user])
  const isCaptain = currentMember?.role === 'captain'
  const canManage = isCaptain

  const handleCreateTeam = async (teamName: string) => {
    if (!teamName.trim()) return
    setBusy(true)
    setStatus(null)
    const { error } = await TeamService.createTeam(teamName.trim())
    if (error) {
      setStatus({ type: 'error', message: error })
    } else {
      setStatus({ type: 'success', message: 'Team created.' })
      await loadTeamData()
    }
    setBusy(false)
  }

  const handleJoinTeam = async (inviteCode: string) => {
    if (!inviteCode.trim()) return
    setBusy(true)
    setStatus(null)
    const { error } = await TeamService.joinTeam(inviteCode.trim())
    if (error) {
      setStatus({ type: 'error', message: error })
    } else {
      setStatus({ type: 'success', message: 'Joined team.' })
      await loadTeamData()
    }
    setBusy(false)
  }

  const handleLeaveTeam = async () => {
    setBusy(true)
    setStatus(null)
    const { success, error } = await TeamService.leaveTeam()
    if (!success) {
      setStatus({ type: 'error', message: error || 'Failed to leave team.' })
    } else {
      setStatus({ type: 'success', message: 'You left the team.' })
      await loadTeamData()
    }
    setBusy(false)
  }

  const handleDeleteTeam = async (teamId: string) => {
    setBusy(true)
    setStatus(null)
    const { success, error } = await TeamService.deleteTeam(teamId)
    if (!success) {
      setStatus({ type: 'error', message: error || 'Failed to delete team.' })
    } else {
      setStatus({ type: 'success', message: 'Team deleted.' })
      await loadTeamData()
    }
    setBusy(false)
  }

  const handleRegenerateInvite = async (teamId: string) => {
    setBusy(true)
    setStatus(null)
    const { error } = await TeamService.regenerateTeamInviteCode(teamId)
    if (error) {
      setStatus({ type: 'error', message: error })
    } else {
      setStatus({ type: 'success', message: 'Invite code regenerated.' })
      await loadTeamData()
    }
    setBusy(false)
  }

  const handleKickMember = async (teamId: string, member: TeamMember) => {
    setBusy(true)
    setStatus(null)
    const { success, error } = await TeamService.kickTeamMember(teamId, member.user_id)
    if (!success) {
      setStatus({ type: 'error', message: error || 'Failed to kick member.' })
    } else {
      setStatus({ type: 'success', message: `${member.username} kicked.` })
      await loadTeamData()
    }
    setBusy(false)
  }

  const handleTransferCaptain = async (teamId: string, member: TeamMember) => {
    setBusy(true)
    setStatus(null)
    try {
      const { success, error } = await TeamService.transferTeamCaptain(teamId, member.user_id)
      if (!success) {
        setStatus({ type: 'error', message: error || 'Failed to transfer captain.' })
      } else {
        setStatus({ type: 'success', message: `${member.username} is now captain.` })
        await loadTeamData()
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Unexpected error occurred.' })
    } finally {
      setBusy(false)
    }
  }

  const handleRenameTeam = async (teamId: string, newName: string) => {
    const { success, error } = await TeamService.renameTeam(teamId, newName)
    if (success) {
      setStatus({ type: 'success', message: 'Team renamed.' })
      await loadTeamData()
    }
    return { success, error }
  }

  return {
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
    handleRenameTeam,
    refresh: loadTeamData
  }
}
