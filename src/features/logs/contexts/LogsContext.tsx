"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { ChallengeService } from '@/shared/lib/challenges'
import { useAuth } from '@/shared/contexts/AuthContext'
import { addLogsSeenIds, getLogsSeenIds } from '@/lib/storage/user-state'
import { getLogs, getRecentSolves, subscribeToLogSignals } from '@/features/logs/lib/log-service'

type LogShape = {
  log_type: 'new_challenge' | 'first_blood'
  log_challenge_id: string
  log_challenge_title: string
  log_category: string
  log_user_id?: string
  log_username?: string
  log_created_at: string
}

type LogsContextType = {
  unreadCount: number
  refresh: () => Promise<void>
  // markAllRead optionally accepts an eventId filter (null | 'all' | eventId)
  markAllRead: (eventId?: string | null | 'all') => void
  // Return a set of challenge ids for a given event (cached)
  getEventChallengeIds: (eventId: string | null | 'all') => Promise<Set<string> | null>
  // Get cached feed for logs page tabs, with incremental refresh of only the latest rows.
  getFeed: (tabType: 'challenges' | 'solves', eventId?: string | null | 'all') => Promise<any[]>
}

const LogsContext = createContext<LogsContextType | undefined>(undefined)

// Unread badge refresh: keep fresh-ish but avoid spamming RPCs.
const LOGS_CACHE_TTL_MS = 10_000
const LOGS_SIGNAL_MIN_REFRESH_MS = 5_000

