"use client"

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  GripVertical,
  Info,
  Key,
  Loader2,
  Plus,
  Save,
  Settings2,
  X,
} from 'lucide-react'

import { Badge, Button, Dialog, DialogContent, DialogTitle, Input, Label, Switch } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { httpClient } from '@/lib/http/client'

type SetupConfig = {
  shortName: string
  fullName: string
  description: string
  flagFormat: string
  challengeCategories: string[]
  notifSolves: boolean
  teamsEnabled: boolean
  hideScoreboardIndividual: boolean
  hideScoreboardTotal: boolean
  hideEventMain: boolean
  eventMainLabel: string
  eventMainImageUrl: string
  eventFallbackImageUrl: string
  image_icon: string
  image_logo: string
  image_preview: string
  discord: string
}

type SecretConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
  turnstileSiteKey: string
  turnstileSiteKeyEnabled: boolean
  nxctlEnabled: boolean
  nxctlApiUrl: string
  nxctlApiToken: string
}

const emptyConfig: SetupConfig = {
  shortName: '',
  fullName: '',
  description: '',
  flagFormat: '',
  challengeCategories: [],
  notifSolves: false,
  teamsEnabled: false,
  hideScoreboardIndividual: false,
  hideScoreboardTotal: false,
  hideEventMain: false,
  eventMainLabel: '',
  eventMainImageUrl: '',
  eventFallbackImageUrl: '',
  image_icon: '',
  image_logo: '',
  image_preview: '',
  discord: '',
}

