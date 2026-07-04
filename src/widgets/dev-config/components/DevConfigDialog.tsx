"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Loader2, Plus, Save, Settings2, X, AlertCircle, CheckCircle2, FileJson, Key, Info } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Label,
  Switch,
  Badge,
} from '@/shared/ui'
import { SegmentedTabs } from '@/shared/components'
import BaseScoreboardTable, { type BaseScoreboardColumn } from '@/features/scoreboard/components/base/BaseScoreboardTable'
import BaseScoreboardCard from '@/features/scoreboard/components/base/BaseScoreboardCard'
import { cn } from '@/shared/lib/utils'
import {
  DIALOG_CONTENT_CLASS_3XL,
  SURFACE_GLASS_INPUT_CLASS,
} from "@/shared/styles"

type SetupConfig = {
  shortName: string
  fullName: string
  description: string
  notifSolves: boolean
  teamsEnabled: boolean
  hideScoreboardIndividual: boolean
  hideScoreboardTotal: boolean
  image_icon: string
  image_logo: string
  image_preview: string
}

type SecretConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  turnstileSiteKey: string
  turnstileSiteKeyEnabled: boolean
  nxctlEnabled: boolean
  nxctlApiUrl: string
  nxctlApiToken: string
  nxctlApiAdminSecret: string
}

type AssetConfigItem = {
  label: string
  description: string
  currentValue: string
  type: 'icon' | 'logo' | 'preview'
}

const FIELD_LABEL_CLASS =
  'mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300'

const INPUT_CLASS = `${SURFACE_GLASS_INPUT_CLASS} h-10 px-3`
const MONO_INPUT_CLASS = `${INPUT_CLASS} font-mono text-[11px]`

const emptyConfig: SetupConfig = {
  shortName: '',
  fullName: '',
  description: '',
  notifSolves: false,
  teamsEnabled: false,
  hideScoreboardIndividual: false,
  hideScoreboardTotal: false,
  image_icon: '',
  image_logo: '',
  image_preview: '',
}

const emptySecret: SecretConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  turnstileSiteKey: '',
  turnstileSiteKeyEnabled: false,
  nxctlEnabled: false,
  nxctlApiUrl: '',
  nxctlApiToken: '',
  nxctlApiAdminSecret: '',
}

