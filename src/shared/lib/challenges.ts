import { supabase } from '@/lib/supabase/client'
import { Challenge, ChallengeWithSolve, Attachment, GeoCoordinates } from '@/shared/types'
import { getLogs } from '@/features/logs/lib/log-service'

type ChallengeListResult = (ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean; has_questions: boolean; has_geo_flag: boolean; geo_prefix?: string })[]
type SubmitFlagResult = { success: boolean; message: string }
type GeoSubmitResult = { success: boolean; message: string; distance_km?: number }

function callChallengeRpc<T = any>(name: string, args?: Record<string, unknown>) {
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>
}

const challengesListInflight = new Map<string, Promise<ChallengeListResult>>()

const normalizeEventKey = (eventId?: string | null | 'all') => {
  if (eventId === undefined) return 'any'
  if (eventId === null) return 'main'
  return String(eventId)
}

const buildChallengesListKey = (userId?: string, showAll: boolean = false, eventId?: string | null | 'all') => {
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

// Get user rank only (by username)
export async function getUserRank(username: string, eventId?: string | null | 'all'): Promise<number | null> {
  const leaderboard = await getLeaderboard(100, 0, eventId);
  leaderboard.sort((a: any, b: any) => {
    const scoreA = a.progress.length > 0 ? a.progress[a.progress.length - 1].score : 0;
    const scoreB = b.progress.length > 0 ? b.progress[b.progress.length - 1].score : 0;
    return scoreB - scoreA;
  });
  const idx = leaderboard.findIndex((entry: any) => entry.username === username);
  return idx !== -1 ? idx + 1 : null;
}

/**
 * Get all challenges
 */
export async function getChallenges(
  userId?: string,
  showAll: boolean = false,
  eventId?: string | null | 'all'
): Promise<(ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean })[]> {
  try {
    // 🔹 Ambil challenge list
    let query = supabase
      .from('challenges')
      .select('*')
      .order('points', { ascending: true })        // poin terendah dulu
      .order('total_solves', { ascending: false }) // jika poin sama, paling banyak solves dulu

    if (!showAll) query = query.eq('is_active', true)
    query = applyEventFilter(query, eventId)

    const solvesPromise = userId
      ? supabase
          .from('solves')
          .select('challenge_id')
          .eq('user_id', userId)
      : null

    const [{ data: challenges, error }, solvesResult] = await Promise.all([
      query,
      solvesPromise ?? Promise.resolve({ data: [] as any[] }),
    ])
    if (error) throw new Error(error.message);
    if (!challenges) return [];

    // 🔹 Cek solved user (optional)
    const solvedIds = new Set((solvesResult?.data || []).map((s: any) => s.challenge_id) || [])

    return challenges.map((ch: any) => addComputedFields(ch, solvedIds))
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return [];
  }
}

/**
 * Get challenge list (lightweight)
 * - Avoids downloading heavy fields (description/attachments/hint) for every challenge card.
 * - Returns the same shape as `ChallengeWithSolve` by filling unused fields with safe defaults.
 */
