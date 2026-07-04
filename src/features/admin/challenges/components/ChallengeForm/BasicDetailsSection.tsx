import React from 'react'
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import { CheckCircle2, Wrench } from 'lucide-react'
import { ChallengeFormData, Event } from '../../types'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import APP from '@/config'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { cn } from '@/shared/lib/utils'
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
  isEdit?: boolean
}

export const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = ({
  formData,
  onChange,
  events,
  categories,
  hideMainEventOption,
  isEdit = false
}) => {
  const { settings } = useSystemSettings()
  const { subCategories: globalSubCategories } = useCategories()

  const [mainCat, subCat] = React.useMemo(() => {
    const category = formData.category || ''
    const idx = category.indexOf('/')
    if (idx === -1) return [category, '']
    return [category.slice(0, idx), category.slice(idx + 1)]
  }, [formData.category])

  const combinedSubCategories = React.useMemo(() => {
    return globalSubCategories.map(s => s.name)
  }, [globalSubCategories])

  const handleMainCatChange = (newMain: string) => {
    if (newMain === '__none__') return
    const nextCategory = subCat ? `${newMain}/${subCat}` : newMain
    onChange({ ...formData, category: nextCategory })
  }

  const handleSubCatChange = (newSub: string) => {
    const nextCategory = newSub && newSub !== 'none' ? `${mainCat}/${newSub}` : mainCat
    onChange({ ...formData, category: nextCategory })
  }

  const hasNoCategory = !isEdit && !mainCat
  const hasNoEvent = !isEdit && formData.event_id === ''
  const hasNoDifficulty = !isEdit && !formData.difficulty

  const eventValue = formData.event_id === null ? '__main__' : (formData.event_id || '__none__')
  const difficultyValue = formData.difficulty || '__none__'

  return (
    <div className={ADMIN_FORM_GRID_CLASS}>
      
      {/* Toggles */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <ChallengeFormToggle
          checked={formData.is_active}
          label="Active"
          icon={CheckCircle2}
          activeClassName="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300"
          onChange={v => onChange({ ...formData, is_active: v })}
        />
        <ChallengeFormToggle
          checked={formData.is_maintenance}
          label="Maintenance"
          icon={Wrench}
          activeClassName="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300"
          onChange={v => onChange({ ...formData, is_maintenance: v })}
        />
      </div>

      {/* Row 1: Title (Full Width) */}
      <div className={`${ADMIN_FORM_FIELD_CLASS} md:col-span-2`}>
        <Label>Title</Label>
        <Input
          required
          value={formData.title}
          onChange={e => onChange({ ...formData, title: e.target.value })}
          className={ADMIN_INPUT_CLASS}
        />
      </div>

      {/* Row 2: Category */}
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <Label className={cn(hasNoCategory && "text-amber-500 font-bold")}>Category</Label>
        <Select
          value={mainCat || '__none__'}
          onValueChange={handleMainCatChange}
        >
          <SelectTrigger className={cn(
            ADMIN_SELECT_TRIGGER_CLASS,
            hasNoCategory && "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 focus:ring-amber-500/30"
          )}>
            <SelectValue placeholder="Select parent category" />
          </SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            <SelectItem value="__none__" disabled className="text-gray-400 dark:text-gray-500">Select parent category...</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Subcategory (Optional) */}
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <Label>Subcategory (Optional)</Label>
        <Select
          value={subCat || 'none'}
          onValueChange={handleSubCatChange}
          disabled={hasNoCategory}
        >
          <SelectTrigger className={ADMIN_SELECT_TRIGGER_CLASS}>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            <SelectItem value="none">None</SelectItem>
            {combinedSubCategories.map(sub => (
              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 3: Event & Difficulty */}
      {events && (
        <div className={ADMIN_FORM_FIELD_CLASS}>
          <Label className={cn(hasNoEvent && "text-amber-500 font-bold")}>Event</Label>
          <Select
            value={eventValue}
            onValueChange={v => onChange({ ...formData, event_id: v === '__none__' ? '' : (v === '__main__' ? null : v) })}
          >
            <SelectTrigger className={cn(
              ADMIN_SELECT_TRIGGER_CLASS,
              hasNoEvent && "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 focus:ring-amber-500/30"
            )}>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
              <SelectItem value="__none__" disabled className="text-gray-400 dark:text-gray-500">Select event...</SelectItem>
              {!hideMainEventOption && (
                <SelectItem value="__main__">{String(settings.event_main_label || 'Main (Global Event)')}</SelectItem>
              )}
              {events.map((evt: Event) => (
                <SelectItem key={evt.id} value={evt.id}>{String(evt?.name ?? 'Untitled')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className={ADMIN_FORM_FIELD_CLASS}>
        <Label className={cn(hasNoDifficulty && "text-amber-500 font-bold")}>Difficulty</Label>
        <Select
          value={difficultyValue}
          onValueChange={v => onChange({ ...formData, difficulty: v === '__none__' ? '' : v })}
        >
          <SelectTrigger className={cn(
            ADMIN_SELECT_TRIGGER_CLASS,
            hasNoDifficulty && "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 focus:ring-amber-500/30"
          )}>
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent className={ADMIN_SELECT_CONTENT_CLASS}>
            <SelectItem value="__none__" disabled className="text-gray-400 dark:text-gray-500">Select difficulty...</SelectItem>
            {Object.keys(APP.difficultyStyles).map(key => {
              const label = key.charAt(0).toUpperCase() + key.slice(1)
              return <SelectItem key={key} value={label}>{label}</SelectItem>
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