interface DevConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DevConfigDialog({ open, onOpenChange }: DevConfigDialogProps) {
  const [config, setConfig] = useState<SetupConfig>(emptyConfig)
  const [secret, setSecret] = useState<SecretConfig>(emptySecret)
  const [activeTab, setActiveTab] = useState<'config' | 'secret'>('config')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [uploadingType, setUploadingType] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (!open) return
    loadConfig()
  }, [open])

  const loadConfig = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/config', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to load config')
      setConfig(data.config)
      setSecret(data.secret || emptySecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = activeTab === 'config' ? config : { secret }
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to save')

      if (activeTab === 'config') setConfig(data.config)
      else setSecret(data.secret || emptySecret)

      setMessage('Successfully saved!')
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof SetupConfig>(key: K, value: SetupConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const updateSecretField = <K extends keyof SecretConfig>(key: K, value: SecretConfig[K]) => {
    setSecret((current) => ({ ...current, [key]: value }))
  }

  const toggleField = (key: keyof Pick<SetupConfig, 'notifSolves' | 'teamsEnabled' | 'hideScoreboardIndividual' | 'hideScoreboardTotal'>) => {
    setConfig((current) => ({ ...current, [key]: !current[key] }))
  }

  const toggleSecretField = (key: keyof Pick<SecretConfig, 'turnstileSiteKeyEnabled' | 'nxctlEnabled'>) => {
    setSecret((current) => ({ ...current, [key]: !current[key] }))
  }



  const handleFileUpload = async (file: File, type: string) => {
    setUploadingType(type)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const res = await fetch('/api/config', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed')

      const fieldMap: Record<string, keyof SetupConfig> = {
        icon: 'image_icon',
        logo: 'image_logo',
        preview: 'image_preview'
      }
      if (fieldMap[type]) {
        updateField(fieldMap[type], data.path)
      }

      setMessage(`Successfully uploaded ${type}! Save changes to persist.`)
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingType(null)
    }
  }

  const assetRows: AssetConfigItem[] = [
    {
      label: 'Platform Icon',
      description: '.ico favicon asset',
      currentValue: config.image_icon,
      type: 'icon',
    },
    {
      label: 'Logo Image',
      description: 'SVG or PNG brand mark',
      currentValue: config.image_logo,
      type: 'logo',
    },
    {
      label: 'OG Preview Image',
      description: 'Social sharing preview',
      currentValue: config.image_preview,
      type: 'preview',
    },
  ]

  const assetColumns: BaseScoreboardColumn<AssetConfigItem>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (item) => (
        <div className="min-w-[160px]">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'current',
      header: 'Current file',
      render: (item) => <AssetCurrentValue item={item} />,
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <UploadAction
          type={item.type}
          uploading={uploadingType === item.type}
          onUpload={handleFileUpload}
        />
      ),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_CONTENT_CLASS_3XL, "flex max-h-[85vh] flex-col overflow-hidden border border-gray-200/80 p-0 dark:border-gray-800/80")}>
        <div className="shrink-0">
          <div className="border-b border-gray-200/70 px-4 py-3.5 dark:border-gray-800/80 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                  <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                    Platform Setup
                  </DialogTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Dev Only
                    </Badge>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Runtime configuration
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={saveConfig}
                disabled={saving || loading}
                size="lg"
                className="h-10 w-full px-5 sm:w-auto"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="border-b border-gray-200/70 px-4 py-3.5 dark:border-gray-800/80 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SegmentedTabs
                items={[
                  { value: 'config', label: 'Application', icon: FileJson },
                  { value: 'secret', label: 'Infrastructure', icon: Key },
                ]}
                value={activeTab}
                onChange={setActiveTab}
                variant="panel"
                className="w-full sm:w-fit"
                stretch
              />
              <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 dark:text-gray-400">
                <Info className="h-3.5 w-3.5 text-blue-500" />
                {activeTab === 'config' ? 'src/config.ts' : '.env.local'}
              </div>
            </div>
          </div>

        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-hidden sm:p-5">
          <AnimatePresence mode="wait">
            {(message || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3",
                  message
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {message ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                <p className="text-sm font-semibold">{message || error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Loading configuration...
                </p>
              </div>
            </div>
          ) : activeTab === 'config' ? (
            <div className="space-y-4">
              <Section title="Identity & Branding" description="Core platform naming and flag rules.">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <ConfigField label="Short Name" className="lg:col-span-1">
                    <Input value={config.shortName} onChange={(e) => updateField('shortName', e.target.value)} className={INPUT_CLASS} />
                  </ConfigField>
                  <ConfigField label="Full Platform Name" className="lg:col-span-3">
                    <Input value={config.fullName} onChange={(e) => updateField('fullName', e.target.value)} className={INPUT_CLASS} />
                  </ConfigField>
                  <ConfigField label="Description" className="lg:col-span-4">
                    <Input value={config.description} onChange={(e) => updateField('description', e.target.value)} className={INPUT_CLASS} />
                  </ConfigField>
                </div>
              </Section>

              <Section title="Media & Assets" description="Upload platform icons and branding images.">
                <BaseScoreboardTable
                  entries={assetRows}
                  columns={assetColumns}
                  getRowKey={(item) => item.type}
                />
              </Section>

              <Section title="Feature Flags" description="Enable or disable platform modules.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ToggleItem title="Solve Notifications" desc="Real-time solve popups." checked={config.notifSolves} onToggle={() => toggleField('notifSolves')} />
                  <ToggleItem title="Enable Teams" desc="Enable team registration and management." checked={config.teamsEnabled} onToggle={() => toggleField('teamsEnabled')} />
                  <ToggleItem title="Hide Individual Ranking" desc="Hide personal scores from scoreboard." checked={config.hideScoreboardIndividual} onToggle={() => toggleField('hideScoreboardIndividual')} />
                  <ToggleItem title="Hide Scoreboard Total" desc="Hide the overall team scoreboard rank." checked={config.hideScoreboardTotal} onToggle={() => toggleField('hideScoreboardTotal')} />
                </div>
              </Section>
            </div>
          ) : (
            <div className="space-y-4">
              <Section title="Database Engine" description="Supabase connection credentials.">
                <div className="space-y-4">
                  <ConfigField label="Project URL">
                    <Input value={secret.supabaseUrl} onChange={(e) => updateSecretField('supabaseUrl', e.target.value)} className={MONO_INPUT_CLASS} />
                  </ConfigField>
                  <ConfigField label="Anon Public Key">
                    <Input value={secret.supabaseAnonKey} onChange={(e) => updateSecretField('supabaseAnonKey', e.target.value)} className={MONO_INPUT_CLASS} />
                  </ConfigField>
                </div>
              </Section>

              <Section title="Orchestrator" description="Automation for challenge instances.">
                <div className="space-y-4">
                  <ToggleItem title="Enable Orchestrator" desc="Active NXCTL integration." checked={secret.nxctlEnabled} onToggle={() => toggleSecretField('nxctlEnabled')} />
                  <div className={cn("grid gap-4 transition-all duration-300", !secret.nxctlEnabled && "pointer-events-none opacity-40")}>
                    <ConfigField label="API Endpoint">
                      <Input value={secret.nxctlApiUrl} onChange={(e) => updateSecretField('nxctlApiUrl', e.target.value)} className={MONO_INPUT_CLASS} />
                    </ConfigField>
                    <ConfigField label="Access Token">
                      <Input type="password" value={secret.nxctlApiToken} onChange={(e) => updateSecretField('nxctlApiToken', e.target.value)} className={MONO_INPUT_CLASS} />
                    </ConfigField>
                    <ConfigField label="Admin Secret">
                      <Input type="password" value={secret.nxctlApiAdminSecret} onChange={(e) => updateSecretField('nxctlApiAdminSecret', e.target.value)} className={MONO_INPUT_CLASS} />
                    </ConfigField>
                  </div>
                </div>
              </Section>

              <Section title="Security" description="Captcha and anti-bot protection.">
                <div className="space-y-4">
                  <ToggleItem title="Cloudflare Turnstile" desc="Verify users are human." checked={secret.turnstileSiteKeyEnabled} onToggle={() => toggleSecretField('turnstileSiteKeyEnabled')} />
                  <ConfigField label="Site Key" className={cn("transition-all duration-300", !secret.turnstileSiteKeyEnabled && "pointer-events-none opacity-40")}>
                    <Input value={secret.turnstileSiteKey} onChange={(e) => updateSecretField('turnstileSiteKey', e.target.value)} className={MONO_INPUT_CLASS} />
                  </ConfigField>
                </div>
              </Section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <BaseScoreboardCard
      title={title}
      description={description}
      contentClassName="p-4 sm:p-5"
    >
      {children}
    </BaseScoreboardCard>
  )
}

function ConfigField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className={FIELD_LABEL_CLASS}>{label}</Label>
      {children}
    </div>
  )
}

