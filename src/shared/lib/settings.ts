type Nullable<T> = T | null | undefined

export type nxctfettingsV1 = {
  v: 1
  theme?: 'light' | 'dark'
  notif?: {
    solveSoundEnabled?: boolean
  }
  challenges?: {
    filterSettings?: {
      hideMaintenance: boolean
      highlightTeamSolves: boolean
      hideSolvedIntro: boolean
    }
  }
  events?: {
    selectedEvent?: string
  }
  tutorial?: {
    challenge_guide_seen?: boolean
    challenge_guide_seen_version?: number
  }
}

const STORE_KEY = 'nxctf_settings_v1'

const safeJsonParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const readSettingsNoMigrate = (): nxctfettingsV1 => {
  if (typeof window === 'undefined') return { v: 1 }
  const raw = window.localStorage.getItem(STORE_KEY)
  const parsed = safeJsonParse<nxctfettingsV1>(raw)
  if (!parsed || parsed.v !== 1) return { v: 1 }
  return parsed
}

const writeSettings = (settings: nxctfettingsV1) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORE_KEY, JSON.stringify(settings))
  if (settings.theme === 'light' || settings.theme === 'dark') {
    document.cookie = `nxctf_theme=${settings.theme}; Path=/; Max-Age=31536000; SameSite=Lax`
  }
}

const migrateLegacyNonUserKeysIfNeeded = (): nxctfettingsV1 => {
  if (typeof window === 'undefined') return { v: 1 }

  const settings = readSettingsNoMigrate()
  let changed = false

  // Legacy theme key
  if (!settings.theme) {
    try {
      const legacyTheme = window.localStorage.getItem('theme')
      if (legacyTheme === 'light' || legacyTheme === 'dark') {
        settings.theme = legacyTheme
        changed = true
      }
      if (legacyTheme !== null) {
        window.localStorage.removeItem('theme')
      }
    } catch {}
  }

  // Legacy solve sound key
  if (typeof settings.notif?.solveSoundEnabled !== 'boolean') {
    try {
      const raw = window.localStorage.getItem('ctf.notif.solveSound')
      if (raw !== null) {
        const parsed = raw === 'true'
        settings.notif = { ...settings.notif, solveSoundEnabled: parsed }
        changed = true
        window.localStorage.removeItem('ctf.notif.solveSound')
      }
    } catch {}
  }

  // Legacy challenge filter settings
  if (!settings.challenges?.filterSettings) {
    try {
      const raw = window.localStorage.getItem('ctf.challengeFilterSettings')
      if (raw) {
        const parsed = safeJsonParse<any>(raw)
        if (typeof parsed?.hideMaintenance === 'boolean' && typeof parsed?.highlightTeamSolves === 'boolean') {
          settings.challenges = {
            ...settings.challenges,
            filterSettings: {
              hideMaintenance: parsed.hideMaintenance,
              highlightTeamSolves: parsed.highlightTeamSolves,
              hideSolvedIntro: true,
            },
          }
          changed = true
        }
        window.localStorage.removeItem('ctf.challengeFilterSettings')
      }
    } catch {}
  }

  // Legacy selected event
  if (!settings.events?.selectedEvent) {
    try {
      const raw = window.localStorage.getItem('ctf.selectedEvent')
      if (raw !== null) {
        const v = String(raw).trim()
        const normalized = !v || v === 'undefined' ? undefined : v === 'null' ? 'main' : v
        if (normalized) {
          settings.events = { ...settings.events, selectedEvent: normalized }
          changed = true
        }
        window.localStorage.removeItem('ctf.selectedEvent')
      }
    } catch {}
  }

  if (changed) writeSettings(settings)
  return settings
}