export async function getChallengesList(
  userId?: string,
  showAll: boolean = false,
  eventId?: string | null | 'all'
): Promise<(ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean; has_questions: boolean; has_geo_flag: boolean; geo_prefix?: string })[]> {
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
        ? supabase
            .from('solves')
            .select('challenge_id')
            .eq('user_id', userId)
        : null

      const challengesPromise = query

      const [{ data: challenges, error }, solvesResult] = await Promise.all([
        challengesPromise,
        solvesPromise ?? Promise.resolve({ data: [] as any[] }),
      ])

      if (error) throw new Error(error.message)
      if (!challenges) return []

      const solvedIds = new Set((solvesResult?.data || []).map((s: any) => s.challenge_id) || [])
      const challengeIds = (challenges as any[]).map((ch) => String(ch.id)).filter(Boolean)
      const hasQuestionIds = new Set<string>()
      const geoFlagMap = new Map<string, string>()

      if (challengeIds.length > 0) {
        const [subChallengesResult, geoFlagsResult] = await Promise.all([
          callChallengeRpc('get_challenges_with_sub_challenges', { p_challenge_ids: challengeIds }),
          callChallengeRpc('get_challenges_with_geo_flag', { p_challenge_ids: challengeIds }),
        ])

        if (subChallengesResult.error) {
          console.error('Error fetching sub-challenges for challenge list:', subChallengesResult.error)
        } else {
          for (const row of (subChallengesResult.data || []) as any[]) {
            if (row?.challenge_id) hasQuestionIds.add(String(row.challenge_id))
          }
        }

        if (geoFlagsResult.error) {
          console.error('Error fetching geo flags for challenge list:', geoFlagsResult.error)
        } else {
          for (const row of (geoFlagsResult.data || []) as any[]) {
            if (row?.challenge_id) geoFlagMap.set(String(row.challenge_id), String(row.geo_prefix || ''))
          }
        }
      }

      return (challenges as any[]).map((ch) => ({
        // lightweight fields from DB
        ...addComputedFields(ch, solvedIds),
        has_questions: hasQuestionIds.has(String(ch.id)),
        has_geo_flag: geoFlagMap.has(String(ch.id)),
        geo_prefix: geoFlagMap.get(String(ch.id)),

        // fill heavy / unused fields so existing UI types don't break
        description: '',
        hint: null,
        attachments: [],
        flag: '',
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

/**
 * Get full challenge detail by ID (public view)
 * Intended to be used on-demand when a user opens a challenge dialog.
 */
export async function getChallengeDetail(challengeId: string): Promise<ChallengeWithSolve | null> {
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

    // Fill fields that might exist in the app-level `Challenge` type but are not present in `challenges` table.
    return {
      ...(data as any),
      flag: '',
    } as any
  } catch (error) {
    console.error('Error fetching challenge detail:', error)
    return null
  }
}

/**
 * Get challenge placeholder string (e.g. ctf{x0xx_xx_x})
 */
export async function getChallengePlaceholder(challengeId: string): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('get_challenge_placeholder', {
      p_challenge_id: challengeId
    });
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Error fetching challenge placeholder:', err);
    return null;
  }
}


/**
 * Get NXCTL service names for a challenge
 * (Services are now stored in challenges.services column, not in nxctl table)
 */
export async function getChallengeServices(challengeId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('services')
      .eq('id', challengeId)
      .single()

    if (error) throw new Error(error.message)
    return (data?.services || []) as string[]
  } catch (err) {
    console.error('Error fetching challenge services:', err)
    return []
  }
}

/**
 * Submit flag for a challenge
 */
export async function submitFlag(challengeId: string, flag: string): Promise<SubmitFlagResult> {
  const { data, error } = await callChallengeRpc('submit_flag', {
    // p_user_id: userId,
    p_challenge_id: challengeId,
    p_flag: flag,
  });

  if (error) {
    console.error('RPC error:', error);
    return { success: false, message: 'Failed to submit flag' };
  }

  const result = data as Partial<SubmitFlagResult> | null;
  return {
    success: Boolean(result?.success),
    message: String(result?.message || ''),
  };
};

/**
 * Submit geo location for a GeoGuessr-style challenge.
 * Formats coordinates as prefix{geo:lat,lng} and submits through the
 * standard submit_flag RPC so rate-limiting is handled consistently.
 */
export async function submitGeoLocation(
  challengeId: string,
  lat: number,
  lng: number,
  prefix: string
): Promise<GeoSubmitResult> {
  const geoFlag = `${prefix}{geo:${lat.toFixed(6)},${lng.toFixed(6)}}`;

  const { data, error } = await callChallengeRpc('submit_flag', {
    p_challenge_id: challengeId,
    p_flag: geoFlag,
  });

  if (error) {
    console.error('Geo submit RPC error:', error);
    return { success: false, message: 'Failed to submit location' };
  }

  const result = data as Partial<GeoSubmitResult> | null;
  return {
    success: Boolean(result?.success),
    message: String(result?.message || ''),
    distance_km: typeof result?.distance_km === 'number' ? result.distance_km : undefined,
  };
}

/**
 * Get geo challenge target coordinates and radius (if solved or admin)
 */
export async function getGeoChallengeTarget(
  challengeId: string
): Promise<GeoCoordinates & { radius_km: number; flag?: string } | null> {
  const { data, error } = await callChallengeRpc('get_geo_challenge_target', {
    p_challenge_id: challengeId,
  });

  if (error) {
    console.error('getGeoChallengeTarget RPC error:', error);
    return null;
  }

  const list = data as any[];
  if (!list || list.length === 0) return null;
  const row = list[0];
  return {
    lat: Number(row.target_lat),
    lng: Number(row.target_lng),
    radius_km: Number(row.radius_km),
    flag: row.flag ? String(row.flag) : undefined,
  };
}