function ToggleItem({ title, desc, checked, onToggle }: { title: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-gray-200/80 bg-white/50 px-4 py-3 transition-colors hover:bg-blue-50/40 dark:border-gray-800/80 dark:bg-[#111622]/60 dark:hover:bg-blue-900/10">
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-medium leading-4 text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  )
}

function AssetCurrentValue({ item }: { item: AssetConfigItem }) {
  const previewSrc = item.currentValue
    ? item.currentValue.startsWith('http')
      ? item.currentValue
      : `${item.currentValue.startsWith('/') ? '' : '/'}${item.currentValue}?t=${Date.now()}`
    : ''

  return (
    <div className="flex min-w-[220px] items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200/80 bg-white/60 dark:border-gray-800 dark:bg-gray-900/40">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt={item.label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold uppercase text-gray-400">NA</span>
        )}
      </div>
      <p className="min-w-0 truncate font-mono text-xs font-medium text-gray-500 dark:text-gray-400">
        {item.currentValue || 'No file'}
      </p>
    </div>
  )
}

function UploadAction({
  type,
  uploading,
  onUpload,
}: {
  type: AssetConfigItem['type']
  uploading: boolean
  onUpload: (file: File, type: string) => void
}) {
  return (
    <div className="relative inline-flex">
      <input
        type="file"
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file, type)
        }}
        disabled={uploading}
        accept={type === 'icon' ? '.ico' : 'image/*'}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8 border-blue-500/20 text-blue-600 hover:bg-blue-500/5 dark:text-blue-400"
        disabled={uploading}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Upload
      </Button>
    </div>
  )
}


