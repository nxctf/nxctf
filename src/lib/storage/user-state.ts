type Nullable<T> = T | null | undefined

export type CtfUserStateV1 = {
  v: 1
  notif?: { seen_ids?: string[] }
  logs?: { seen_ids?: string[] }
}

const STORE_KEY_PREFIX = 'nxctf_user_state_v1:'

const safeJsonParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const getStoreKey = (userId: Nullable<string>) => `${STORE_KEY_PREFIX}${userId ? String(userId) : 'anon'}`

const readStateNoMigrate = (userId: Nullable<string>): CtfUserStateV1 => {
  if (typeof window === 'undefined') return { v: 1 }
  const raw = window.localStorage.getItem(getStoreKey(userId))
  const parsed = safeJsonParse<CtfUserStateV1>(raw)
  if (!parsed || parsed.v !== 1) return { v: 1 }
  return parsed
}

const writeState = (userId: Nullable<string>, state: CtfUserStateV1) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getStoreKey(userId), JSON.stringify(state))
}

const migrateLegacyKeysIfNeeded = (userId: Nullable<string>): CtfUserStateV1 => {
  if (typeof window === 'undefined') return { v: 1 }

  const state = readStateNoMigrate(userId)
  const targetUserId = userId ? String(userId) : 'anon'

  let changed = false

  // Legacy notifications seen
  const legacyNotifKey = `nxctf_seen_notifications_v1:${targetUserId}`
  const legacyNotifSeen = safeJsonParse<string[]>(window.localStorage.getItem(legacyNotifKey))
  if (legacyNotifSeen && legacyNotifSeen.length > 0) {
    const current = state.notif?.seen_ids || []
    const merged = Array.from(new Set([...current, ...legacyNotifSeen]))
    if (merged.length !== current.length) {
      state.notif = { ...state.notif, seen_ids: merged }
      changed = true
    }
    try {
      window.localStorage.removeItem(legacyNotifKey)
    } catch {}
  }

  // Legacy logs seen
  const legacyLogsKey = `nxctf_seen_logs_v1:${targetUserId}`
  const legacyLogsSeen = safeJsonParse<string[]>(window.localStorage.getItem(legacyLogsKey))
  if (legacyLogsSeen && legacyLogsSeen.length > 0) {
    const current = state.logs?.seen_ids || []
    const merged = Array.from(new Set([...current, ...legacyLogsSeen]))
    if (merged.length !== current.length) {
      state.logs = { ...state.logs, seen_ids: merged }
      changed = true
    }
    try {
      window.localStorage.removeItem(legacyLogsKey)
    } catch {}
  }

  if (changed) writeState(userId, state)
  return state
}

export const getUserState = (userId: Nullable<string>): CtfUserStateV1 => {
  return migrateLegacyKeysIfNeeded(userId)
}

export const updateUserState = (userId: Nullable<string>, updater: (prev: CtfUserStateV1) => CtfUserStateV1) => {
  if (typeof window === 'undefined') return
  const prev = migrateLegacyKeysIfNeeded(userId)
  const next = updater(prev)
  writeState(userId, next)
}

export const getNotifSeenIds = (userId: Nullable<string>): string[] => {
  const state = getUserState(userId)
  return state.notif?.seen_ids || []
}

export const addNotifSeenIds = (userId: Nullable<string>, ids: string[]): string[] => {
  if (typeof window === 'undefined') return []
  const incoming = (ids || []).map(String).filter(Boolean)
  if (incoming.length === 0) return getNotifSeenIds(userId)

  let merged: string[] = []
  updateUserState(userId, (prev) => {
    const current = prev.notif?.seen_ids || []
    merged = Array.from(new Set([...current, ...incoming]))
    return { ...prev, notif: { ...prev.notif, seen_ids: merged } }
  })
  return merged
}

export const getLogsSeenIds = (userId: Nullable<string>): string[] => {
  const state = getUserState(userId)
  return state.logs?.seen_ids || []
}

export const addLogsSeenIds = (userId: Nullable<string>, ids: string[]): string[] => {
  if (typeof window === 'undefined') return []
  const incoming = (ids || []).map(String).filter(Boolean)
  if (incoming.length === 0) return getLogsSeenIds(userId)

  let merged: string[] = []
  updateUserState(userId, (prev) => {
    const current = prev.logs?.seen_ids || []
    merged = Array.from(new Set([...current, ...incoming]))
    return { ...prev, logs: { ...prev.logs, seen_ids: merged } }
  })
  return merged
}
