import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/database.types'
import { Challenge, ChallengeWithSolve, Attachment } from '@/shared/types'
import { getLogs } from '@/features/logs/lib/log-service'

type ChallengeListResult = (ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean; has_questions: boolean })[]

const challengesListInflight = new Map<string, Promise<ChallengeListResult>>()

const normalizeEventKey = (eventId?: string | null | 'all') => {
  if (eventId === undefined) return 'any'
  if (eventId === null) return 'main'
  return String(eventId)
}

const buildChallengesListKey = (userId?: string, showAll = false, eventId?: string | null | 'all') => {
  const uid = userId || 'anon'
  const visibility = showAll ? 'all' : 'active'
  return `${uid}|${visibility}|${normalizeEventKey(eventId)}`
}

const applyEventFilter = (query: any, eventId?: string | null | 'all') => {
  if (eventId === 'all') return query
  if (eventId === null || eventId === 'main') return query.is('event_id', null)
  return query.eq('event_id', eventId)
}

const addComputedFields = <T extends { id: string; created_at?: string; total_solves?: number; is_maintenance?: boolean }>(
  challenge: T,
  solvedIds: Set<string>
) => {
  const createdAt = challenge.created_at ? new Date(challenge.created_at) : null
  const isRecentlyCreated = createdAt ? Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000 : false
  const hasFirstBlood = (challenge.total_solves || 0) > 0

  return {
    ...challenge,
    is_solved: solvedIds.has(challenge.id),
    has_first_blood: hasFirstBlood,
    is_recently_created: isRecentlyCreated,
    is_new: isRecentlyCreated && !hasFirstBlood,
    total_solves: challenge.total_solves || 0,
    is_maintenance: challenge.is_maintenance ?? false,
  }
}

const resolveEventParams = (eventId?: string | null | 'all') => {
  if (eventId === 'all' || eventId === undefined) return { p_event_mode: 'any', p_event_id: undefined }
  if (eventId === null || eventId === 'main') return { p_event_mode: 'is_null', p_event_id: undefined }
  return { p_event_mode: 'equals', p_event_id: eventId }
}

export class ChallengeService {
  static async getUserRank(username: string, eventId?: string | null | 'all'): Promise<number | null> {
    const leaderboard = await ChallengeService.getLeaderboard(100, 0, eventId)
    leaderboard?.sort((a: any, b: any) => {
      const scoreA = a.progress?.at(-1)?.score ?? 0
      const scoreB = b.progress?.at(-1)?.score ?? 0
      return scoreB - scoreA
    })
    const idx = (leaderboard || []).findIndex((entry: any) => entry.username === username)
    return idx !== -1 ? idx + 1 : null
  }

