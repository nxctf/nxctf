import { supabase } from '@/lib/supabase/client'

export type TeamMember = {
  user_id: string
  username: string
  role: 'captain' | 'member'
  joined_at: string
  solo_score?: number
  first_solve_count?: number
  first_solve_score?: number
}

export type TeamInfo = {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export type TeamSummary = {
  unique_score?: number
  total_score: number
  unique_challenges: number
  total_solves: number
  rank?: number
}

export type TeamScoreboardEntry = {
  team_id: string
  team_name: string
  unique_score: number
  total_score: number
  total_solves: number
  member_count: number
  rank: number
}

export type TeamChallenge = {
  challenge_id: string
  title: string
  category: string
  points: number
  first_solved_at: string
  first_solver_username: string
}

export type TeamProgressPoint = {
  date: string
  score: number
  challenge_id?: string | null
  challenge_title?: string | null
  challenge_category?: string | null
}

export type TeamProgressSeries = {
  team_name: string
  history: TeamProgressPoint[]
}

export type TeamUniqueSolveRow = {
  team_name: string
  created_at: string
  points: number
  challenge_id?: string | null
  challenge_title?: string | null
  challenge_category?: string | null
}

type TeamProgressRow = {
  team_name: string
  created_at: string
  points: number
  challenge_id?: string | null
  challenge_title?: string | null
  challenge_category?: string | null
}

export class TeamService {
  private static chunkArray<T>(items: T[], size: number): T[][] {
    if (size <= 0) return [items]
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size))
    }
    return chunks
  }

  private static buildTeamProgress(rows: TeamProgressRow[]): Record<string, TeamProgressSeries> {
    const progress: Record<string, TeamProgressSeries> = {}
    for (const row of rows) {
      const name = row.team_name
      if (!name) continue
      if (!progress[name]) {
        progress[name] = { team_name: name, history: [] }
      }
      const prev = progress[name].history.at(-1)?.score || 0
      progress[name].history.push({
        date: row.created_at,
        score: prev + (row.points || 0),
        challenge_id: row.challenge_id ?? null,
        challenge_title: row.challenge_title ?? null,
        challenge_category: row.challenge_category ?? null,
      })
    }
    return progress
  }

  private static mergeTeamProgress(
    target: Record<string, TeamProgressSeries>,
    incoming: Record<string, TeamProgressSeries>
  ): void {
    for (const [name, series] of Object.entries(incoming)) {
      target[name] = series
    }
  }

  private static async fetchTeamProgressByNames(
    teamNames: string[],
    rpcName: 'get_team_solves_by_names' | 'get_team_unique_solves_by_names',
    p_event_id?: string | null,
    p_event_mode: string = 'any',
    includeChallengeDetails = false
  ): Promise<Record<string, TeamProgressSeries>> {
    if (!teamNames || teamNames.length === 0) return {}

    const uniqueNames = Array.from(
      new Set(teamNames.map((name) => name.trim()).filter(Boolean))
    )
    const chunks = TeamService.chunkArray(uniqueNames, 1)
    const progress: Record<string, TeamProgressSeries> = {}

    for (const chunk of chunks) {
      try {
        const params: Record<string, unknown> = {
          p_names: chunk,
          p_event_id: p_event_id ?? null,
          p_event_mode,
        }
        if (rpcName === 'get_team_unique_solves_by_names') {
          params.p_show_name_chall = includeChallengeDetails
        }
        const { data, error } = await supabase.rpc(rpcName as any, params as any)
        if (error) throw error
        const rows: TeamProgressRow[] = (data as TeamProgressRow[]) || []
        TeamService.mergeTeamProgress(progress, TeamService.buildTeamProgress(rows))
      } catch (err) {
        console.error(`Error fetching team progress (${rpcName}):`, err)
      }
    }

    return progress
  }

  static async createTeam(name: string): Promise<{ teamId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_team', { p_name: name })
      if (error) return { error: error.message }
      return { teamId: data as string }
    } catch (err: any) {
      return { error: err?.message || 'Failed to create team' }
    }
  }

  static async joinTeam(inviteCode: string): Promise<{ teamId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('join_team', { p_invite_code: inviteCode })
      if (error) return { error: error.message }
      return { teamId: data as string }
    } catch (err: any) {
      return { error: err?.message || 'Failed to join team' }
    }
  }

  static async leaveTeam(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('leave_team')
      if (error) return { success: false, error: error.message }
      return { success: Boolean(data) }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to leave team' }
    }
  }

  static async deleteTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('delete_team', { p_team_id: teamId })
      if (error) return { success: false, error: error.message }
      return { success: Boolean(data) }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete team' }
    }
  }

  static async regenerateTeamInviteCode(teamId: string): Promise<{ invite_code?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('regenerate_team_invite_code', { p_team_id: teamId })
      if (error) return { error: error.message }
      return { invite_code: data as string }
    } catch (err: any) {
      return { error: err?.message || 'Failed to regenerate invite code' }
    }
  }

  static async getMyTeam(
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<{ team: TeamInfo | null; members: TeamMember[]; solved_event_ids?: string[]; has_main_solved?: boolean; error?: string }> {
    try {
      const { data: raw, error } = await supabase.rpc('get_my_team', { p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) return { team: null, members: [], error: error.message }
      const data = raw as unknown as { team?: TeamInfo | null; members?: TeamMember[]; solved_event_ids?: string[]; has_main_solved?: boolean } | null
      return {
        team: data?.team ?? null,
        members: (data?.members ?? []) as TeamMember[],
        solved_event_ids: data?.solved_event_ids ?? [],
        has_main_solved: !!data?.has_main_solved,
      }
    } catch (err: any) {
      return { team: null, members: [], error: err?.message || 'Failed to fetch team' }
    }
  }

  static async getMyTeamSummary(
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<{ team: TeamInfo | null; stats: TeamSummary | null; error?: string }> {
    try {
      const { data: raw, error } = await supabase.rpc('get_my_team_summary', { p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) return { team: null, stats: null, error: error.message }
      const data = raw as unknown as { team?: TeamInfo | null; stats?: TeamSummary | null } | null
      return { team: data?.team ?? null, stats: data?.stats ?? null }
    } catch (err: any) {
      return { team: null, stats: null, error: err?.message || 'Failed to fetch team summary' }
    }
  }

  static async getMyTeamChallenges(
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<{ challenges: TeamChallenge[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_my_team_challenges', { p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) return { challenges: [], error: error.message }
      return { challenges: (data as TeamChallenge[]) || [] }
    } catch (err: any) {
      return { challenges: [], error: err?.message || 'Failed to fetch team challenges' }
    }
  }

  static async getTeamByName(
    name: string,
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<{ team: TeamInfo | null; members: TeamMember[]; stats: TeamSummary | null; solved_event_ids?: string[]; has_main_solved?: boolean; error?: string }> {
    try {
      const { data: raw, error } = await supabase.rpc('get_team_by_name', { p_name: name, p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) return { team: null, members: [], stats: null, error: error.message }
      const data = raw as unknown as { success?: boolean; message?: string; team?: TeamInfo | null; members?: TeamMember[]; stats?: TeamSummary | null; solved_event_ids?: string[]; has_main_solved?: boolean } | null
      if (!data?.success) return { team: null, members: [], stats: null, error: data?.message || 'Team not found' }
      return {
        team: data?.team ?? null,
        members: (data?.members ?? []) as TeamMember[],
        stats: data?.stats ?? null,
        solved_event_ids: data?.solved_event_ids ?? [],
        has_main_solved: !!data?.has_main_solved,
      }
    } catch (err: any) {
      return { team: null, members: [], stats: null, error: err?.message || 'Failed to fetch team' }
    }
  }

  static async getTeamChallengesByName(
    name: string,
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<{ challenges: TeamChallenge[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_team_challenges_by_name', { p_name: name, p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) return { challenges: [], error: error.message }
      return { challenges: (data as TeamChallenge[]) || [] }
    } catch (err: any) {
      return { challenges: [], error: err?.message || 'Failed to fetch team challenges' }
    }
  }

  static async getTeamScoreboard(
    limit = 100,
    offset = 0,
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<{ entries: TeamScoreboardEntry[]; error?: string }> {
    try {
      const params = { limit_rows: limit, offset_rows: offset, p_event_id: p_event_id ?? undefined, p_event_mode }
      const { data, error } = await supabase.rpc('get_team_scoreboard', params)
      if (error) return { entries: [], error: error.message }
      return { entries: (data as TeamScoreboardEntry[]) || [] }
    } catch (err: any) {
      console.error('getTeamScoreboard RPC error:', err)
      return { entries: [], error: err?.message || 'Failed to fetch team scoreboard' }
    }
  }

  static async getTeamUniqueSolvesByNames(
    teamNames: string[],
    p_event_id?: string | null,
    p_event_mode: string = 'any',
    showNameChall = false
  ): Promise<{ rows: TeamUniqueSolveRow[]; error?: string }> {
    if (!teamNames || teamNames.length === 0) return { rows: [] }
    try {
      const { data, error } = await supabase.rpc('get_team_unique_solves_by_names', {
        p_names: teamNames,
        p_event_id: p_event_id ?? undefined,
        p_event_mode,
        p_show_name_chall: showNameChall,
      })
      if (error) return { rows: [], error: error.message }
      return { rows: (data as TeamUniqueSolveRow[]) || [] }
    } catch (err: any) {
      return { rows: [], error: err?.message || 'Failed to fetch team unique solves' }
    }
  }

  static async getTopTeamProgressByNames(
    teamNames: string[],
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<Record<string, TeamProgressSeries>> {
    return TeamService.fetchTeamProgressByNames(teamNames, 'get_team_solves_by_names', p_event_id, p_event_mode)
  }

  static async getTopTeamUniqueProgressByNames(
    teamNames: string[],
    p_event_id?: string | null,
    p_event_mode: string = 'any'
  ): Promise<Record<string, TeamProgressSeries>> {
    return TeamService.fetchTeamProgressByNames(teamNames, 'get_team_unique_solves_by_names', p_event_id, p_event_mode, true)
  }

  static async getAllTeamSolves(p_event_id?: string | null, p_event_mode: string = 'any'): Promise<unknown[]> {
    try {
      const { data, error } = await supabase.rpc('get_team_solves', { p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) throw error
      return (data as unknown[]) || []
    } catch (err) {
      console.error('Error fetching all team solves:', err)
      return []
    }
  }

  static async getAllTeamUniqueSolves(p_event_id?: string | null, p_event_mode: string = 'any'): Promise<unknown[]> {
    try {
      const { data, error } = await supabase.rpc('get_team_unique_solves', { p_event_id: p_event_id ?? undefined, p_event_mode })
      if (error) throw error
      return (data as unknown[]) || []
    } catch (err) {
      console.error('Error fetching all team unique solves:', err)
      return []
    }
  }

  static async kickTeamMember(teamId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('kick_team_member', {
        p_team_id: teamId,
        p_user_id: userId,
      })
      if (error) return { success: false, error: error.message }
      return { success: Boolean(data) }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to kick member' }
    }
  }

  static async transferTeamCaptain(teamId: string, newCaptainUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('transfer_team_captain', {
        p_team_id: teamId,
        p_new_captain_user_id: newCaptainUserId,
      })
      if (error) return { success: false, error: error.message }
      return { success: Boolean(data) }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to transfer captain' }
    }
  }

  static async renameTeam(teamId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('rename_team', {
        p_team_id: teamId,
        p_new_name: newName,
      })
      if (error) return { success: false, error: error.message }
      return { success: Boolean(data) }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to rename team' }
    }
  }

  static async getTeamByUserId(userId: string): Promise<{ team: TeamInfo | null; members: TeamMember[]; error?: string }> {
    try {
      const { data: raw, error } = await supabase.rpc('get_team_by_user_id', { p_user_id: userId })
      if (error) return { team: null, members: [], error: error.message }
      const data = raw as unknown as { success?: boolean; message?: string; team?: TeamInfo | null; members?: TeamMember[] } | null
      if (!data?.success) return { team: null, members: [], error: data?.message || 'Failed to fetch team' }
      return {
        team: data?.team ?? null,
        members: (data?.members ?? []) as TeamMember[],
      }
    } catch (err: any) {
      console.error('getTeamByUserId error:', err)
      return { team: null, members: [], error: err?.message || 'Failed to fetch team' }
    }
  }
}