const emptySecret: SecretConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  turnstileSiteKey: '',
  turnstileSiteKeyEnabled: false,
  nxctlEnabled: false,
  nxctlApiUrl: '',
  nxctlApiToken: '',
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
  const [categoryDraft, setCategoryDraft] = useState('')
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
      const data = await httpClient.get('config', { cache: 'no-store' }).json<any>()
      if (!data.ok) throw new Error(data.error || 'Failed to load config')
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
      const data = await httpClient.put('config', { json: payload }).json<any>()
      if (!data.ok) throw new Error(data.error || 'Failed to save')

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

  const toggleField = (key: keyof Pick<SetupConfig, 'notifSolves' | 'teamsEnabled' | 'hideScoreboardIndividual' | 'hideScoreboardTotal' | 'hideEventMain'>) => {
    setConfig((current) => ({ ...current, [key]: !current[key] }))
  }

  const toggleSecretField = (key: keyof Pick<SecretConfig, 'turnstileSiteKeyEnabled' | 'nxctlEnabled'>) => {
    setSecret((current) => ({ ...current, [key]: !current[key] }))
  }

  const addCategory = () => {
    const value = categoryDraft.trim()
    if (!value) return
    setConfig((current) => {
      if (current.challengeCategories.some(c => c.toLowerCase() === value.toLowerCase())) return current
      return { ...current, challengeCategories: [...current.challengeCategories, value] }
    })
    setCategoryDraft('')
  }

  const removeCategory = (value: string) => {
    setConfig((current) => ({
      ...current,
      challengeCategories: current.challengeCategories.filter(c => c !== value),
    }))
  }

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setConfig((current) => {
      const oldIndex = current.challengeCategories.indexOf(String(active.id))
      const newIndex = current.challengeCategories.indexOf(String(over.id))
      return { ...current, challengeCategories: arrayMove(current.challengeCategories, oldIndex, newIndex) }
    })
  }

  const handleFileUpload = async (file: File, type: string) => {
    setUploadingType(type)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const data = await httpClient.post('config', { body: formData }).json<any>()
      if (!data.ok) throw new Error(data.error || 'Upload failed')

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('w-[calc(100vw-32px)] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl bg-card border border-border text-card-foreground rounded-2xl p-0 overflow-hidden', "max-h-[90vh] overflow-hidden flex flex-col p-0 border border-gray-200 dark:border-gray-800")}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between gap-4 bg-white/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/20">
              <Settings2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Platform Setup</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-[9px] py-0 px-2 font-black uppercase tracking-widest">Dev Only</Badge>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                  <Info size={10} />
                  {activeTab === 'config' ? 'src/config.ts' : '.env.local'}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={saveConfig}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl font-bold h-10 px-8 transition-all active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-800"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Tabs - Pill style */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800/60">
          <div className="inline-flex p-1 bg-gray-100/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/30">
            <TabButton
              active={activeTab === 'config'}
              onClick={() => setActiveTab('config')}
              label="Application"
              icon={<FileJson size={14} />}
            />
            <TabButton
              active={activeTab === 'secret'}
              onClick={() => setActiveTab('secret')}
              label="Infrastructure"
              icon={<Key size={14} />}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-hidden">
          <AnimatePresence mode="wait">
            {(message || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-4 rounded-xl border flex items-center gap-3",
                  message ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                )}
              >
                {message ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-bold">{message || error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
              <p className="text-sm font-medium uppercase tracking-widest">Loading...</p>
            </div>
          ) : activeTab === 'config' ? (
            <div className="space-y-10">
              <Section title="Identity & Branding" description="Core platform naming and flag rules.">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Short Name</Label>
                    <Input value={config.shortName} onChange={(e) => updateField('shortName', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4"} />
                  </div>
                  <div className="lg:col-span-3">
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Full Platform Name</Label>
                    <Input value={config.fullName} onChange={(e) => updateField('fullName', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4"} />
                  </div>
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Flag Format</Label>
                    <Input value={config.flagFormat} onChange={(e) => updateField('flagFormat', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-blue-500 dark:text-blue-400"} />
                  </div>
                  <div className="lg:col-span-2">
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Description</Label>
                    <Input value={config.description} onChange={(e) => updateField('description', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4"} />
                  </div>
                </div>
              </Section>

              <Section title="Media & Assets" description="Upload platform icons and branding images.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <UploadItem
                    label="Platform Icon (.ico)"
                    currentValue={config.image_icon}
                    onUpload={handleFileUpload}
                    uploading={uploadingType === 'icon'}
                    type="icon"
                  />
                  <UploadItem
                    label="Logo Image (SVG/PNG)"
                    currentValue={config.image_logo}
                    onUpload={handleFileUpload}
                    uploading={uploadingType === 'logo'}
                    type="logo"
                  />
                  <UploadItem
                    label="OG Preview Image (PNG)"
                    currentValue={config.image_preview}
                    onUpload={handleFileUpload}
                    uploading={uploadingType === 'preview'}
                    type="preview"
                  />
                </div>
              </Section>

              <Section title="Challenge Categories" description="Manage challenge classifications.">
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      value={categoryDraft}
                      onChange={(e) => setCategoryDraft(e.target.value)}
                      placeholder="Add new category..."
                      className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-11 px-4"}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <Button onClick={addCategory} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-11 w-11 rounded-xl shadow-lg shadow-blue-500/20"><Plus className="w-6 h-6" /></Button>
                  </div>
                  <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleCategoryDragEnd}>
                    <SortableContext items={config.challengeCategories} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-wrap gap-2">
                        {config.challengeCategories.map((cat) => (
                          <SortableCategoryItem key={cat} id={cat} label={cat} onRemove={() => removeCategory(cat)} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </Section>

              <Section title="Feature Flags" description="Enable or disable platform modules.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ToggleItem title="Solve Notifications" desc="Real-time solve popups." checked={config.notifSolves} onToggle={() => toggleField('notifSolves')} />
                  <ToggleItem title="Enable Teams" desc="Enable team registration and management." checked={config.teamsEnabled} onToggle={() => toggleField('teamsEnabled')} />
                  <ToggleItem title="Hide Individual Ranking" desc="Hide personal scores from scoreboard." checked={config.hideScoreboardIndividual} onToggle={() => toggleField('hideScoreboardIndividual')} />
                  <ToggleItem title="Hide Scoreboard Total" desc="Hide the overall team scoreboard rank." checked={config.hideScoreboardTotal} onToggle={() => toggleField('hideScoreboardTotal')} />
                </div>
              </Section>

              <Section title="Event Showcase" description="Configure the default event section.">
                <div className="space-y-6">
                  <ToggleItem title="Show Event Default/Main" desc="Display the main event if no event_id is specified." checked={!config.hideEventMain} onToggle={() => toggleField('hideEventMain')} />
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Event Label</Label>
                        <Input value={config.eventMainLabel} onChange={(e) => updateField('eventMainLabel', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4"} />
                      </div>
                      <div>
                        <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Discord Invite URL</Label>
                        <Input value={config.discord} onChange={(e) => updateField('discord', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Banner Image URL</Label>
                      <Input value={config.eventMainImageUrl} onChange={(e) => updateField('eventMainImageUrl', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                    </div>
                    <div>
                      <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Fallback Banner</Label>
                      <Input value={config.eventFallbackImageUrl} onChange={(e) => updateField('eventFallbackImageUrl', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          ) : (
            <div className="space-y-10">
              <Section title="Database Engine" description="Supabase connection credentials.">
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Project URL</Label>
                    <Input value={secret.supabaseUrl} onChange={(e) => updateSecretField('supabaseUrl', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                  </div>
                  <div>
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Anon Public Key</Label>
                    <Input value={secret.supabaseAnonKey} onChange={(e) => updateSecretField('supabaseAnonKey', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                  </div>
                </div>
              </Section>

              <Section title="Orchestrator" description="Automation for challenge instances.">
                <div className="space-y-6">
                  <ToggleItem title="Enable Orchestrator" desc="Active NXCTL integration." checked={secret.nxctlEnabled} onToggle={() => toggleSecretField('nxctlEnabled')} />
                  <div className={cn("grid gap-6 transition-all duration-300", !secret.nxctlEnabled && "opacity-40 pointer-events-none scale-[0.98]")}>
                    <div>
                      <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">API Endpoint</Label>
                      <Input value={secret.nxctlApiUrl} onChange={(e) => updateSecretField('nxctlApiUrl', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                    </div>
                    <div>
                      <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Access Token</Label>
                      <Input type="password" value={secret.nxctlApiToken} onChange={(e) => updateSecretField('nxctlApiToken', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Security" description="Captcha and anti-bot protection.">
                <div className="space-y-6">
                  <ToggleItem title="Cloudflare Turnstile" desc="Verify users are human." checked={secret.turnstileSiteKeyEnabled} onToggle={() => toggleSecretField('turnstileSiteKeyEnabled')} />
                  <div className={cn("transition-all duration-300", !secret.turnstileSiteKeyEnabled && "opacity-40 pointer-events-none scale-[0.98]")}>
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Site Key</Label>
                    <Input value={secret.turnstileSiteKey} onChange={(e) => updateSecretField('turnstileSiteKey', e.target.value)} className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60' + " h-10 px-4 font-mono text-[11px]"} />
                  </div>
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
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h4 className={cn('text-xs font-bold uppercase tracking-widest text-muted-foreground', "text-blue-500 dark:text-blue-400 flex items-center gap-2")}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
          {title}
        </h4>
        <p className={'text-xs text-muted-foreground'}>{description}</p>
      </div>
      <div className="bg-white/40 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.05] p-6 rounded-2xl shadow-sm">
        {children}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all",
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/80 dark:hover:bg-gray-800/80"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function ToggleItem({ title, desc, checked, onToggle }: { title: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/40 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.05] transition-all hover:border-blue-500/30">
      <div className="pr-4">
        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{title}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight mt-1.5 font-medium">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  )
}

function UploadItem({
  label,
  currentValue,
  onUpload,
  uploading,
  type
}: {
  label: string;
  currentValue: string;
  onUpload: (file: File, type: string) => void;
  uploading: boolean;
  type: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</Label>
      <div className="flex items-center gap-4 p-3 rounded-xl bg-white/40 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.05]">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
          {currentValue ? (
            <img src={currentValue.startsWith('http') ? currentValue : `/${currentValue}?t=${Date.now()}`} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="text-[10px] text-gray-400 uppercase font-black">NA</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">{currentValue || 'No file'}</p>
        </div>
        <div className="relative">
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
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
            className="h-8 text-[10px] font-black uppercase tracking-widest rounded-lg border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5"
            disabled={uploading}
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} className="mr-1.5" />}
            Upload
          </Button>
        </div>
      </div>
    </div>
  )
}

function SortableCategoryItem({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 bg-white/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] pl-2.5 pr-3 py-2 rounded-xl text-xs font-bold transition-all",
        isDragging ? "shadow-2xl border-blue-600 scale-105 z-50 ring-4 ring-blue-600/10" : "hover:border-blue-500/30"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-blue-500">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="text-gray-900 dark:text-gray-200">{label}</span>
      <button onClick={onRemove} className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