// Feed cache: keep results across tab switches and even component remounts.
const FEED_CACHE_TTL_MS = 15_000
const MAX_CHALLENGE_LOGS = 2000
const MAX_SOLVE_LOGS = 50
const REFRESH_CHALLENGE_LOGS = 250
const REFRESH_SOLVE_LOGS = 50

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const userId = user?.id || null

  // In-memory cache for event -> challenge id list (persist across renders)
  const eventChallengeCacheRef = useRef<Record<string, string[]>>({})

  // Cache the small logs fetch used for unread computations.
  const logsCacheRef = useRef<{ fetchedAt: number; data: LogShape[] } | null>(null)

  // Logs page feed cache: tabType+eventKey -> cached entries.
  const feedCacheRef = useRef(new Map<string, { fetchedAt: number; data: any[] }>())
  // Avoid duplicate in-flight fetches when user rapidly switches tabs/events.
  const feedInflightRef = useRef(new Map<string, Promise<any[]>>())

  // Debounce refresh calls triggered by realtime signals.
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Hard throttle: at most one refresh per window, even if many bursts arrive.
  const lastSignalRefreshAtRef = useRef<number>(0)

  const logId = (n: LogShape) => `${n.log_type}|${n.log_challenge_id}|${n.log_user_id || ''}|${n.log_created_at}`

  const feedEventKey = (eventId?: string | null | 'all') => {
    if (eventId === undefined) return 'any'
    if (eventId === null) return 'main'
    return String(eventId)
  }

  const feedEntryId = (n: any) => {
    const type = String(n?.log_type ?? '')
    const challengeId = String(n?.log_challenge_id ?? '')
    const userPart = String(n?.log_user_id ?? n?.log_username ?? '')
    const createdAt = String(n?.log_created_at ?? '')
    return `${type}|${challengeId}|${userPart}|${createdAt}`
  }

  const sortByCreatedAtDesc = (a: any, b: any) => {
    const ta = new Date(a?.log_created_at ?? 0).getTime()
    const tb = new Date(b?.log_created_at ?? 0).getTime()
    return tb - ta
  }

  async function getLogsCached(force = false): Promise<LogShape[]> {
    const now = Date.now()
    const cached = logsCacheRef.current
    if (!force && cached && now - cached.fetchedAt < LOGS_CACHE_TTL_MS) {
      return cached.data
    }
    const logs = (await getLogs(100, 0)) as LogShape[]
    logsCacheRef.current = { fetchedAt: now, data: logs }
    return logs
  }

  async function getFeed(tabType: 'challenges' | 'solves', eventId?: string | null | 'all'): Promise<any[]> {
    const normalizedEventKey = feedEventKey(eventId)
    const cacheKey = `${tabType}:${normalizedEventKey}`

    // If we already have a fetch running for this key, reuse it.
    const inflight = feedInflightRef.current.get(cacheKey)
    if (inflight) return inflight

    const run = (async () => {
      const now = Date.now()
      const cached = feedCacheRef.current.get(cacheKey)

      // Serve cache immediately if fresh.
      if (cached && now - cached.fetchedAt < FEED_CACHE_TTL_MS) {
        return cached.data
      }

      const isRefresh = !!cached
      const limit = tabType === 'challenges'
        ? (isRefresh ? REFRESH_CHALLENGE_LOGS : MAX_CHALLENGE_LOGS)
        : (isRefresh ? REFRESH_SOLVE_LOGS : MAX_SOLVE_LOGS)

      const eventMode: 'any' | 'main' | 'event' =
        eventId === undefined || eventId === 'all'
          ? 'any'
          : (eventId === null || eventId === 'main')
            ? 'main'
            : 'event'
      const eventParam = eventMode === 'event' ? String(eventId) : null

      // Fetch latest rows only (offset 0). For refresh, keep it small.
      const fetched = tabType === 'challenges'
        ? await getLogs(limit, 0, eventParam, eventMode)
        : await getRecentSolves(limit, 0, eventParam, eventMode)

      let fetchedFiltered = (fetched || []) as any[]

      // Merge with cache (dedupe by stable entry id), sort newest-first, cap size.
      const mergedMap = new Map<string, any>()
      const base = (cached?.data || []) as any[]
      for (const item of base) mergedMap.set(feedEntryId(item), item)
      for (const item of fetchedFiltered) mergedMap.set(feedEntryId(item), item)

      let merged = Array.from(mergedMap.values()).sort(sortByCreatedAtDesc)
      const cap = tabType === 'challenges' ? MAX_CHALLENGE_LOGS : MAX_SOLVE_LOGS
      if (merged.length > cap) merged = merged.slice(0, cap)

      feedCacheRef.current.set(cacheKey, { fetchedAt: now, data: merged })
      return merged
    })().finally(() => {
      feedInflightRef.current.delete(cacheKey)
    })

    feedInflightRef.current.set(cacheKey, run)
    return run
  }

  async function refresh() {
    try {
      if (!user) {
        setUnreadCount(0)
        return
      }
      const logs = await getLogsCached(false)
      const ids = logs.map(logId)
      const seen = getLogsSeenIds(user.id)
      const seenSet = new Set(seen)
      const unread = ids.filter((id) => !seenSet.has(id)).length
      setUnreadCount(unread)
    } catch (err) {
      console.warn('Failed to refresh logs', err)
    }
  }

  // Return a Set of challenge ids for the given eventId.
  async function getEventChallengeIds(eventId: string | null | 'all') {
    if (eventId === 'all') return null
    const normalizedId = eventId === null ? 'main' : String(eventId)
    const key = `nxctf_event_challenge_ids_v1:${normalizedId}`
    // check in-memory
    if (eventChallengeCacheRef.current[normalizedId]) return new Set(eventChallengeCacheRef.current[normalizedId])
    // check sessionStorage
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null
      if (stored) {
        const arr: string[] = JSON.parse(stored)
        eventChallengeCacheRef.current[normalizedId] = arr
        return new Set(arr)
      }
    } catch { }

    // fetch from server
    try {
      const challenges = await ChallengeService.getChallengesList(undefined, true, (eventId === null ? null : eventId) as any)
      const ids = (challenges || []).map((c: any) => String(c.id))
      eventChallengeCacheRef.current[normalizedId] = ids
      try {
        if (typeof window !== 'undefined') sessionStorage.setItem(key, JSON.stringify(ids))
      } catch { }
      return new Set(ids)
    } catch (err) {
      console.warn('getEventChallengeIds failed', err)
      return null
    }
  }

  function markAllRead(eventId?: string | null | 'all') {
    try {
      if (!user) {
        setUnreadCount(0)
        return
      }
      if (eventId !== undefined && eventId !== 'all') {
        Promise.all([getLogsCached(false), getEventChallengeIds(eventId as any)])
          .then(([logs, allowedSet]: [any[], Set<string> | null]) => {
            const allowed = allowedSet
            const ids = (logs || [])
              .filter((n: LogShape) => (allowed ? allowed.has(String(n.log_challenge_id)) : true))
              .map((n: LogShape) => logId(n))
            const merged = addLogsSeenIds(user.id, ids)
            const mergedSet = new Set(merged)
            const remaining = (logs || []).map(logId).filter((id) => !mergedSet.has(id)).length
            setUnreadCount(remaining)
          }).catch(err => {
            console.warn('markAllRead failed to fetch logs/challenges', err)
          })
      } else {
        getLogsCached(false).then((logs: any) => {
          const ids = (logs || []).map((n: LogShape) => logId(n))
          addLogsSeenIds(user.id, ids)
          setUnreadCount(0)
        }).catch(err => {
          console.warn('markAllRead failed to fetch logs', err)
        })
      }
    } catch (err) {
      console.warn('markAllRead error', err)
    }
  }

  useEffect(() => {
    logsCacheRef.current = null
    lastSignalRefreshAtRef.current = 0
    refresh()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const unsubscribe = subscribeToLogSignals(() => {
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current)
      refreshDebounceRef.current = setTimeout(() => {
        const now = Date.now()
        if (now - lastSignalRefreshAtRef.current < LOGS_SIGNAL_MIN_REFRESH_MS) {
          return
        }
        lastSignalRefreshAtRef.current = now
        refresh()
      }, 750)
    })

    return () => {
      unsubscribe()
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current)
        refreshDebounceRef.current = null
      }
    }
  }, [userId])

  return (
    <LogsContext.Provider value={{ unreadCount, refresh, markAllRead, getEventChallengeIds, getFeed }}>
      {children}
    </LogsContext.Provider>
  )
}

export function useLogs() {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error('useLogs must be used inside LogsProvider')
  return ctx
}
