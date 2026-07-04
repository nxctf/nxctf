'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export type SystemSettings = {
  disable_create_team: boolean
  disable_join_team: boolean
  disable_edit_team: boolean
  disable_edit_username: boolean
  disable_signup: boolean
  disable_default_challenges: boolean
  max_team_members: number
  discord_link: string
  event_main_label: string
  event_main_image_url: string
  event_fallback_image_url: string
  flag_format: string
}

export const DEFAULT_SETTINGS: SystemSettings = {
  disable_create_team: false,
  disable_join_team: false,
  disable_edit_team: false,
  disable_edit_username: false,
  disable_signup: false,
  disable_default_challenges: false,
  max_team_members: 5,
  discord_link: 'https://discord.gg/5etKks6aQQ',
  event_main_label: 'main',
  event_main_image_url: 'https://raw.githubusercontent.com/nxctf/assets/refs/heads/main/event/active_nxctf.png',
  event_fallback_image_url: '',
  flag_format: 'NXCTF{your_flag_here}',
}

type SystemSettingsContextType = {
  settings: SystemSettings
  loading: boolean
  refresh: () => Promise<void>
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

const CACHE_KEY = 'nxctf_system_settings_cache'
const CACHE_TTL = 60 * 1000 // 1 minute

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')

      if (error) throw error

      if (data) {
        const parsedSettings = { ...DEFAULT_SETTINGS } as any
        data.forEach((item: { key: string; value: string }) => {
          const key = item.key
          const val = item.value

          if (key in DEFAULT_SETTINGS) {
            const defaultType = typeof (DEFAULT_SETTINGS as any)[key]
            if (defaultType === 'boolean') {
              parsedSettings[key] = val === 'true'
            } else if (defaultType === 'number') {
              parsedSettings[key] = Number(val) || (DEFAULT_SETTINGS as any)[key]
            } else {
              parsedSettings[key] = val
            }
          }
        })

        setSettings(parsedSettings)

        // Save to cache
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            settings: parsedSettings,
            timestamp: Date.now(),
          })
        )
      }
    } catch (err) {
      console.error('Failed to load system settings from database:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { settings: cachedSettings, timestamp } = JSON.parse(cached)
        setSettings(cachedSettings)
        setLoading(false)

        if (Date.now() - timestamp > CACHE_TTL) {
          void fetchSettings()
        }
      } else {
        await fetchSettings()
      }
    } catch {
      await fetchSettings()
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  return (
    <SystemSettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext)
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}