  static async getChallenges(
    userId?: string,
    showAll = false,
    eventId?: string | null | 'all'
  ): Promise<(ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean })[]> {
    try {
      let query = supabase
        .from('challenges')
        .select('*')
        .order('points', { ascending: true })
        .order('total_solves', { ascending: false })

      if (!showAll) query = query.eq('is_active', true)
      query = applyEventFilter(query, eventId)

      const solvesPromise = userId
        ? supabase.from('solves').select('challenge_id').eq('user_id', userId)
        : null

      const [{ data: challenges, error }, solvesResult] = await Promise.all([
        query,
        solvesPromise ?? Promise.resolve({ data: [] as any[] }),
      ])
      if (error) throw new Error(error.message)
      if (!challenges) return []

      const solvedIds = new Set((solvesResult?.data || []).map((s: any) => s.challenge_id))
      return challenges.map((ch: any) => addComputedFields(ch, solvedIds))
    } catch (err) {
      console.error('Error fetching challenges:', err)
      return []
    }
  }

  static async getChallengesList(
    userId?: string,
    showAll = false,
    eventId?: string | null | 'all'
  ): Promise<(ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean; has_questions: boolean })[]> {
    const cacheKey = buildChallengesListKey(userId, showAll, eventId)
    const inflight = challengesListInflight.get(cacheKey)
    if (inflight) return inflight

    const run = (async () => {
      try {
        let query = supabase
          .from('challenges')
          .select(
            'id, event_id, title, category, points, max_points, difficulty, is_active, is_maintenance, is_dynamic, min_points, decay_per_solve, total_solves, created_at, updated_at, flag_placeholder, services'
          )
          .order('points', { ascending: true })
          .order('total_solves', { ascending: false })

        if (!showAll) query = query.eq('is_active', true)
        query = applyEventFilter(query, eventId)

        const solvesPromise = userId
          ? supabase.from('solves').select('challenge_id').eq('user_id', userId)
          : null

        const [{ data: challenges, error }, solvesResult] = await Promise.all([
          query,
          solvesPromise ?? Promise.resolve({ data: [] as any[] }),
        ])

        if (error) throw new Error(error.message)
        if (!challenges) return []

        const solvedIds = new Set((solvesResult?.data || []).map((s: any) => s.challenge_id))
        const challengeIds = (challenges as any[]).map((ch) => String(ch.id)).filter(Boolean)
        const hasQuestionIds = new Set<string>()

        if (challengeIds.length > 0) {
          const { data: subChallenges, error: subError } = await supabase.rpc('get_challenges_with_sub_challenges', {
            p_challenge_ids: challengeIds,
          })
          if (subError) {
            console.error('Error fetching sub-challenges for challenge list:', subError)
          } else {
            for (const row of (subChallenges || []) as any[]) {
              if (row?.challenge_id) hasQuestionIds.add(String(row.challenge_id))
            }
          }
        }

        return (challenges as any[]).map((ch) => ({
          ...addComputedFields(ch, solvedIds),
          has_questions: hasQuestionIds.has(String(ch.id)),
          description: '',
          hint: null,
          attachments: [],
          flag: '',
          flag_hash: '',
        }))
      } catch (err) {
        console.error('Error fetching challenges (list):', err)
        return []
      }
    })().finally(() => {
      challengesListInflight.delete(cacheKey)
    })

    challengesListInflight.set(cacheKey, run)
    return run
  }

  static async getChallengeDetail(challengeId: string): Promise<ChallengeWithSolve | null> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(
          'id, event_id, title, description, category, points, max_points, hint, attachments, difficulty, is_active, is_maintenance, is_dynamic, min_points, decay_per_solve, total_solves, created_at, updated_at, flag_placeholder, services'
        )
        .eq('id', challengeId)
        .single()

      if (error) throw new Error(error.message)
      if (!data) return null

      return { ...(data as any), flag: '', flag_hash: '' } as any
    } catch (error) {
      console.error('Error fetching challenge detail:', error)
      return null
    }
  }

  static async getChallengePlaceholder(challengeId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_challenge_placeholder', { p_challenge_id: challengeId })
      if (error) throw new Error(error.message)
      return data
    } catch (err) {
      console.error('Error fetching challenge placeholder:', err)
      return null
    }
  }

  static async getChallengeServices(challengeId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.from('challenges').select('services').eq('id', challengeId).single()
      if (error) throw new Error(error.message)
      return (data?.services || []) as string[]
    } catch (err) {
      console.error('Error fetching challenge services:', err)
      return []
    }
  }

  static async submitFlag(challengeId: string, flag: string): Promise<{ success: boolean; message?: string }> {
    const { data, error } = await supabase.rpc('submit_flag', {
      p_challenge_id: challengeId,
      p_flag: flag,
    })
    if (error) {
      console.error('RPC error:', error)
      return { success: false, message: 'Failed to submit flag' }
    }
    return data as unknown as { success: boolean; message?: string }
  }

  static async addChallenge(challengeData: {
    title: string
    description: string
    category: string
    points: number
    max_points?: number
    flag: string
    hint?: string | string[] | null
    attachments?: Attachment[]
    difficulty: string
    is_dynamic?: boolean
    is_maintenance?: boolean
    min_points?: number
    decay_per_solve?: number
    event_id?: string | null
    flag_placeholder?: boolean
    services?: string[]
  }): Promise<string | null> {
    try {
      let hintValue: any = null
      if (Array.isArray(challengeData.hint)) {
        hintValue = challengeData.hint.length > 0 ? JSON.stringify(challengeData.hint) : null
      } else if (typeof challengeData.hint === 'string' && challengeData.hint.trim() !== '') {
        hintValue = JSON.stringify([challengeData.hint])
      }
      const { data, error } = await supabase.rpc('add_challenge', {
        p_title: challengeData.title,
        p_description: challengeData.description,
        p_category: challengeData.category,
        p_points: challengeData.points,
        p_max_points: challengeData.max_points ?? undefined,
        p_flag: challengeData.flag,
        p_difficulty: challengeData.difficulty,
        p_hint: hintValue,
        p_attachments: (challengeData.attachments || []) as unknown as Json,
        p_is_dynamic: challengeData.is_dynamic ?? false,
        p_is_maintenance: challengeData.is_maintenance ?? false,
        p_min_points: challengeData.min_points ?? 0,
        p_decay_per_solve: challengeData.decay_per_solve ?? 0,
        p_event_id: challengeData.event_id ?? undefined,
        p_flag_placeholder: challengeData.flag_placeholder ?? false,
        p_services: challengeData.services || [],
      })
      if (error) throw new Error(error.message)
      return data ? String(data) : null
    } catch (error) {
      console.error('Error adding challenge:', error)
      throw error
    }
  }

  static async updateChallenge(challengeId: string, challengeData: {
    title: string
    description: string
    category: string
    points: number
    max_points?: number
    flag?: string
    hint?: string | string[] | null
    attachments?: Attachment[]
    difficulty: string
    is_active?: boolean
    is_maintenance?: boolean
    is_dynamic?: boolean
    min_points?: number
    decay_per_solve?: number
    event_id?: string | null
    flag_placeholder?: boolean
    services?: string[]
  }): Promise<void> {
    try {
      let hintValue: any = null
      if (Array.isArray(challengeData.hint)) {
        hintValue = challengeData.hint.length > 0 ? JSON.stringify(challengeData.hint) : null
      } else if (typeof challengeData.hint === 'string' && challengeData.hint.trim() !== '') {
        hintValue = JSON.stringify([challengeData.hint])
      }
      const { error } = await supabase.rpc('update_challenge', {
        p_challenge_id: challengeId,
        p_title: challengeData.title,
        p_description: challengeData.description,
        p_category: challengeData.category,
        p_points: challengeData.points,
        p_max_points: challengeData.max_points ?? undefined,
        p_difficulty: challengeData.difficulty,
        p_hint: hintValue,
        p_attachments: (challengeData.attachments || []) as unknown as Json,
        p_is_active: challengeData.is_active,
        p_is_maintenance: challengeData.is_maintenance,
        p_flag: challengeData.flag || undefined,
        p_is_dynamic: challengeData.is_dynamic ?? false,
        p_min_points: challengeData.min_points ?? 0,
        p_decay_per_solve: challengeData.decay_per_solve ?? 0,
        p_event_id: challengeData.event_id ?? undefined,
        p_flag_placeholder: challengeData.flag_placeholder,
        p_services: challengeData.services || [],
      })
      if (error) throw new Error(error.message)
    } catch (error) {
      console.error('Error updating challenge:', error)
      throw error
    }
  }

  static async deleteChallenge(challengeId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('delete_challenge', { p_challenge_id: challengeId })
      if (error) throw new Error(error.message)
    } catch (error) {
      console.error('Error deleting challenge:', error)
      throw error
    }
  }

  static async getChallengeById(challengeId: string): Promise<Challenge | null> {
    try {
      const { data, error } = await supabase.from('challenges').select('*').eq('id', challengeId).single()
      if (error) throw new Error(error.message)
      return data as any
    } catch (error) {
      console.error('Error fetching challenge:', error)
      return null
    }
  }

  static async getChallengesLite(showAll = true) {
    try {
      let query = supabase
        .from('challenges')
        .select('id, title, category, difficulty, event_id, is_active')
        .order('created_at', { ascending: false })

      if (!showAll) query = query.eq('is_active', true)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching challenges (lite):', err)
      return []
    }
  }

  static async getLeaderboard(limit = 100, offset = 0, eventId?: string | null | 'all') {
    const { p_event_mode, p_event_id } = resolveEventParams(eventId)
    const { data, error } = await supabase.rpc('get_leaderboard', {
      limit_rows: limit,
      offset_rows: offset,
      p_event_id,
      p_event_mode,
    })
    if (error) throw error
    return data
  }

  static async getLeaderboardSummary(limit = 100, offset = 0, eventId?: string | null | 'all') {
    const data = await ChallengeService.getLeaderboard(limit, offset, eventId)
    return (data || []).map((d: any) => ({
      id: d.id,
      username: d.username,
      score: typeof d.score === 'number' ? d.score : (d.progress?.at(-1)?.score ?? 0),
      rank: d.rank,
      last_solve: d.last_solve,
    }))
  }

  static async getTopProgress(topUsers: string[], eventId?: string | null | 'all') {
    const batchSize = 1000
    let offset = 0
    let rows: any[] = []

    while (true) {
      const { p_event_mode, p_event_id } = resolveEventParams(eventId)
      const { data, error } = await supabase.rpc('get_top_progress', {
        p_user_ids: topUsers,
        p_limit: batchSize,
        p_offset: offset,
        p_event_id,
        p_event_mode,
      })
      if (error) throw error

      const batch = (data as any[]) || []
      rows = rows.concat(batch)
      if (batch.length < batchSize) break
      offset += batchSize
    }

    const progress: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
    for (const row of rows) {
      const userId = row.user_id
      const username = row.username
      if (!userId || !username) continue
      if (!progress[userId]) progress[userId] = { username, history: [] }
      const prev = progress[userId].history.at(-1)?.score || 0
      progress[userId].history.push({ date: row.created_at, score: prev + (row.points || 0) })
    }

    return progress
  }

  static async getTopProgressByUsernames(usernames: string[], eventId?: string | null | 'all') {
    if (!usernames || usernames.length === 0) return {}

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .in('username', usernames)

    if (usersError) throw usersError

    const idToUsername: Record<string, string> = {}
    const ids: string[] = (users || []).map((u: any) => {
      idToUsername[u.id] = u.username
      return u.id
    })

    if (ids.length === 0) return {}

    const progressById = await ChallengeService.getTopProgress(ids, eventId)

    const result: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
    for (const id of Object.keys(progressById)) {
      const entry = progressById[id]
      const uname = idToUsername[id]
      if (!uname) continue
      result[uname] = { username: entry.username, history: entry.history }
    }

    return result
  }

  static async getFirstBloodLeaderboard(limit = 100, offset = 0, eventId?: string | null | 'all') {
    try {
      const notifications = await getLogs(2000, 0)
      if (!notifications || notifications.length === 0) return []

      const fbNotifs = notifications.filter((n: any) => n.log_type === 'first_blood')
      if (fbNotifs.length === 0) return []

      if (eventId !== undefined && eventId !== 'all') {
        const challengeIds = Array.from(new Set(fbNotifs.map((n: any) => n.log_challenge_id).filter(Boolean)))
        if (challengeIds.length === 0) return []

        const { data: challenges, error } = await supabase
          .from('challenges')
          .select('id, event_id')
          .in('id', challengeIds)

        if (error) {
          console.error('Error fetching challenge event mappings for first-blood leaderboard:', error)
          return []
        }

        const allowedIds = new Set(
          (challenges || [])
            .filter((c: any) => {
              if (eventId === null || eventId === 'main') return c.event_id === null
              return c.event_id === eventId
            })
            .map((c: any) => c.id)
        )

        const filtered = fbNotifs.filter((n: any) => allowedIds.has(n.log_challenge_id))
        if (filtered.length === 0) return []
        fbNotifs.splice(0, fbNotifs.length, ...filtered)
      }

      const perUser: Record<string, { score: number; firstBloodCount: number }> = {}
      const perUserDates: Record<string, string[]> = {}

      for (const n of fbNotifs) {
        const username = n.log_username
        const points = (n as any).log_points || 0
        const date = n.log_created_at
        if (!username) continue
        if (!perUser[username]) { perUser[username] = { score: 0, firstBloodCount: 0 }; perUserDates[username] = [] }
        perUser[username].score += points
        perUser[username].firstBloodCount += 1
        if (date) perUserDates[username].push(date)
      }

      const result = Object.entries(perUser)
        .map(([username, { score, firstBloodCount }]) => ({ username, score, firstBloodCount }))
        .sort((a, b) => b.firstBloodCount - a.firstBloodCount || b.score - a.score)

      const progressMap: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
      for (const username of Object.keys(perUserDates)) {
        const dates = perUserDates[username].slice().sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        let cum = 0
        progressMap[username] = { username, history: [] }
        for (const d of dates) {
          cum += 1
          progressMap[username].history.push({ date: d, score: cum })
        }
      }

      return result.slice(offset, offset + limit).map((r, i) => ({
        id: String(i + 1 + offset),
        username: r.username,
        rank: i + 1 + offset,
        score: r.firstBloodCount,
        progress: progressMap[r.username]?.history || [],
      }))
    } catch (err) {
      console.error('Error building first-blood leaderboard:', err)
      return []
    }
  }

  static async getSolversByChallenge(challengeId: string) {
    try {
      const { data, error } = await supabase
        .from('solves')
        .select('created_at, users(username)')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return ((data as any[]) || []).map(row => ({
        username: row.users.username,
        solvedAt: row.created_at,
      }))
    } catch (error) {
      console.error('Error fetching solvers:', error)
      return []
    }
  }

  static async getFirstBloodChallengeIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_first_bloods', { p_user_id: userId })
      if (error) throw error
      return (data || []).map((r: any) => r.challenge_id)
    } catch (err) {
      console.error('Error fetching first bloods:', err)
      return []
    }
  }

  static async getFlag(challengeId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_flag', { p_challenge_id: challengeId })
      if (error) { console.error('Error fetching flag:', error); return null }
      return data
    } catch (err) {
      console.error('Unexpected error fetching flag:', err)
      return null
    }
  }

  static async setChallengeActive(challengeId: string, isActive: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('set_challenge_active', {
        p_challenge_id: challengeId,
        p_active: isActive,
      })
      if (error) { console.error('Error setting challenge active state:', error); return false }
      return (data as unknown as { success?: boolean })?.success === true
    } catch (err) {
      console.error('Unexpected error setting challenge active state:', err)
      return false
    }
  }

  static async setChallengeMaintenance(challengeId: string, isMaintenance: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('set_challenge_maintenance', {
        p_challenge_id: challengeId,
        p_maintenance: isMaintenance,
      })
      if (error) { console.error('Error setting challenge maintenance state:', error); return false }
      return (data as unknown as { success?: boolean })?.success === true
    } catch (err) {
      console.error('Unexpected error setting challenge maintenance state:', err)
      return false
    }
  }

  static async getSolversAll(limit = 250, offset = 0) {
    const { data, error } = await supabase.rpc('get_solvers_all', { p_limit: limit, p_offset: offset })
    if (error) { console.error('Error fetching solvers:', error); return [] }
    return data || []
  }

  static async getSolversByUsername(username: string) {
    const { data, error } = await supabase.rpc('get_solves_by_name', { p_username: username })
    if (error) { console.error(`Error fetching solvers for ${username}:`, error); return [] }
    return data || []
  }

  static async getSolversByChallengeTitle(challengeTitle: string) {
    const { data, error } = await supabase.rpc('get_solves_by_challenge', { p_challenge_title: challengeTitle })
    if (error) { console.error(`Error fetching solvers for challenge "${challengeTitle}":`, error); return [] }
    return data || []
  }

  static async deleteSolver(solveId: string) {
    const { data, error } = await supabase.rpc('delete_solver', { p_solve_id: solveId })
    if (error) throw error
    return data
  }

  static async getNotifications(limit = 50, offset = 0) {
    const { data, error } = await supabase.rpc('get_notifications', { p_limit: limit, p_offset: offset })
    if (error) { console.error('Error fetching notifications:', error); return [] }
    return data || []
  }

  static async createNotification(
    title: string,
    message: string,
    level: 'info' | 'info_platform' | 'info_challenges' = 'info'
  ) {
    const { data, error } = await supabase.rpc('create_notification', {
      p_title: title,
      p_message: message,
      p_level: level,
    })
    if (error) throw error
    return data
  }

  static async deleteNotification(id: string) {
    const { data, error } = await supabase.rpc('delete_notification', { p_id: id })
    if (error) throw error
    return data
  }

  static subscribeToNotifications(
    onNotif: (payload: { id: string; title: string; message: string; level: string; created_at: string }) => void
  ) {
    const channel = supabase
      .channel('admin-notifications-insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const row: any = payload.new || {}
        onNotif({
          id: row.id || `realtime-${row.created_at || ''}-${row.title || ''}`,
          title: row.title || 'Notification',
          message: row.message || '',
          level: row.level || 'info',
          created_at: row.created_at || new Date().toISOString(),
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  static subscribeToSolves(onSolve: (payload: { username: string; challenge: string }) => void) {
    const channel = supabase
      .channel('solves-insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solves' }, async (payload) => {
        try {
          if (!payload?.new) { onSolve({ username: 'Unknown', challenge: 'Unknown' }); return }

          let solve = payload.new
          if (!solve.user_id || !solve.challenge_id) {
            const { data: latestSolve, error: latestError } = await supabase
              .from('solves')
              .select('user_id, challenge_id')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (latestError || !latestSolve?.user_id || !latestSolve?.challenge_id) {
              onSolve({ username: 'Unknown', challenge: 'Unknown' })
              return
            }
            solve = latestSolve
          }

          const { data, error } = await supabase.rpc('get_solve_info', {
            p_user_id: solve.user_id,
            p_challenge_id: solve.challenge_id,
          })

          if (error) { onSolve({ username: 'Unknown', challenge: 'Unknown' }); return }

          if (data && data.length > 0) {
            const username = typeof data[0].username === 'string' && data[0].username ? data[0].username : 'Unknown'
            const challenge = typeof data[0].challenge === 'string' && data[0].challenge ? data[0].challenge : 'Unknown'
            onSolve({ username, challenge })
          } else {
            onSolve({ username: 'Unknown', challenge: 'Unknown' })
          }
        } catch (err) {
          console.error('Error handling solve event:', err)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }
}
