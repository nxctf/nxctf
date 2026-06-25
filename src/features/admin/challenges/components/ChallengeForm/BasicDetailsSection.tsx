import React from 'react'
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '@/shared/ui'
import { CheckCircle2, Wrench, Settings, FolderOpen } from 'lucide-react'
import { ChallengeFormData, Event } from '../../types'
import { supabase } from '@/lib/supabase/client'
import APP from '@/config'
import {
  ADMIN_FORM_FIELD_CLASS,
  ADMIN_FORM_GRID_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SELECT_CONTENT_CLASS,
  ADMIN_SELECT_TRIGGER_CLASS,
} from '@/features/admin/ui/form-field-styles'
import { ChallengeFormToggle } from './ChallengeFormToggle'

interface BasicDetailsSectionProps {
  formData: ChallengeFormData
  onChange: (data: ChallengeFormData) => void
  events?: Event[]
  categories: string[]
  hideMainEventOption?: boolean
}

export const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = ({
  formData,
  onChange,
  events,
  categories,
  hideMainEventOption
}) => {
  const [mainCat, subCat] = React.useMemo(() => {
    const category = formData.category || ''
    const idx = category.indexOf('/')
    if (idx === -1) return [category, '']
    return [category.slice(0, idx), category.slice(idx + 1)]
  }, [formData.category])

  const [advancedMode, setAdvancedMode] = React.useState(false)

  React.useEffect(() => {
    if (formData.category) {
      const hasSub = formData.category.includes('/')
      const parent = formData.category.split('/')[0]
      const defaultParents = (categories || []).map(c => c.split('/')[0])
      const isCustomParent = parent && !defaultParents.includes(parent)
      if (hasSub || isCustomParent) {
        setAdvancedMode(true)
      }
    }
  }, [formData.category, categories])

  const parentCategories = React.useMemo(() => {
    const parents = (categories || []).map(c => c.split('/')[0])
    if (mainCat && !parents.includes(mainCat)) {
      parents.push(mainCat)
    }
    return Array.from(new Set(parents)).filter(Boolean)
  }, [categories, mainCat])

  const [dbSubCategories, setDbSubCategories] = React.useState<string[]>([])

  React.useEffect(() => {
    async function fetchSubCategories() {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('category')
        if (data) {
          const subs = data
            .map(row => row.category)
            .filter((c): c is string => typeof c === 'string' && c.includes('/'))
            .map(c => c.split('/')[1])
          setDbSubCategories(Array.from(new Set(subs)).filter(Boolean))
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchSubCategories()
  }, [])

  // combinedSubCategories: config subs first (as the ordering hint),
  // then any DB subs not already covered by config.
  const combinedSubCategories = React.useMemo(() => {
    const configSubs = APP.challengeSubCategories || []
    const seen = new Set(configSubs.map(s => s.toLowerCase()))
    const extras: string[] = []
    for (const sub of dbSubCategories) {
      if (sub && !seen.has(sub.toLowerCase())) {
        seen.add(sub.toLowerCase())
        extras.push(sub)
      }
    }
    return [...configSubs, ...extras].filter(Boolean)
  }, [dbSubCategories])

  const handleMainCatChange = (newMain: string) => {
    onChange({ ...formData, category: newMain })
  }

  const handleParentCatTextChange = (newMain: string) => {
    const nextCategory = subCat ? `${newMain}/${subCat}` : newMain
    onChange({ ...formData, category: nextCategory })
  }

  const handleSubCatChange = (newSub: string) => {
    const sanitizedSub = newSub.replace(/\//g, '')
    const nextCategory = sanitizedSub ? `${mainCat}/${sanitizedSub}` : mainCat
    onChange({ ...formData, category: nextCategory })
  }

  const handleToggleAdvanced = () => {
    setAdvancedMode(!advancedMode)
  }

  return (
    <div className={ADMIN_FORM_GRID_CLASS}>
      {/* Top row: Switches */}
      <div className="md:col-span-2 flex flex-wrap items-center gap-4">
        <ChallengeFormToggle
          checked={formData.is_active !== false}
          label="Active"
          icon={CheckCircle2}
          activeClassName="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300"
          onChange={v => onChange({ ...formData, is_active: v })}
        />
        <ChallengeFormToggle
          checked={!!formData.is_maintenance}
          label="Maintenance"
          icon={Wrench}
          activeClassName="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300"
          onChange={v => onChange({ ...formData, is_maintenance: v })}
        />
      </div>

      {/* Row 1: Title & Category */}
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <Label>Title</Label>
        <Input
          required
          value={formData.title}
          onChange={e => onChange({ ...formData, title: e.target.value })}
          className={ADMIN_INPUT_CLASS}
        />
      </div>
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <div className="flex items-center justify-between mb-2">
          <Label className="mb-0">Category</Label>
          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleAdvanced}
            className={`h-7 px-2 text-xs flex items-center gap-1.5 rounded-lg border transition ${advancedMode
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                : 'border-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              }`}
          >
            <Settings size={13} />
            <span>Advanced Settings</span>
          </Button>
        </div>
        <Select
          value={mainCat}
          onValueChange={handleMainCatChange}
          disabled={advancedMode}
        >
          <SelectTrigger className={`${ADMIN_SELECT_TRIGGER_CLASS} ${advancedMode ? 'opacity-60 cursor-not-allowed bg-gray-900/50' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            {parentCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {advancedMode && (
        <>
          <div className={ADMIN_FORM_FIELD_CLASS}>
            <Label>Parent Category</Label>
            <Input
              value={mainCat}
              onChange={e => handleParentCatTextChange(e.target.value)}
              placeholder="Parent Category (e.g. Linux)"
              className={ADMIN_INPUT_CLASS}
            />
          </div>
          <div className={ADMIN_FORM_FIELD_CLASS}>
            <Label>Sub-category</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={subCat}
                  onChange={e => handleSubCatChange(e.target.value)}
                  placeholder="Sub-category (e.g. Fundamentals)"
                  className={ADMIN_INPUT_CLASS}
                />
              </div>
              <Select onValueChange={handleSubCatChange}>
                <SelectTrigger className="h-10 px-3 flex items-center gap-1.5 border-gray-700 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 shrink-0 w-auto min-w-[100px]" title="Choose from existing sub-categories">
                  <FolderOpen size={15} className="shrink-0" />
                  <span className="text-xs font-semibold">Import</span>
                </SelectTrigger>
                <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
                  {combinedSubCategories.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500 text-center">No existing sub-categories</div>
                  ) : (
                    combinedSubCategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                disabled={!subCat}
                onClick={() => handleSubCatChange('')}
                className="h-10 w-10 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 disabled:pointer-events-none shrink-0"
                title="Clear sub-category"
              >
                ✕
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Row 2: Event & Difficulty */}
      {events && (
        <div className={ADMIN_FORM_FIELD_CLASS}>
          <Label>Event</Label>
          <Select
            value={formData.event_id ?? '__main__'}
            onValueChange={v => onChange({ ...formData, event_id: v === '__main__' ? null : v })}
          >
            <SelectTrigger className={ADMIN_SELECT_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
            <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
              {!hideMainEventOption && (
                <SelectItem value="__main__">{String(APP.eventMainLabel || 'Main')}</SelectItem>
              )}
              {events.map((evt: Event) => (
                <SelectItem key={evt.id} value={evt.id}>{String(evt?.name ?? 'Untitled')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <Label>Difficulty</Label>
        <Select value={formData.difficulty} onValueChange={v => onChange({ ...formData, difficulty: v })}>
          <SelectTrigger className={ADMIN_SELECT_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            {Object.keys(APP.difficultyStyles || {}).map(key => {
              const label = key.charAt(0).toUpperCase() + key.slice(1)
              return <SelectItem key={key} value={label}>{label}</SelectItem>
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
