'use client'

import { useEffect, useState } from 'react'
import {
  getChallengeFilterSettings,
  setChallengeFilterSettings,
} from '@/shared/lib'
import type { ChallengeFilterSettings } from '../types'

export function useChallengeFilterSettings() {
  const [filterSettings, setFilterSettings] = useState<ChallengeFilterSettings>({
    hideMaintenance: false,
    highlightTeamSolves: true,
    hideSolvedIntro: true,
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = getChallengeFilterSettings()
      if (stored) setFilterSettings(stored)
    } catch {
      // ignore
    } finally {
      setSettingsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!settingsLoaded || typeof window === 'undefined') return

    try {
      setChallengeFilterSettings(filterSettings)
    } catch {
      // ignore
    }
  }, [filterSettings, settingsLoaded])

  return {
    filterSettings,
    setFilterSettings,
  }
}