/**
 * Get flag submission stats for a challenge (for the current user)
 */
export async function getMyFlagSubmissionStats(challengeId: string): Promise<{
  incorrect_attempts: number
  window_attempts: number
  window_start_at: string
  remaining_attempts: number
  cooldown_seconds: number
} | null> {
  const { data, error } = await supabase.rpc('get_my_submission_status', {
    p_challenge_id: challengeId
  })

  if (error) {
    console.error('Error fetching my flag submission stats:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Add a new challenge (Admin only)
 */
export async function addChallenge(challengeData: {
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
    let hintValue: any = null;
    if (Array.isArray(challengeData.hint)) {
      hintValue = challengeData.hint.length > 0 ? JSON.stringify(challengeData.hint) : null;
    } else if (typeof challengeData.hint === 'string' && challengeData.hint.trim() !== '') {
      hintValue = JSON.stringify([challengeData.hint]);
    }
    const { data, error } = await callChallengeRpc('add_challenge', {
      p_title: challengeData.title,
      p_description: challengeData.description,
      p_category: challengeData.category,
      p_points: challengeData.points,
      p_max_points: challengeData.max_points ?? null,
      p_flag: challengeData.flag,
      p_difficulty: challengeData.difficulty,
      p_hint: hintValue,
      p_attachments: challengeData.attachments || [],
      p_is_dynamic: challengeData.is_dynamic ?? false,
      p_is_maintenance: challengeData.is_maintenance ?? false,
      p_min_points: challengeData.min_points ?? 0,
      p_decay_per_solve: challengeData.decay_per_solve ?? 0,
      p_event_id: challengeData.event_id ?? null,
      p_flag_placeholder: challengeData.flag_placeholder ?? false,
      p_services: challengeData.services || []
    });
    if (error) {
      throw new Error(error.message)
    }
    return data ? String(data) : null
  } catch (error) {
    console.error('Error adding challenge:', error)
    throw error
  }
}

/**
 * Update challenge (Admin only)
 */
export async function updateChallenge(challengeId: string, challengeData: {
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
    let hintValue: any = null;
    if (Array.isArray(challengeData.hint)) {
      hintValue = challengeData.hint.length > 0 ? JSON.stringify(challengeData.hint) : null;
    } else if (typeof challengeData.hint === 'string' && challengeData.hint.trim() !== '') {
      hintValue = JSON.stringify([challengeData.hint]);
    }
    const { error } = await callChallengeRpc('update_challenge', {
      p_challenge_id: challengeId,
      p_title: challengeData.title,
      p_description: challengeData.description,
      p_category: challengeData.category,
      p_points: challengeData.points,
      p_max_points: challengeData.max_points ?? null,
      p_difficulty: challengeData.difficulty,
      p_hint: hintValue,
      p_attachments: challengeData.attachments || [],
      p_is_active: challengeData.is_active, // kirim undefined jika tidak ada perubahan
      p_is_maintenance: challengeData.is_maintenance,
      p_flag: challengeData.flag || null,
      p_is_dynamic: challengeData.is_dynamic ?? false,
      p_min_points: challengeData.min_points ?? 0,
      p_decay_per_solve: challengeData.decay_per_solve ?? 0,
      p_event_id: challengeData.event_id ?? null,
      p_flag_placeholder: challengeData.flag_placeholder,
      p_services: challengeData.services
    });
    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error updating challenge:', error)
    throw error
  }
}

/**
 * Delete challenge (Admin only)
 */
export async function deleteChallenge(challengeId: string): Promise<void> {
  try {
    const { error } = await callChallengeRpc('delete_challenge', {
      p_challenge_id: challengeId
    });
    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error deleting challenge:', error)
    throw error
  }
}

/**
 * Get challenge by ID (Admin only - includes flag info)
 */
export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as any
  } catch (error) {
    console.error('Error fetching challenge:', error)
    return null
  }
}

/**
 * Get lightweight challenge list (admin bulk tools)
 */
export async function getChallengesLite(showAll: boolean = true) {
  try {
    let query = supabase
      .from('challenges')
      .select('id, title, description, category, difficulty, event_id, is_active, is_maintenance, points, services')
      .order('created_at', { ascending: false })

    if (!showAll) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error
    const rows = data || []
    const ids = rows.map((challenge) => challenge.id)
    let questionIds = new Set<string>()

    if (ids.length > 0) {
      const { data: subChallengeRows } = await supabase
        .from('sub_challenges')
        .select('challenge_id')
        .in('challenge_id', ids)

      questionIds = new Set((subChallengeRows || []).map((row: any) => String(row.challenge_id)))
    }

    return (data || []).map((challenge) => ({
      ...challenge,
      is_active: challenge.is_active ?? undefined,
      is_maintenance: challenge.is_maintenance ?? undefined,
      services: challenge.services ?? undefined,
      has_questions: questionIds.has(String(challenge.id)),
    }))
  } catch (err) {
    console.error('Error fetching challenges (lite):', err)
    return []
  }
}

/**
 * Get leaderboard with progress
 */
export async function getLeaderboard(limit = 100, offset = 0, eventId?: string | null | 'all', tag?: string | null) {
  // Map frontend eventId values to RPC parameters
  let p_event_mode: string = 'any'
  let p_event_id: string | null = null
  if (eventId === 'all') {
    p_event_mode = 'any'
    p_event_id = null
  } else if (eventId === null || eventId === 'main') {
    // explicit `null` means Main (only challenges without event)
    p_event_mode = 'is_null'
    p_event_id = null
  } else if (eventId === undefined) {
    // undefined => no filter (any)
    p_event_mode = 'any'
    p_event_id = null
  } else {
    p_event_mode = 'equals'
    p_event_id = eventId
  }

  const { data, error } = await callChallengeRpc('get_leaderboard', {
    limit_rows: limit,
    offset_rows: offset,
    p_event_id,
    p_event_mode,
    p_tag: tag || null,
  })
  if (error) throw error
  return data
}

/**
 * Get lightweight leaderboard summary: username and final score (no progress history)
 */
export async function getLeaderboardSummary(limit = 100, offset = 0, eventId?: string | null | 'all', tag?: string | null) {
  const data = await getLeaderboard(limit, offset, eventId, tag)
  return (data || []).map((d: any) => ({
    id: d.id,
    username: d.username,
    score: typeof d.score === 'number' ? d.score : (d.progress?.at(-1)?.score ?? 0),
    rank: d.rank,
    last_solve: d.last_solve,
    picture: d.picture,
    tags: d.tags || [],
  }))
}

export async function getTopProgress(topUsers: string[], eventId?: string | null | 'all') {
  const batchSize = 1000
  let offset = 0
  let rows: any[] = []

  while (true) {
    // Use RPC to avoid RLS differences between summary and progress
    // Map event filter for RPC
    let p_event_mode: string = 'any'
    let p_event_id: string | null = null
    if (eventId === 'all') {
      p_event_mode = 'any'
      p_event_id = null
    } else if (eventId === null || eventId === 'main') {
      p_event_mode = 'is_null'
      p_event_id = null
    } else if (eventId === undefined) {
      p_event_mode = 'any'
      p_event_id = null
    } else {
      p_event_mode = 'equals'
      p_event_id = eventId
    }

    const { data, error } = await callChallengeRpc('get_top_progress', {
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

  // Build progress curve per user
  const progress: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
  for (const row of rows) {
    const userId = row.user_id
    const username = row.username
    if (!userId || !username) continue
    if (!progress[userId]) {
      progress[userId] = { username, history: [] }
    }

    const prev = progress[userId].history.at(-1)?.score || 0
    progress[userId].history.push({
      date: row.created_at,
      score: prev + (row.points || 0)
    })
  }

  return progress
}

/**
 * Fetch progress curves for a list of usernames (convenience wrapper).
 * Internally resolves usernames -> ids then reuses getTopProgress which expects user ids.
 */
export async function getTopProgressByUsernames(usernames: string[], eventId?: string | null | 'all') {
  if (!usernames || usernames.length === 0) return {}

  // Fetch user ids for the provided usernames
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

  const progressById = await getTopProgress(ids, eventId)

  // Transform to username-keyed map
  const result: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
  for (const id of Object.keys(progressById)) {
    const entry = progressById[id]
    const uname = idToUsername[id]
    if (!uname) continue
    result[uname] = {
      username: entry.username,
      history: entry.history,
    }
  }

  console.log(result)
  return result
}

/**
 * Build a leaderboard based on first-bloods.
 * For each challenge that has a `first_blood` notification, find the earliest solve
 * and award that user the challenge's points. Aggregate per-user and return
 * a sorted leaderboard similar to `getLeaderboardSummary`.
 */
export async function getFirstBloodLeaderboard(limit = 100, offset = 0, eventId?: string | null | 'all') {
  try {
    // Simpler approach: use notification payloads only (assumes notifications include username and points)
    const notifications = await getLogs(2000, 0)
    if (!notifications || notifications.length === 0) return []

    // Filter only first_blood notifications
    const fbNotifs = notifications.filter((n: any) => n.log_type === 'first_blood')
    if (fbNotifs.length === 0) return []

    // If an event filter was requested, fetch challenge event_id mapping and
    // filter notifications to only include first-bloods for challenges that
    // belong to the requested event. `eventId === 'all'` means no filtering.
    if (eventId !== undefined && eventId !== 'all') {
      const challengeIds = Array.from(new Set(fbNotifs.map((n: any) => n.log_challenge_id).filter(Boolean)))
      if (challengeIds.length === 0) return []

      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, event_id')
        .in('id', challengeIds)

      if (error) {
        console.error('Error fetching challenges for first-blood filter:', error)
        return []
      }

      const allowed = new Set<string>()
      for (const c of (challenges || [])) {
        if (eventId === null) {
          if (c.event_id == null) allowed.add(c.id)
        } else {
          if (c.event_id === eventId) allowed.add(c.id)
        }
      }

      // Filter fbNotifs in-place to only those belonging to the allowed set
      const filtered = fbNotifs.filter((n: any) => allowed.has(n.log_challenge_id))
      if (filtered.length === 0) return []
      // replace fbNotifs with filtered list for the rest of the logic
      // (we can't reassign const, so create a new variable name)
      // continue using `fbList` below
      var fbList = filtered
    } else {
      // no filtering requested
      var fbList = fbNotifs
    }

    // Aggregate directly from notifications. We do NOT use numeric "score" here;
    // instead build a cumulative first-blood timeline per user for the chart.
    const countMap: Record<string, number> = {}
    const perUserDates: Record<string, string[]> = {}
    const userMetaByUsername: Record<string, { id?: string | null; username: string }> = {}

    for (const n of fbList) {
      const username = n.log_username || null
      const userId = n.log_user_id || null
      const created = n.log_created_at || null
      if (!username) continue
      countMap[username] = (countMap[username] || 0) + 1
      perUserDates[username] = perUserDates[username] || []
      if (created) perUserDates[username].push(created)
      userMetaByUsername[username] = { id: userId, username }
    }

    const usernames = Object.keys(countMap)
    const userIds = Array.from(new Set(Object.values(userMetaByUsername).map((u) => u.id).filter(Boolean) as string[]))

    const { data: profileRows, error: profileError } = userIds.length > 0
      ? await (supabase.rpc as any)('resolve_user_pictures', { p_user_ids: userIds })
      : { data: null, error: null }

    if (profileError) {
      console.error('Error fetching first-blood profile pictures:', profileError)
    }

    const pictureByUsername = new Map<string, string | null>()
    for (const row of ((profileRows || []) as any[])) {
      if (row.username) pictureByUsername.set(row.username, row.picture ?? null)
    }

    // Build list including the timestamp when the user reached their final count
    const result = Object.keys(countMap)
      .map((username) => {
        const count = countMap[username] || 0
        const dates = (perUserDates[username] || []).slice().sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        // timestamp when the user achieved their final first-blood count
        const achievedAt = dates.length >= count && count > 0 ? dates[count - 1] : dates[dates.length - 1] || null
        return { username, firstBloodCount: count, achievedAt }
      })
      // Sort by count desc, then by achievedAt asc (earlier achievement wins)
      .sort((a, b) => {
        const diff = (b.firstBloodCount || 0) - (a.firstBloodCount || 0)
        if (diff !== 0) return diff
        if (!a.achievedAt && !b.achievedAt) return 0
        if (!a.achievedAt) return 1
        if (!b.achievedAt) return -1
        return new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
      })

    // Build cumulative progress timeline per user from their notification timestamps
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

    const leaderboard = result.slice(offset, offset + limit).map((r, i) => ({
      id: String(i + 1 + offset),
      username: r.username,
      rank: i + 1 + offset,
      score: r.firstBloodCount,
      picture: pictureByUsername.get(userMetaByUsername[r.username]?.id || r.username) ?? pictureByUsername.get(r.username) ?? null,
      // progress: cumulative first-blood count over time
      progress: progressMap[r.username]?.history || [],
    }))

    return leaderboard
  } catch (err) {
    console.error('Error building first-blood leaderboard:', err)
    return []
  }
}

// export async function getLeaderboard() {
//   const batchSize = 1000
//   let allSolves: any[] = []
//   let from = 0

//   console.log('Fetching solves with pagination...')

//   // 🔁 Fetch solves by batches until all retrieved
//   while (true) {
//     const { data, error } = await supabase
//       .from('solves')
//       .select(`
//         created_at,
//         challenges(points),
//         users(id, username)
//       `)
//       .order('created_at', { ascending: true })
//       .range(from, from + batchSize - 1)

//     if (error) throw error

//     allSolves = allSolves.concat(data)
//     console.log(`Fetched ${data.length} solves (total ${allSolves.length})`)

//     // stop if we’ve reached the last batch
//     if (data.length < batchSize) break
//     from += batchSize
//   }

//   console.log(`✅ Total solves fetched: ${allSolves.length}`)

//   // 🧩 Build progress per user
//   const userProgress: Record<string, { username: string, progress: { date: string, score: number }[] }> = {}
//   const startDate = allSolves[0]?.created_at || new Date().toISOString()

//   for (const row of allSolves) {
//     const user = row.users
//     if (!userProgress[user.id]) {
//       userProgress[user.id] = { username: user.username, progress: [{ date: startDate, score: 0 }] }
//     }

//     const prevScore = userProgress[user.id].progress.at(-1)?.score || 0
//     const points = row.challenges?.points || 0

//     userProgress[user.id].progress.push({
//       date: row.created_at,
//       score: prevScore + points,
//     })
//   }

//   // 🏁 Final leaderboard (sorted by score)
//   const leaderboard = Object.values(userProgress)
//     .map(user => ({
//       username: user.username,
//       score: user.progress.at(-1)?.score || 0,
//       progress: user.progress,
//     }))
//     .sort((a, b) => b.score - a.score)

//   console.log(`🏆 Leaderboard built with ${leaderboard.length} users`)
//   return leaderboard
// }

/**
 * Get registered solvers for a challenge
 */
export async function getSolversByChallenge(challengeId: string) {
  try {
    const { data, error } = await callChallengeRpc('get_challenge_solvers', {
      p_challenge_id: challengeId,
    })

    if (error) throw error

    return ((data as any[]) || []).map(row => ({
      username: row.username,
      solvedAt: row.solved_at,
      picture: row.picture
    }))
  } catch (error) {
    console.error('Error fetching solvers:', error)
    return []
  }
}

/**
 * Get first blood challenge IDs for a user
 */
export async function getFirstBloodChallengeIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await callChallengeRpc('get_user_first_bloods', { p_user_id: userId })
    // console.log(data, error)
    if (error) throw error
    // data is expected to be array of { challenge_id }
    return (data || []).map((r: any) => r.challenge_id)
  } catch (err) {
    console.error('Error fetching first bloods (rpc):', err)
    return []
  }
}

/**
 * Get challenge flag (Admin only)
 */
export async function getFlag(challengeId: string): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('get_flag', {
      p_challenge_id: challengeId
    });

    if (error) {
      console.error('Error fetching flag:', error);
      return null;
    }

  return data; // data is already text (flag)
  } catch (err) {
    console.error('Unexpected error fetching flag:', err);
    return null;
  }
}