const migrateTutorialFromUserKeysIfNeeded = (userId: Nullable<string>): nxctfettingsV1 => {
  if (typeof window === 'undefined') return { v: 1 }

  const settings = migrateLegacyNonUserKeysIfNeeded()
  let changed = false

  // Legacy tutorial key (per-user)
  if (typeof settings.tutorial?.challenge_guide_seen !== 'boolean' && userId) {
    try {
      const legacyTutorialKey = `ctf_tutorial_guide_seen_${String(userId)}`
      const legacyTutorialVal = window.localStorage.getItem(legacyTutorialKey)
      if (legacyTutorialVal !== null) {
        const legacySeen = legacyTutorialVal === 'true'
        settings.tutorial = { ...settings.tutorial, challenge_guide_seen: legacySeen }
        changed = true
        window.localStorage.removeItem(legacyTutorialKey)
      }
    } catch {}
  }

  // If we previously stored tutorial in nxctf_user_state_v1:<userId>, migrate it into settings
  if (typeof settings.tutorial?.challenge_guide_seen !== 'boolean' && userId) {
    try {
      const userStateKey = `nxctf_user_state_v1:${String(userId)}`
      const raw = window.localStorage.getItem(userStateKey)
      const parsed = safeJsonParse<any>(raw)
      const maybeSeen = parsed?.tutorial?.challenge_guide_seen
      if (typeof maybeSeen === 'boolean') {
        settings.tutorial = { ...settings.tutorial, challenge_guide_seen: maybeSeen }
        changed = true
      }

      // Clean tutorial section from userState (leave notif/logs intact)
      if (parsed && parsed.v === 1 && parsed.tutorial) {
        delete parsed.tutorial
        window.localStorage.setItem(userStateKey, JSON.stringify(parsed))
      }
    } catch {}
  }

  if (changed) writeSettings(settings)
  return settings
}

export const getSettings = (): nxctfettingsV1 => {
  return migrateLegacyNonUserKeysIfNeeded()
}

export const updateSettings = (updater: (prev: nxctfettingsV1) => nxctfettingsV1) => {
  if (typeof window === 'undefined') return
  const prev = migrateLegacyNonUserKeysIfNeeded()
  const next = updater(prev)
  writeSettings(next)
}

export const getThemeSetting = (): 'light' | 'dark' | null => {
  const settings = getSettings()
  return settings.theme ?? null
}

export const setThemeSetting = (theme: 'light' | 'dark') => {
  updateSettings((prev) => ({ ...prev, theme }))
}

export const getSolveSoundEnabledSetting = (): boolean => {
  const settings = getSettings()
  return settings.notif?.solveSoundEnabled ?? true
}

export const setSolveSoundEnabledSetting = (enabled: boolean) => {
  updateSettings((prev) => ({
    ...prev,
    notif: { ...prev.notif, solveSoundEnabled: !!enabled },
  }))
}

export const getChallengeFilterSettings = (): { hideMaintenance: boolean; highlightTeamSolves: boolean; hideSolvedIntro: boolean } | null => {
  const settings = getSettings()
  return settings.challenges?.filterSettings ?? null
}

export const setChallengeFilterSettings = (filterSettings: { hideMaintenance: boolean; highlightTeamSolves: boolean; hideSolvedIntro: boolean }) => {
  updateSettings((prev) => ({
    ...prev,
    challenges: { ...prev.challenges, filterSettings },
  }))
}

export const getSelectedEventSetting = (): string | null => {
  const settings = getSettings()
  return settings.events?.selectedEvent ?? null
}

export const setSelectedEventSetting = (value: string) => {
  updateSettings((prev) => ({
    ...prev,
    events: { ...prev.events, selectedEvent: String(value) },
  }))
}

export const getChallengeGuideSeenSetting = (
  userIdForMigration?: Nullable<string>,
  minVersion?: number
): boolean => {
  const settings = migrateTutorialFromUserKeysIfNeeded(userIdForMigration)
  const hasSeenGuide = !!settings.tutorial?.challenge_guide_seen

  if (!hasSeenGuide) return false
  if (typeof minVersion !== 'number') return true

  return (settings.tutorial?.challenge_guide_seen_version ?? 0) >= minVersion
}

export const setChallengeGuideSeenSetting = (seen: boolean, version?: number) => {
  updateSettings((prev) => ({
    ...prev,
    tutorial: {
      ...prev.tutorial,
      challenge_guide_seen: !!seen,
      ...(typeof version === 'number' ? { challenge_guide_seen_version: seen ? version : 0 } : {}),
    },
  }))
}
