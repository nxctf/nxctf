"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  isGlobalAdmin,
  getSystemSettings,
  updateSystemSettings
} from '@/features/admin/services/admin.service'
import {
  AdminContentLoading,
  AdminPageShell,
  AdminPanel,
  AdminTabs,
  AdminStickyToolbar,
  useTabState
} from '../../ui'
import { Switch } from '@/shared/ui/switch'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import toast from 'react-hot-toast'
import { Settings, Save, ShieldAlert, Shield, Trophy, Users } from 'lucide-react'

type SettingsTab = 'general' | 'challenges' | 'teams'

interface ConfigKey {
  key: string
  label: string
  description: string
  type?: 'boolean' | 'number' | 'string'
  tab: SettingsTab
}

const CONFIG_KEYS: ConfigKey[] = [
  {
    key: 'disable_signup',
    label: 'Disable User Registration',
    description: 'Prevent new user registrations and signups on the platform. Global administrators are unaffected.',
    type: 'boolean',
    tab: 'general',
  },
  {
    key: 'disable_edit_username',
    label: 'Disable Editing Username',
    description: 'Prevent participants from changing their own usernames. Global administrators are unaffected.',
    type: 'boolean',
    tab: 'general',
  },
  {
    key: 'discord_link',
    label: 'Discord Invitation Link',
    description: 'The URL for participants to join the community Discord server.',
    type: 'string',
    tab: 'general',
  },
  {
    key: 'flag_format',
    label: 'Flag Format',
    description: 'The standard flag format format structure (e.g. NXCTF{your_flag_here}).',
    type: 'string',
    tab: 'general',
  },
  {
    key: 'disable_default_challenges',
    label: 'Disable Default/Main Challenges',
    description: 'Hide and disable access to all default/main challenges (not bound to any event). This prevents viewing, listing, and flag submissions.',
    type: 'boolean',
    tab: 'challenges',
  },
  {
    key: 'event_main_label',
    label: 'Main Event Label',
    description: 'The display name for challenges not bound to any specific event (defaults to "main").',
    type: 'string',
    tab: 'challenges',
  },
  {
    key: 'event_main_image_url',
    label: 'Main Event Image URL',
    description: 'URL of the banner image for the main/featured event.',
    type: 'string',
    tab: 'challenges',
  },
  {
    key: 'event_fallback_image_url',
    label: 'Event Fallback Image URL',
    description: 'Default banner image URL for events that do not have their own banner image.',
    type: 'string',
    tab: 'challenges',
  },
  {
    key: 'disable_create_team',
    label: 'Disable Team Creation',
    description: 'Prevent participants from creating new teams. Global administrators are unaffected.',
    type: 'boolean',
    tab: 'teams',
  },
  {
    key: 'disable_join_team',
    label: 'Disable Joining/Leaving Teams',
    description: 'Prevent participants from joining or leaving teams. Global administrators are unaffected.',
    type: 'boolean',
    tab: 'teams',
  },
  {
    key: 'disable_edit_team',
    label: 'Disable editing team name',
    description: 'Prevent participants from renaming or modifying team profiles. Global administrators are unaffected.',
    type: 'boolean',
    tab: 'teams',
  },
  {
    key: 'max_team_members',
    label: 'Maximum Members Per Team',
    description: 'The maximum number of members allowed in a single team. Changes do not affect existing teams.',
    type: 'number',
    tab: 'teams',
  },
]

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [accessReady, setAccessReady] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useTabState<SettingsTab>('tab', 'general')

  useEffect(() => {
    let mounted = true

    const checkAccessAndLoad = async () => {
      if (authLoading) return

      if (!user) {
        setAccessReady(true)
        router.push('/challenges')
        return
      }

      const adminCheck = await isGlobalAdmin()
      if (!mounted) return

      setIsAllowed(adminCheck)
      setAccessReady(true)

      if (!adminCheck) {
        router.push('/challenges')
        return
      }

      // Load current system settings
      try {
        const data = await getSystemSettings()
        if (!mounted) return

        const settingsMap: Record<string, string> = {}
        // Initialize with default values
        CONFIG_KEYS.forEach((cfg) => {
          if (cfg.key === 'discord_link') settingsMap[cfg.key] = 'https://discord.gg/5etKks6aQQ'
          else if (cfg.key === 'event_main_label') settingsMap[cfg.key] = 'main'
          else if (cfg.key === 'event_main_image_url') settingsMap[cfg.key] = 'https://raw.githubusercontent.com/nxctf/assets/refs/heads/main/event/active_nxctf.png'
          else if (cfg.key === 'event_fallback_image_url') settingsMap[cfg.key] = ''
          else if (cfg.key === 'flag_format') settingsMap[cfg.key] = 'NXCTF{your_flag_here}'
          else {
            settingsMap[cfg.key] = cfg.type === 'number' ? '5' : 'false'
          }
        })
        // Override with database values
        data.forEach((s) => {
          settingsMap[s.key] = s.value
        })

        setSettings(settingsMap)
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast.error('Failed to load system settings')
      } finally {
        if (mounted) {
          setIsLoadingSettings(false)
        }
      }
    }

    void checkAccessAndLoad()

    return () => {
      mounted = false
    }
  }, [authLoading, user, router])

  const handleToggle = (key: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: checked ? 'true' : 'false',
    }))
  }

  const handleTextChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: Record<string, string> = {}
      Object.entries(settings).forEach(([k, v]) => {
        payload[k] = v
      })

      const res = await updateSystemSettings(payload)
      if (res.success) {
        toast.success('System settings updated successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !accessReady) return <AdminContentLoading />
  if (!user || !isAllowed) return null

  const filteredKeys = CONFIG_KEYS.filter((cfg) => cfg.tab === activeTab)

  return (
    <AdminPageShell>
      <div className="flex flex-col min-h-0 flex-1">
        <AdminStickyToolbar
          tabs={
            <AdminTabs
              value={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  value: 'general',
                  label: 'General & Security',
                  icon: Shield,
                },
                {
                  value: 'challenges',
                  label: 'Challenges & Events',
                  icon: Trophy,
                },
                {
                  value: 'teams',
                  label: 'Teams Management',
                  icon: Users,
                },
              ]}
            />
          }
        />

        {isLoadingSettings ? (
          <AdminContentLoading />
        ) : (
          <AdminPanel
            title={
              activeTab === 'general'
                ? 'General & Security Settings'
                : activeTab === 'challenges'
                ? 'Challenges & Event Configurations'
                : 'Team Management Settings'
            }
            icon={activeTab === 'general' ? Shield : activeTab === 'challenges' ? Trophy : Users}
            description={
              activeTab === 'general'
                ? 'Configure registration settings, user privacy, and platform communication links.'
                : activeTab === 'challenges'
                ? 'Manage visibility and naming for default challenges, and configure event image fallbacks.'
                : 'Define member limits, rename policies, and join/leave permissions for team play.'
            }
            className="!border-none !bg-transparent !shadow-none !backdrop-blur-none !p-0"
            headerClassName="!border-none !px-0 !pb-4"
            contentClassName="!p-0"
          >
            <div className="divide-y divide-gray-200/50 dark:divide-gray-800/60">
              {filteredKeys.map((config) => (
                <div
                  key={config.key}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-2"
                >
                  <div className="min-w-0 pr-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {config.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal mt-0.5">
                      {config.description}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    {config.type === 'number' ? (
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={settings[config.key] || '5'}
                        onChange={(e) => handleTextChange(config.key, e.target.value)}
                        className="w-20 text-center text-xs h-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
                      />
                    ) : config.type === 'string' ? (
                      <Input
                        type="text"
                        value={settings[config.key] || ''}
                        onChange={(e) => handleTextChange(config.key, e.target.value)}
                        className="w-64 text-left text-xs h-9 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
                      />
                    ) : (
                      <Switch
                        checked={settings[config.key] === 'true'}
                        onCheckedChange={(checked) => handleToggle(config.key, checked)}
                        aria-label={config.label}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500/90 font-medium">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Changes take effect immediately.</span>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 font-semibold"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </AdminPanel>
        )}
      </div>
    </AdminPageShell>
  )
}