/**
 * Set challenge active / inactive (Admin only)
 */
export async function setChallengeActive(challengeId: string, isActive: boolean): Promise<boolean> {
  try {
    const { data, error } = await callChallengeRpc('set_challenge_active', {
      p_challenge_id: challengeId,
      p_active: isActive,
    });

    if (error) {
      console.error('Error setting challenge active state:', error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.error('Unexpected error setting challenge active state:', err);
    return false;
  }
}

/**
 * Set challenge maintenance state (Admin only)
 */
export async function setChallengeMaintenance(challengeId: string, isMaintenance: boolean): Promise<boolean> {
  try {
    const { data, error } = await callChallengeRpc('set_challenge_maintenance', {
      p_challenge_id: challengeId,
      p_maintenance: isMaintenance,
    });

    if (error) {
      console.error('Error setting challenge maintenance state:', error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.error('Unexpected error setting challenge maintenance state:', err);
    return false;
  }
}

/**
 * Get all solvers (Admin only) with pagination
 */
export async function getSolversAll(limit = 250, offset = 0) {
  const { data, error } = await callChallengeRpc('get_solvers_all', {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Error fetching solvers (paginated):', error);
    return [];
  }

  return data || [];
}

/**
 * Get solvers for a specific username
 */
export async function getSolversByUsername(username: string) {
  const { data, error } = await callChallengeRpc('get_solves_by_name', {
    p_username: username,
  });

  if (error) {
    console.error(`Error fetching solvers for ${username}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Get solvers for a specific challenge title (exact match)
 */
export async function getSolversByChallengeTitle(challengeTitle: string) {
  const { data, error } = await callChallengeRpc('get_solves_by_challenge', {
    p_challenge_title: challengeTitle,
  });

  if (error) {
    console.error(`Error fetching solvers for challenge "${challengeTitle}":`, error);
    return [];
  }

  return data || [];
}

/** Delete a solver entry by solve ID (Admin only)
 */
export async function deleteSolver(solveId: string) {
  const { data, error } = await callChallengeRpc("delete_solver", {
    p_solve_id: solveId,
  })

  if (error) throw error
  return data
}


/**
 * Notifications (manual broadcast)
 */
export async function getNotifications(limit = 50, offset = 0) {
  const { data, error } = await callChallengeRpc('get_notifications', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}

export async function createNotification(title: string, message: string, level: 'info' | 'info_platform' | 'info_challenges' = 'info') {
  const { data, error } = await callChallengeRpc('create_notification', {
    p_title: title,
    p_message: message,
    p_level: level,
  });
  if (error) throw error;
  return data;
}

export async function deleteNotification(id: string) {
  const { data, error } = await callChallengeRpc('delete_notification', {
    p_id: id,
  });
  if (error) throw error;
  return data;
}

export function subscribeToNotifications(onNotif: (payload: { id: string; title: string; message: string; level: string; created_at: string }) => void) {
  const channel = supabase
    .channel('admin-notifications-insert')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
      const row: any = payload.new || {};
      onNotif({
        id: row.id || `realtime-${row.created_at || ''}-${row.title || ''}`,
        title: row.title || 'Notification',
        message: row.message || '',
        level: row.level || 'info',
        created_at: row.created_at || new Date().toISOString(),
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time solves (challenge solved events)
 * @param onSolve callback({ username, challenge }) dipanggil setiap ada solve baru
 * @returns unsubscribe function
 */
export function subscribeToSolves(onSolve: (payload: { username: string, challenge: string, isFirstBlood?: boolean }) => void) {
  console.log('[subscribeToSolves] Subscribing to solves-insert channel...')
  const channel = supabase
    .channel('solves-insert')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solves' }, async (payload) => {
      try {
        if (!payload || !payload.new) {
          console.warn('[subscribeToSolves] Invalid payload:', payload)
          return;
        }
        let solve = payload.new;
        console.log('[subscribeToSolves] Payload.new:', solve)

        // Ignore historical solves (e.g. restored solves when challenge is activated)
        if (solve.created_at) {
          const ageInMs = Date.now() - new Date(solve.created_at).getTime();
          if (ageInMs > 300000) { // 5 minutes
            console.log(`[subscribeToSolves] Ignoring historical solve (age: ${(ageInMs / 1000).toFixed(0)}s): challenge_id ${solve.challenge_id}`);
            return;
          }
        }

        // Fallback: fetch latest solve if missing user_id or challenge_id
        if (!solve.user_id || !solve.challenge_id) {
          console.warn('[subscribeToSolves] Missing user_id or challenge_id:', solve)
          const { data: latestSolve, error: latestError } = await supabase
            .from('solves')
            .select('id, user_id, challenge_id, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestError || !latestSolve || !latestSolve.user_id || !latestSolve.challenge_id) {
            console.warn('[subscribeToSolves] Still cannot get user_id or challenge_id from latest solve:', latestError, latestSolve)
            onSolve({ username: 'Unknown', challenge: 'Unknown', isFirstBlood: false });
            return;
          }
          solve = latestSolve;

          // Re-check age on fallback data
          if (solve.created_at) {
            const ageInMs = Date.now() - new Date(solve.created_at).getTime();
            if (ageInMs > 300000) { // 5 minutes
              console.log(`[subscribeToSolves] Ignoring historical fallback solve (age: ${(ageInMs / 1000).toFixed(0)}s): challenge_id ${solve.challenge_id}`);
              return;
            }
          }
        }

        // Check if this solve is the first solve (First Blood) for this challenge
        let isFirstBlood = false;
        try {
          const { data: firstSolve } = await supabase
            .from('solves')
            .select('id')
            .eq('challenge_id', solve.challenge_id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstSolve && firstSolve.id === solve.id) {
            isFirstBlood = true;
          }
        } catch (err) {
          console.warn('[subscribeToSolves] Error checking first blood:', err)
        }

        const { data, error } = await supabase
          .rpc('get_solve_info', {
            p_user_id: solve.user_id,
            p_challenge_id: solve.challenge_id
          });

        if (error) {
          console.warn('[subscribeToSolves] Error fetching solve info via RPC:', error);
          onSolve({ username: 'Unknown', challenge: 'Unknown', isFirstBlood });
          return;
        }

        if (data && data.length > 0) {
          // Pastikan type string dan fallback jika null/undefined
          const username = typeof data[0].username === 'string' && data[0].username ? data[0].username : 'Unknown';
          const challenge = typeof data[0].challenge === 'string' && data[0].challenge ? data[0].challenge : 'Unknown';
          onSolve({ username, challenge, isFirstBlood });
          console.log(`[subscribeToSolves] Real-time solve: ${username} solved ${challenge} (First Blood: ${isFirstBlood})`);
        } else {
          onSolve({ username: 'Unknown', challenge: 'Unknown', isFirstBlood });
        }
      } catch (err) {
        console.error('[subscribeToSolves] Error handling solve event:', err)
      }
    })
    .subscribe()
  // Return unsubscribe function
  return () => {
    console.log('[subscribeToSolves] Unsubscribing from solves-insert channel...')
    supabase.removeChannel(channel)
  }
}

export async function getActiveUserTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_active_user_tags')
    if (error) throw error
    return Array.isArray(data) ? data.map(String) : []
  } catch (err) {
    console.error('Error fetching active user tags:', err)
    return []
  }
}

// ==============================================
// Scheduled Jobs (Admin)
// ==============================================

export async function createScheduledJob(
  jobType: string,
  scheduledAt: string,
  targetId?: string | null,
  payload?: Record<string, unknown>
): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('create_scheduled_job', {
      p_job_type: jobType,
      p_scheduled_at: scheduledAt,
      p_target_id: targetId ?? null,
      p_payload: payload ?? {},
    })
    if (error) throw new Error(error.message)
    return data ? String(data) : null
  } catch (err) {
    console.error('Error creating scheduled job:', err)
    throw err
  }
}

export async function repostChallenge(
  challengeId: string,
  newDate: string
): Promise<{ success: boolean; message?: string; created_at?: string }> {
  try {
    const { data, error } = await callChallengeRpc('repost_challenge', {
      p_challenge_id: challengeId,
      p_new_date: newDate,
    })
    if (error) throw new Error(error.message)
    return data as { success: boolean; message?: string; created_at?: string }
  } catch (err) {
    console.error('Error reposting challenge:', err)
    throw err
  }
}

export async function getScheduledJobs(
  status?: string | null,
  limit?: number,
  offset?: number
): Promise<any[]> {
  try {
    const { data, error } = await callChallengeRpc('get_scheduled_jobs', {
      p_status: status ?? null,
      p_limit: limit ?? 50,
      p_offset: offset ?? 0,
    })
    if (error) throw error
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching scheduled jobs:', err)
    return []
  }
}

export async function deleteScheduledJob(jobId: string): Promise<boolean> {
  try {
    const { data, error } = await callChallengeRpc('delete_scheduled_job', {
      p_job_id: jobId,
    })
    if (error) throw error
    return !!data
  } catch (err) {
    console.error('Error deleting scheduled job:', err)
    return false
  }
}

export async function getChallengeFirstBlood(challengeId: string): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('get_challenge_first_blood', {
      p_challenge_id: challengeId,
    })
    if (error) throw error
    return data ? String(data) : null
  } catch (err) {
    console.error('Error fetching first blood:', err)
    return null
  }
}
